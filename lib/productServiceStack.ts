import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListFunction = new lambda.Function(this, 'GetProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('product-service'),
      handler: 'getProductsList.handler',
    }); 

    const getProductsByIdFunction = new lambda.Function(this, 'GetProductsByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('product-service'),
      handler: 'getProductsById.handler',
    }); 
    
    const api = new RestApi(this, 'ShopAPI', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      }
    });

    const productEndpoint = api.root.addResource('products');
    productEndpoint.addMethod(HttpMethod.GET, new LambdaIntegration(getProductsListFunction));

    const productWithIdEndpoint = productEndpoint.addResource('{productId}');
    productWithIdEndpoint.addMethod(HttpMethod.GET, new LambdaIntegration(getProductsByIdFunction))
    
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: api.url!,
    });
  }
}
