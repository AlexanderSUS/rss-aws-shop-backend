import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ProductEndpoints, ProductServiceTable } from '../product-service/enums';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListFunction = new lambda.Function(this, 'GetProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./product-service'),
      handler: 'getProductsList.handler',
      environment: {
        STOCK_TABLE_NAME: ProductServiceTable.stock,
        PRODUCT_TABLE_NAME: ProductServiceTable.product,
        LOCAL_DB_HOST: 'http://localhost:8000',
      }
    }); 

    const getProductByIdFunction = new lambda.Function(this, 'GetProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./product-service'),
      handler: 'getProductById.handler',
      environment: {
        STOCK_TABLE_NAME: ProductServiceTable.stock,
        PRODUCT_TABLE_NAME: ProductServiceTable.product,
        LOCAL_DB_HOST: 'http://localhost:8000',
      },
    }); 

    const createProductFunction = new lambda.Function(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./product-service'),
      handler: 'createProduct.handler',
      environment: {
        STOCK_TABLE_NAME: ProductServiceTable.stock,
        PRODUCT_TABLE_NAME: ProductServiceTable.product,
        LOCAL_DB_HOST: 'http://localhost:8000',
      },
    }); 

    const productTable = new Table(this, "Product", {
      tableName: ProductServiceTable.product,
      partitionKey: {
        name: id,
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const stockTable = new Table(this, "Stock", {
      tableName: ProductServiceTable.stock,
      partitionKey: {
        name: 'product_id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    productTable.grantReadData(getProductsListFunction);
    productTable.grantReadData(getProductByIdFunction);

    productTable.grantReadWriteData(createProductFunction);
    stockTable.grantReadWriteData(createProductFunction);
    
    const api = new RestApi(this, 'ShopAPI', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'POST', 'GET'],
      },
    });

    const productEndpoint = api.root.addResource(ProductEndpoints.products);
    productEndpoint.addMethod(HttpMethod.GET, new LambdaIntegration(getProductsListFunction));

    const productWithIdEndpoint = productEndpoint.addResource('{productId}');
    productWithIdEndpoint.addMethod(HttpMethod.GET, new LambdaIntegration(getProductByIdFunction))

    productEndpoint.addMethod(HttpMethod.POST, new LambdaIntegration(createProductFunction));
    
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: api.url,
    });
  }
}
