require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsSessionToken: process.env.AWS_SESSION_TOKEN,
  cognitoClientId: process.env.COGNITO_CLIENT_ID,
  cognitoClientSecret: process.env.COGNITO_CLIENT_SECRET,
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
  usersTable: process.env.USERS_TABLE || process.env.REACT_APP_USERS_TABLE,
  contactHandlerFunctionName: process.env.CONTACT_HANDLER_FUNCTION_NAME,
  uploadImageFunctionName: process.env.UPLOAD_IMAGE_FUNCTION_NAME,
};

const requiredRuntimeConfig = ['cognitoClientId', 'usersTable'];

function getAwsConfig() {
  const awsConfig = { region: env.awsRegion };

  if (env.awsAccessKeyId && env.awsSecretAccessKey) {
    awsConfig.accessKeyId = env.awsAccessKeyId;
    awsConfig.secretAccessKey = env.awsSecretAccessKey;
  }

  if (env.awsSessionToken) {
    awsConfig.sessionToken = env.awsSessionToken;
  }

  return awsConfig;
}

function warnMissingRuntimeConfig() {
  const missingKeys = requiredRuntimeConfig.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    console.warn(`Missing backend environment config: ${missingKeys.join(', ')}`);
  }
}

module.exports = {
  env,
  getAwsConfig,
  warnMissingRuntimeConfig,
};
