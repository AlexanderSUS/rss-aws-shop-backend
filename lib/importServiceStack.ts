import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { Bucket, EventType, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ImportServiceStack extends Stack {
  public readonly importFileParserFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const uploadsBucket = new Bucket(this, 'BucketForUploads', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false, 
      cors:  [{
        allowedMethods: [HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        exposedHeaders: ['*'],
      }]
    })

    const importProductsFileFunction = new lambda.Function(this, 'ImportProductsFile', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./import-service'),
      handler: 'importProductsFile.handler',
      environment: {
        BUCKET: uploadsBucket.bucketName
      },
    });

    const importFileParserFunction = new lambda.Function(this, 'ImportFileParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./import-service'),
      handler: 'importFileParser.handler',
    });

    importFileParserFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [ 's3:GetObject', 's3:DeleteObject', 's3:CopyObject' ],
        resources: [uploadsBucket.bucketArn],
      }),
    )

    importFileParserFunction.addEventSource(new S3EventSource(uploadsBucket, {
      events: [EventType.OBJECT_CREATED],
      filters: [{ prefix: 'uploaded/' }]
    }));

    this.importFileParserFunction = importFileParserFunction;

    const api = new RestApi(this, 'ImportApi');

    const importEndpoint = api.root.addResource('import')
    importEndpoint.addMethod(HttpMethod.GET, new LambdaIntegration(importProductsFileFunction))
  }
}