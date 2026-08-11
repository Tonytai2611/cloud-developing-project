import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "us-east-1_KscihZw1o",
    ClientId: "5fjijmj2a8q3n919rga3mhlnpi",
};

const UserPool = new CognitoUserPool(poolData);

export default UserPool;
