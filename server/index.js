const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { serialize, parse } = require('cookie');
const { cognito, dynamodb, s3 } = require('./config/aws');
const { env, warnMissingRuntimeConfig } = require('./config/env');
const { invokeJsonLambda } = require('./services/lambdaInvoker.service');

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));

warnMissingRuntimeConfig();

const PORT = env.port;
const CLIENT_ID = env.cognitoClientId;
const CLIENT_SECRET = env.cognitoClientSecret;
const USERS_TABLE = env.usersTable;
const MENU_TABLE = env.menuTable;
const BOOKING_TABLE = env.bookingTable;
const TABLES_TABLE = env.tablesTable;
const IMAGE_BUCKET = env.imageBucket;

function getConfiguredTable(tableName, res, label) {
  if (!tableName) {
    res.status(500).json({ error: `Server misconfiguration: ${label} missing` });
    return null;
  }
  return tableName;
}

function buildUpdateExpression(data, reservedNames = new Set()) {
  const updateParts = [];
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'id' || value === undefined) return;

    const nameToken = reservedNames.has(key) ? `#${key}` : key;
    if (reservedNames.has(key)) ExpressionAttributeNames[nameToken] = key;

    updateParts.push(`${nameToken} = :${key}`);
    ExpressionAttributeValues[`:${key}`] = value;
  });

  return {
    UpdateExpression: updateParts.length > 0 ? `SET ${updateParts.join(', ')}` : '',
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
}

