import { CognitoUserPool } from "amazon-cognito-identity-js";
import { env } from "../../config/env";

const poolData = {
    UserPoolId: env.cognitoUserPoolId,
    ClientId: env.cognitoClientId,
};

const UserPool = new CognitoUserPool(poolData);

export default UserPool;
