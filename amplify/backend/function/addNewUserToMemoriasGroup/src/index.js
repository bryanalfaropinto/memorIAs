/* Amplify Params - DO NOT EDIT
	AUTH_MEMORIAS9EB74F30_USERPOOLID
	ENV
	REGION
Amplify Params - DO NOT EDIT */ /* Amplify Params - DO NOT EDIT
    AUTH_MEMORIAS9EB74F30_USERPOOLID
    ENV
    REGION
Amplify Params - DO NOT EDIT */

// const AWS = require("aws-sdk");
// const cognito = new AWS.CognitoIdentityServiceProvider();

const {
  CognitoIdentityProvider,
} = require("@aws-sdk/client-cognito-identity-provider");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event, context, callback) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  try {
    const userName = event.userName;
    console.log("userName: ", userName);
    const userPoolId = event.userPoolId;
    console.log("userPoolId: ", userPoolId);
    const targetGroup = process.env.TARGET_GROUP;
    //const roleArn = 'arn:aws:iam::425552117391:role/us-east-1_nqD4z84GY-memoriasUserPoolGroupGroupRole';

    const client = new CognitoIdentityProvider({
      region: event.region,
    });

    //generate code to identify if user already confirmed sign up
    const params = {
      UserPoolId: userPoolId,
      Username: userName,
    };

    const data = await client.adminGetUser(params);
    console.log("data: ", data);
    const code = data.UserAttributes.find(
      (attr) => attr.Name === "email_verified"
    ).Value;
    console.log("code: ", code);

    if (code) {
      const params = {
        GroupName: targetGroup,
        UserPoolId: userPoolId,
        Username: userName,
      };

      const data =await client.adminAddUserToGroup(params);
      console.log("successfull adminAddUserToGroup: ", data);
    }

    // Return to Amazon Cognito
    callback(null, event);

  } catch (error) {
    console.error("Error: ", error, error.stack);
    throw error;
  }
};