function generateSecretHash(username) {
  if (!CLIENT_SECRET) return undefined;
  return crypto.createHmac('sha256', CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest('base64');
}

app.post('/register', async (req, res) => {
  const { username, password, email, name } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: 'username/password/email required' });

  try {
    const secretHash = generateSecretHash(username);

    const params = {
      ClientId: CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        ...(name ? [{ Name: 'name', Value: name }] : [])
      ]
    };
    if (secretHash) params.SecretHash = secretHash;

    const signupResp = await cognito.signUp(params).promise();
    console.log('Cognito signUp response:', signupResp);

    // Return CodeDeliveryDetails so client knows where code sent
    res.json({ message: 'User registered in Cognito', signupResp });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'brewcraft-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// confirm: confirm code then write to DynamoDB
app.post('/confirm', async (req, res) => {
  // Accept optional email/name/role from client to avoid relying on adminGetUser.
  let { username, code, verificationCode, email, name, role } = req.body || {};
  const confirmationCode = code || verificationCode;
  if (!username || !confirmationCode) return res.status(400).json({ error: 'username and confirmation code required' });

  try {
    const params = { ClientId: CLIENT_ID, Username: username, ConfirmationCode: confirmationCode };
    const secretHash = generateSecretHash(username);
    if (secretHash) params.SecretHash = secretHash;

    await cognito.confirmSignUp(params).promise();
    console.log(`User ${username} confirmed in Cognito`);

    // If client didn't send email/name, try adminGetUser as a fallback
    if ((!email || !name) && env.cognitoUserPoolId) {
      try {
        const adminResp = await cognito.adminGetUser({ UserPoolId: env.cognitoUserPoolId, Username: username }).promise();
        const attrs = adminResp.UserAttributes || [];
        if (!email) email = attrs.find(a => a.Name === 'email')?.Value || null;
        if (!name) name = attrs.find(a => a.Name === 'name')?.Value || null;
      } catch (e) {
        console.warn('adminGetUser failed:', e.message || e);
      }
    }

    if (!USERS_TABLE) {
      console.error('USERS_TABLE not configured, cannot write to DB');
      return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });
    }

    // Normalize username to lowercase for consistent DynamoDB storage
    const normalizedUsername = username.toLowerCase();

    const userItem = {
      id: normalizedUsername,
      username: normalizedUsername,
      email: email || 'No Email',
      name: name || 'No Name',
      role: role || 'customer', // Use role from client or default to 'customer'
      confirmedAt: new Date().toISOString()
    };

    try {
      await dynamodb.put({ TableName: USERS_TABLE, Item: userItem }).promise();
      console.log('DynamoDB put succeeded for', username);

      // If role is 'admin', add user to Cognito 'admin' group
      if (role === 'admin' && env.cognitoUserPoolId) {
        try {
          await cognito.adminAddUserToGroup({
            UserPoolId: env.cognitoUserPoolId,
            Username: normalizedUsername,
            GroupName: 'admin'
          }).promise();
          console.log(`User ${normalizedUsername} added to 'admin' group in Cognito`);
        } catch (groupErr) {
          console.warn('Failed to add user to admin group:', groupErr.message || groupErr);
          // Don't fail the entire request if group assignment fails
        }
      }

      return res.json({ message: 'User confirmed and saved to DB', item: userItem });
    } catch (putErr) {
      console.error('DynamoDB put error:', putErr);
      return res.status(500).json({ error: 'DynamoDB put failed', detail: putErr.message || putErr });
    }
  } catch (err) {
    console.error('Confirm Error:', err);
    return res.status(400).json({ error: err.message || err });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });

  try {
    const secretHash = generateSecretHash(username);

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      }
    };
    if (secretHash) params.AuthParameters.SECRET_HASH = secretHash;

    const response = await cognito.initiateAuth(params).promise();
    const auth = response.AuthenticationResult || {};

    // decode id token to build userInfo
    let userInfo = { username };
    if (auth.IdToken) {
      try {
        const payload = auth.IdToken.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        const groups = decoded['cognito:groups'];
        let isAdmin = false;
        if (Array.isArray(groups)) isAdmin = groups.includes('admin');
        if (typeof groups === 'string') isAdmin = groups.split(',').includes('admin');
        const email = decoded.email || null;
        userInfo = {
          username: email || username,
          cognitoUsername: decoded['cognito:username'] || null,
          email,
          name: decoded.name || null,
          role: isAdmin ? 'admin' : 'customer',
          isAdmin: isAdmin || false
        };
      } catch (e) {
        console.warn('Failed to parse IdToken', e.message || e);
      }
    }

    // set a non-httpOnly cookie for userInfo (matches CloudSample behavior)
    try {
      res.setHeader('Set-Cookie', [
        serialize('userInfo', JSON.stringify(userInfo), {
          sameSite: 'strict',
          secure: env.nodeEnv === 'production',
          path: '/',
          maxAge: 60 * 60 * 24,
        }),
      ]);
    } catch (e) {
      console.warn('Failed to set cookie:', e.message || e);
    }

    res.json({
      message: 'Login successful',
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
      refreshToken: auth.RefreshToken,
      userInfo,
      isAdmin: userInfo.isAdmin,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Get current user info from cookie
app.get('/me', (req, res) => {
  try {
    const cookies = parse(req.headers.cookie || '');
    const userInfoStr = cookies.userInfo;

    if (!userInfoStr) {
      // No cookie = not logged in, return null instead of error
      return res.json({ userInfo: null });
    }

    const userInfo = JSON.parse(userInfoStr);
    return res.json({ userInfo });
  } catch (error) {
    console.error('Error parsing userInfo cookie:', error);
    return res.json({ userInfo: null });
  }
});

// Logout - clear cookies
app.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', [
    serialize('userInfo', '', {
      httpOnly: false,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    }),
  ]);
  return res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/getMenu', async (req, res) => {
  const tableName = getConfiguredTable(MENU_TABLE, res, 'MENU_TABLE');
  if (!tableName) return;

  try {
    const response = await dynamodb.scan({ TableName: tableName }).promise();
    return res.json({ message: 'Menu retrieved successfully', data: response.Items || [] });
  } catch (error) {
    console.error('GET /getMenu error:', error);
    return res.status(500).json({ error: 'Failed to read menu', detail: error.message });
  }
});

