import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class AuthorizationServiceStack extends Stack {
  public readonly basicAuthorizerFunction : lambda.Function;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new lambda.Function(this, 'BasicAuthorizer', {
      functionName: 'basic-authorizer',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./authorization-service'),
      handler: 'basicAuthorizer.handler',
      environment: {
        GITHUB_ACCOUNT_LOGIN: process.env.GITHUB_ACCOUNT_LOGIN!,
        AUTH_PASSWORD: process.env.AUTH_PASSWORD!,
      }
    });
  }
}