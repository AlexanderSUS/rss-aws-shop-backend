type BasicAuthorizerEvent = {
  type: 'TOKEN';
  authorizationToken?: string;
  methodArn:string;
}

export function fromBase64ToString(base64string: string): string {
  return Buffer.from(base64string, 'base64').toString('ascii');
}

export function getPolicy(effect: 'Allow' | 'Deny', arn: string) {
  return {
    principalId: process.env.GITHUB_ACCOUNT_LOGIN,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: arn, 
      }],
    }
  };
}

export const handler = (event: BasicAuthorizerEvent) =>  {
  const GITHUB_ACCOUNT_LOGIN = process.env.GITHUB_ACCOUNT_LOGIN;
  const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

  if (event.authorizationToken === undefined) {
    throw new Error('Unauthorized');
  }

  const expectedToken = `${GITHUB_ACCOUNT_LOGIN}:${AUTH_PASSWORD}`;
  const token = fromBase64ToString(event.authorizationToken!);

  if (token !== expectedToken) {
    return getPolicy('Deny', event.methodArn);
  }

  return getPolicy('Allow', event.methodArn);
};