app.post('/createMenuItem', async (req, res) => {
  const tableName = getConfiguredTable(MENU_TABLE, res, 'MENU_TABLE');
  if (!tableName) return;

  const items = Array.isArray(req.body) ? req.body : [req.body];
  if (items.some(item => !item?.id || !item?.title || !item?.dishes)) {
    return res.status(400).json({ error: 'Missing required fields: id, title, dishes' });
  }

  try {
    await Promise.all(items.map(item => dynamodb.put({
      TableName: tableName,
      Item: { ...item, id: String(item.id) },
    }).promise()));

    const responseData = Array.isArray(req.body)
      ? items.map(item => ({ ...item, id: String(item.id) }))
      : { ...req.body, id: String(req.body.id) };

    return res.status(201).json({ message: 'Menu item created successfully', data: responseData });
  } catch (error) {
    console.error('POST /createMenuItem error:', error);
    return res.status(500).json({ error: 'Failed to create menu item', detail: error.message });
  }
});

app.put('/updateMenuItem', async (req, res) => {
  const tableName = getConfiguredTable(MENU_TABLE, res, 'MENU_TABLE');
  if (!tableName) return;

  const data = req.body || {};
  if (!data.id) return res.status(400).json({ error: 'Menu item id is required' });

  const update = buildUpdateExpression(data);
  if (!update.UpdateExpression) return res.status(400).json({ error: 'Nothing to update' });

  try {
    const response = await dynamodb.update({
      TableName: tableName,
      Key: { id: String(data.id) },
      UpdateExpression: update.UpdateExpression,
      ExpressionAttributeValues: update.ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }).promise();

    return res.json({ message: 'Menu item updated successfully', data: response.Attributes || {} });
  } catch (error) {
    console.error('PUT /updateMenuItem error:', error);
    return res.status(500).json({ error: 'Failed to update menu item', detail: error.message });
  }
});

app.delete('/deleteMenuItem', async (req, res) => {
  const tableName = getConfiguredTable(MENU_TABLE, res, 'MENU_TABLE');
  if (!tableName) return;

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Menu item id is required' });

  try {
    await dynamodb.delete({ TableName: tableName, Key: { id: String(id) } }).promise();
    return res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('DELETE /deleteMenuItem error:', error);
    return res.status(500).json({ error: 'Failed to delete menu item', detail: error.message });
  }
});

app.get('/getTable', async (req, res) => {
  const tableName = getConfiguredTable(TABLES_TABLE, res, 'TABLES_TABLE');
  if (!tableName) return;

  try {
    const response = await dynamodb.scan({ TableName: tableName }).promise();
    return res.json({ message: 'Tables retrieved successfully', data: response.Items || [] });
  } catch (error) {
    console.error('GET /getTable error:', error);
    return res.status(500).json({ error: 'Failed to read tables', detail: error.message });
  }
});

async function generateTableId() {
  const response = await dynamodb.scan({
    TableName: TABLES_TABLE,
    ProjectionExpression: 'id',
  }).promise();
  return `TBL-${String((response.Items || []).length + 1).padStart(3, '0')}`;
}

