const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

export const env = {
  apiBaseUrl: trimTrailingSlash(process.env.REACT_APP_API_BASE_URL || ''),
  websocketUrl: process.env.REACT_APP_WEBSOCKET_URL || '',
  cognitoUserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
  cognitoClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
  cognitoClientSecret: process.env.REACT_APP_COGNITO_CLIENT_SECRET || '',
  awsRegion: process.env.REACT_APP_AWS_REGION || process.env.REACT_APP_REGION || 'us-east-1',
  defaultAdminEmail: process.env.REACT_APP_DEFAULT_ADMIN_EMAIL || '',
  newsletterEndpoint: process.env.REACT_APP_NEWSLETTER_ENDPOINT || '',
  contactEmail: process.env.REACT_APP_CONTACT_EMAIL || 'contact@brewcraft.com',
};
