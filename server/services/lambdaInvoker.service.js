const { lambda } = require('../config/aws');

async function invokeJsonLambda(functionName, body) {
  if (!functionName) {
    throw new Error('Lambda function name is not configured');
  }

  const result = await lambda.invoke({
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      body: JSON.stringify(body),
    }),
  }).promise();

  const response = JSON.parse(result.Payload || '{}');
  const responseBody = response.body ? JSON.parse(response.body) : {};

  return {
    statusCode: response.statusCode || 200,
    body: responseBody,
  };
}

module.exports = {
  invokeJsonLambda,
};