async function generateBookingId(date) {
  const normalizedDate = String(date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const response = await dynamodb.scan({
    TableName: BOOKING_TABLE,
    ProjectionExpression: 'id, #date',
    FilterExpression: '#date = :date',
    ExpressionAttributeNames: { '#date': 'date' },
    ExpressionAttributeValues: { ':date': date },
  }).promise();

  return `BK-${normalizedDate}-${String((response.Items || []).length + 1).padStart(3, '0')}`;
}

function normalizeBookingPayload(data) {
  const now = new Date().toISOString();
  return {
    id: data.id,
    userId: data.userId || data.email || 'guest',
    customerName: data.customerName || data.name || 'Customer',
    phone: data.phone || '',
    email: data.email || '',
    guests: Number(data.guests || 1),
    tableId: data.tableId || '',
    tableNumber: data.tableNumber || data.tableId || '',
    date: data.date,
    time: data.time,
    selectedItems: Array.isArray(data.selectedItems) ? data.selectedItems : [],
    total: Number(data.total || data.totalPrice || 0),
    totalPrice: Number(data.totalPrice || data.total || 0),
    specialRequests: data.specialRequests || '',
    status: data.status || 'PENDING',
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}

app.get('/getBooking', async (req, res) => {
  const tableName = getConfiguredTable(BOOKING_TABLE, res, 'BOOKING_TABLE');
  if (!tableName) return;

  const { userId } = req.query || {};

  try {
    const params = userId
      ? {
          TableName: tableName,
          FilterExpression: 'userId = :userId OR email = :userId',
          ExpressionAttributeValues: { ':userId': userId },
        }
      : { TableName: tableName };

    const response = await dynamodb.scan(params).promise();
    const items = (response.Items || []).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return res.json({ message: 'Bookings retrieved successfully', data: items });
  } catch (error) {
    console.error('GET /getBooking error:', error);
    return res.status(500).json({ error: 'Failed to read bookings', detail: error.message });
  }
});

app.post('/createBooking', async (req, res) => {
  const tableName = getConfiguredTable(BOOKING_TABLE, res, 'BOOKING_TABLE');
  if (!tableName) return;

  const data = req.body || {};
  if (!data.customerName || !data.phone || !data.email || !data.guests || !data.tableId || !data.date || !data.time) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }

  try {
    const conflict = await dynamodb.scan({
      TableName: tableName,
      FilterExpression: 'tableId = :tableId AND #date = :date AND #time = :time AND #status IN (:pending, :confirmed)',
      ExpressionAttributeNames: {
        '#date': 'date',
        '#time': 'time',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':tableId': data.tableId,
        ':date': data.date,
        ':time': data.time,
        ':pending': 'PENDING',
        ':confirmed': 'CONFIRMED',
      },
    }).promise();

    if ((conflict.Items || []).length > 0) {
      return res.status(409).json({ error: 'This table is already booked for the selected date and time' });
    }

    const id = await generateBookingId(data.date);
    const booking = normalizeBookingPayload({ ...data, id });

    await dynamodb.put({ TableName: tableName, Item: booking }).promise();
    return res.status(201).json({ message: 'Booking created successfully', data: booking });
  } catch (error) {
    console.error('POST /createBooking error:', error);
    return res.status(500).json({ error: 'Failed to create booking', detail: error.message });
  }
});

app.put('/updateBooking', async (req, res) => {
  const tableName = getConfiguredTable(BOOKING_TABLE, res, 'BOOKING_TABLE');
  if (!tableName) return;

  const data = req.body || {};
  if (!data.id) return res.status(400).json({ error: 'Booking id is required' });

  const update = buildUpdateExpression({ ...data, updatedAt: new Date().toISOString() }, new Set(['status', 'date', 'time']));
  if (!update.UpdateExpression) return res.status(400).json({ error: 'Nothing to update' });

  try {
    const params = {
      TableName: tableName,
      Key: { id: String(data.id) },
      UpdateExpression: update.UpdateExpression,
      ExpressionAttributeValues: update.ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    if (Object.keys(update.ExpressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = update.ExpressionAttributeNames;
    }

    const response = await dynamodb.update(params).promise();
    return res.json({ message: 'Booking updated successfully', data: response.Attributes || {} });
  } catch (error) {
    console.error('PUT /updateBooking error:', error);
    return res.status(500).json({ error: 'Failed to update booking', detail: error.message });
  }
});

app.delete('/deleteBooking', async (req, res) => {
  const tableName = getConfiguredTable(BOOKING_TABLE, res, 'BOOKING_TABLE');
  if (!tableName) return;

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Booking id is required' });

  try {
    await dynamodb.delete({ TableName: tableName, Key: { id: String(id) } }).promise();
    return res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('DELETE /deleteBooking error:', error);
    return res.status(500).json({ error: 'Failed to delete booking', detail: error.message });
  }
});

app.post('/createTable', async (req, res) => {
  const tableName = getConfiguredTable(TABLES_TABLE, res, 'TABLES_TABLE');
  if (!tableName) return;

  const data = { ...(req.body || {}) };
  if (!data.id) data.id = await generateTableId();
  if (!data.tableNumber || !data.seats) {
    return res.status(400).json({ error: 'Missing required fields: tableNumber, seats' });
  }

  data.id = String(data.id);
  data.status = data.status || 'AVAILABLE';
  if (!['AVAILABLE', 'RESERVED'].includes(data.status)) {
    return res.status(400).json({ error: 'Status must be AVAILABLE or RESERVED' });
  }

  try {
    await dynamodb.put({ TableName: tableName, Item: data }).promise();
    return res.status(201).json({ message: 'Table created successfully', data });
  } catch (error) {
    console.error('POST /createTable error:', error);
    return res.status(500).json({ error: 'Failed to create table', detail: error.message });
  }
});

app.put('/updateTable', async (req, res) => {
  const tableName = getConfiguredTable(TABLES_TABLE, res, 'TABLES_TABLE');
  if (!tableName) return;

  const data = req.body || {};
  if (!data.id) return res.status(400).json({ error: 'Table id is required' });
  if (data.status && !['AVAILABLE', 'RESERVED'].includes(data.status)) {
    return res.status(400).json({ error: 'Status must be AVAILABLE or RESERVED' });
  }

  const update = buildUpdateExpression(data, new Set(['status']));
  if (!update.UpdateExpression) return res.status(400).json({ error: 'Nothing to update' });

  try {
    const params = {
      TableName: tableName,
      Key: { id: String(data.id) },
      UpdateExpression: update.UpdateExpression,
      ExpressionAttributeValues: update.ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    if (Object.keys(update.ExpressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = update.ExpressionAttributeNames;
    }

    const response = await dynamodb.update(params).promise();
    return res.json({ message: 'Table updated successfully', data: response.Attributes || {} });
  } catch (error) {
    console.error('PUT /updateTable error:', error);
    return res.status(500).json({ error: 'Failed to update table', detail: error.message });
  }
});

app.delete('/deleteTable', async (req, res) => {
  const tableName = getConfiguredTable(TABLES_TABLE, res, 'TABLES_TABLE');
  if (!tableName) return;

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Table id is required' });

  try {
    const current = await dynamodb.get({ TableName: tableName, Key: { id: String(id) } }).promise();
    if (current.Item?.status === 'RESERVED') {
      return res.status(400).json({ error: 'Cannot delete table that is currently reserved' });
    }

    await dynamodb.delete({ TableName: tableName, Key: { id: String(id) } }).promise();
    return res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('DELETE /deleteTable error:', error);
    return res.status(500).json({ error: 'Failed to delete table', detail: error.message });
  }
});

// --- User CRUD endpoints (operate on USERS_TABLE)
// GET /user -> return current user's profile (from DynamoDB)
app.get('/user', async (req, res) => {
  const cookies = parse(req.headers.cookie || '');
  const userInfo = cookies.userInfo ? JSON.parse(cookies.userInfo) : null;
  if (!userInfo || !userInfo.username) return res.status(401).json({ error: 'Not authenticated' });
  if (!USERS_TABLE) return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });

  try {
    const normalizedUsername = userInfo.username.toLowerCase();
    console.log('[DEBUG] GET /user - Querying DynamoDB for username:', normalizedUsername);
    console.log('[DEBUG] Table name:', USERS_TABLE);
    const result = await dynamodb.get({ TableName: USERS_TABLE, Key: { id: normalizedUsername } }).promise();
    console.log('[DEBUG] DynamoDB result:', JSON.stringify(result, null, 2));
    if (!result.Item) {
      console.log('[DEBUG] User not found in DynamoDB. Username queried:', userInfo.username);
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ item: result.Item });
  } catch (e) {
    console.error('GET /user error:', e);
    return res.status(500).json({ error: 'Failed to read user' });
  }
});

// PUT /user -> update current user's profile (name,email)
app.put('/user', async (req, res) => {
  const cookies = parse(req.headers.cookie || '');
  const userInfo = cookies.userInfo ? JSON.parse(cookies.userInfo) : null;
  if (!userInfo || !userInfo.username) return res.status(401).json({ error: 'Not authenticated' });
  if (!USERS_TABLE) return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });

  const { name, email } = req.body || {};
  if (!name && !email) return res.status(400).json({ error: 'Nothing to update' });

  const updateParts = [];
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};

  if (name !== undefined) {
    updateParts.push('#n = :n');
    ExpressionAttributeNames['#n'] = 'name';
    ExpressionAttributeValues[':n'] = name;
  }
  if (email !== undefined) {
    updateParts.push('#e = :e');
    ExpressionAttributeNames['#e'] = 'email';
    ExpressionAttributeValues[':e'] = email;
  }

  const UpdateExpression = 'SET ' + updateParts.join(', ');

  try {
    // Normalize username to lowercase for consistent lookup
    const normalizedUsername = userInfo.username.toLowerCase();
    const resp = await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { id: normalizedUsername },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();
    return res.json({ item: resp.Attributes });
  } catch (e) {
    console.error('PUT /user error:', e);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /user -> delete current user's record from DynamoDB (does NOT delete Cognito user)
app.delete('/user', async (req, res) => {
  const cookies = parse(req.headers.cookie || '');
  const userInfo = cookies.userInfo ? JSON.parse(cookies.userInfo) : null;
  if (!userInfo || !userInfo.username) return res.status(401).json({ error: 'Not authenticated' });
  if (!USERS_TABLE) return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });

  try {
    // Normalize username to lowercase for consistent lookup
    const normalizedUsername = userInfo.username.toLowerCase();
    await dynamodb.delete({ TableName: USERS_TABLE, Key: { id: normalizedUsername } }).promise();
    // clear cookie
    res.setHeader('Set-Cookie', [serialize('userInfo', '', { path: '/', maxAge: 0 })]);
    return res.json({ message: 'User record deleted (Cognito user not deleted).' });
  } catch (e) {
    console.error('DELETE /user error:', e);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Contact Us endpoint - Invoke Lambda to trigger Step Functions
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, or message' });
  }

  try {
    const response = await invokeJsonLambda(env.contactHandlerFunctionName, { name, email, message });

    if (response.statusCode === 200) {
      return res.json(response.body);
    } else {
      return res.status(response.statusCode).json(response.body);
    }
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({ error: 'Failed to send message', detail: error.message });
  }
});

