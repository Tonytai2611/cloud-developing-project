/* One-time/repeat-safe backfill for the analytics summary projection.
 * Run with AWS credentials and:
 *   BOOKING_TABLE=... ANALYTICS_TABLE=... node scripts/backfill-analytics.js
 */
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION || 'us-east-1' });
const bookingsTable = process.env.BOOKING_TABLE;
const analyticsTable = process.env.ANALYTICS_TABLE;

if (!bookingsTable || !analyticsTable) {
  throw new Error('BOOKING_TABLE and ANALYTICS_TABLE are required');
}

const number = (value) => Number(value || 0);
const dateOf = (item) => String(item.createdAt || item.date || new Date().toISOString()).slice(0, 10);
const orderOf = (item) => number(item.totalPrice || item.total) > 0 || (item.selectedItems || []).length > 0;

function delta(item) {
  const status = String(item.status || 'PENDING').toUpperCase();
  const order = orderOf(item);
  const result = { totalBookings: 1, estimatedRevenue: number(item.totalPrice || item.total) };
  if (order) {
    result.totalOrders = 1;
    if (['PENDING', 'PREPARING'].includes(status)) result.pendingOrders = 1;
    if (['COMPLETED', 'CONFIRMED'].includes(status)) result.completedOrders = 1;
  } else {
    if (status === 'CONFIRMED') result.confirmedBookings = 1;
    if (status === 'PENDING') result.pendingBookings = 1;
    if (['CANCELLED', 'REJECTED'].includes(status)) result.cancelledBookings = 1;
    if (status === 'COMPLETED') result.completedBookings = 1;
  }
  return result;
}

async function scanAll(TableName) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const response = await dynamodb.scan({ TableName, ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}) }).promise();
    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function backfillItem(item) {
  const eventKey = `BACKFILL#${item.id}`;
  try {
    await dynamodb.put({ TableName: analyticsTable, Item: { pk: `EVENT#${eventKey}`, sk: 'PROCESSED', processedAt: new Date().toISOString() }, ConditionExpression: 'attribute_not_exists(pk)' }).promise();
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') return false;
    throw error;
  }
  const fields = delta(item);
  const names = {};
  const values = { ':zero': 0, ':updatedAt': new Date().toISOString() };
  const parts = Object.entries(fields).map(([field, value], index) => { names[`#f${index}`] = field; values[`:v${index}`] = value; return `#f${index} = if_not_exists(#f${index}, :zero) + :v${index}`; });
  await dynamodb.update({ TableName: analyticsTable, Key: { pk: `DAILY#${dateOf(item)}`, sk: 'SUMMARY' }, UpdateExpression: `SET ${parts.join(', ')}, updatedAt = :updatedAt`, ExpressionAttributeNames: names, ExpressionAttributeValues: values }).promise();
  return true;
}

(async () => {
  const items = await scanAll(bookingsTable);
  let processed = 0;
  for (const item of items) if (await backfillItem(item)) processed += 1;
  console.log(JSON.stringify({ scanned: items.length, processed }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
