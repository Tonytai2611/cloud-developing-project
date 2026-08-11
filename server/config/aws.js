const AWS = require('aws-sdk');
const { getAwsConfig } = require('./env');

AWS.config.update(getAwsConfig());

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

module.exports = {
  AWS,
  cognito,
  dynamodb,
  lambda,
};