// Upload image endpoint
app.post('/upload', async (req, res) => {
  const { file, fileName } = req.body || {};
  if (!file || !fileName) {
    return res.status(400).json({ error: 'Missing file or fileName' });
  }
  if (!IMAGE_BUCKET) {
    return res.status(500).json({ error: 'Server misconfiguration: IMAGE_BUCKET missing' });
  }

  try {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `menu/${safeFileName}`;
    const body = Buffer.from(file, 'base64');
    const extension = safeFileName.split('.').pop()?.toLowerCase();
    const contentTypes = {
      gif: 'image/gif',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    await s3.putObject({
      Bucket: IMAGE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentTypes[extension] || 'application/octet-stream',
    }).promise();

    return res.json({
      message: 'File uploaded successfully!',
      url: `/images/${encodeURIComponent(key)}`,
      fileName: safeFileName,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({ error: 'Failed to upload image', detail: error.message });
  }
});

app.get('/images/:key(*)', async (req, res) => {
  if (!IMAGE_BUCKET) {
    return res.status(500).json({ error: 'Server misconfiguration: IMAGE_BUCKET missing' });
  }

  try {
    const key = decodeURIComponent(req.params.key);
    const response = await s3.getObject({ Bucket: IMAGE_BUCKET, Key: key }).promise();

    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(response.Body);
  } catch (error) {
    console.error('GET /images error:', error);
    return res.status(error.code === 'NoSuchKey' ? 404 : 500).json({
      error: 'Failed to read image',
      detail: error.message,
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
