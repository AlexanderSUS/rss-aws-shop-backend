import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ProductEndpoints, ProductServiceTable } from '../product-service/enums';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import 'dotenv/config';

type Props = {
  importFileParserFunction: lambda.Function;
} & cdk.StackProps ;

export class ProductServiceStack extends cdk.Stack {
  public readonly queueUrl: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const getProductsListFunction = new lambda.Function(this, 'GetProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./product-service'),
      handler: 'getProductsList.handler',
      environment: {
        STOCK_TABLE_NAME: ProductServiceTable.stock,
        PRODUCT_TABLE_NAME: ProductServiceTable.product,
        LOCAL_DB_HOST: process.env.LOCAL_DB_HOST!,
      }
    }); 

    const getProductByIdFunction = new lambda.Function(this, 'GetProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./product-service'),
      handler: 'getProductById.handler',
      environment: {
        STOCK_TABLE_NAME: ProductServiceTable.stock,
        PRODUCT_TABLE_NAME: ProductServiceTable.product,
        LOCAL_DB_HOST: process.env.LOCAL_DB_HOST!,
      },
    }); 

    const createProductFunction = new lambda.Function(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./product-service'),
      handler: 'createProduct.handler',
      environment: {
        STOCK_TABLE_NAME: ProductServiceTable.stock,
        PRODUCT_TABLE_NAME: ProductServiceTable.product,
        LOCAL_DB_HOST: process.env.LOCAL_DB_HOST!,
      },
    }); 

    const catalogBatchProcessFunction = new lambda.Function(this, 'CatalogBatchProcessFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./product-service'),
      handler: 'catalogBatchProcess.handler',
      environment: {
        STOCK_TABLE_NAME: ProductServiceTable.stock,
        PRODUCT_TABLE_NAME: ProductServiceTable.product,
      },
    });

    // *** DynamoDB ***
    const productTable = new Table(this, 'Product', {
      tableName: ProductServiceTable.product,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new Table(this, 'Stock', {
      tableName: ProductServiceTable.stock,
      partitionKey: {
        name: 'product_id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    productTable.grantReadData(getProductsListFunction);
    productTable.grantReadData(getProductByIdFunction);
    productTable.grantReadWriteData(createProductFunction);

    stockTable.grantReadData(getProductsListFunction);
    stockTable.grantReadData(getProductByIdFunction);
    stockTable.grantReadWriteData(createProductFunction);

    // *** API
    const api = new RestApi(this, 'ShopAPI');
    const productEndpoint = api.root.addResource(ProductEndpoints.products);
    productEndpoint.addMethod(HttpMethod.GET, new LambdaIntegration(getProductsListFunction));
    const productWithIdEndpoint = productEndpoint.addResource('{productId}');
    productWithIdEndpoint.addMethod(HttpMethod.GET, new LambdaIntegration(getProductByIdFunction));
    productEndpoint.addMethod(HttpMethod.POST, new LambdaIntegration(createProductFunction));

    // *** SQS ***
    const catalogItemsQueue = new Queue(this, 'CatalogItemsQueue', { 
      queueName: 'catalogItemsQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
      receiveMessageWaitTime: cdk.Duration.seconds(10)
     });
    this.queueUrl = catalogItemsQueue.queueUrl;
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessFunction);
    catalogItemsQueue.grantSendMessages(props.importFileParserFunction);
    catalogBatchProcessFunction.addEventSource(new SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    }));

    // *** SNS ***
    const snsTopic = new Topic(this, 'CreateProductTopic', { topicName: 'createProductTopic' });
    snsTopic.grantPublish(catalogBatchProcessFunction);
    catalogBatchProcessFunction.addEnvironment('CREATE_PRODUCT_TOPIC_ARN', snsTopic.topicArn);
    const emailAddress = new cdk.CfnParameter(this, 'subscriptionEmail');
    snsTopic.addSubscription(new EmailSubscription(emailAddress.value.toString()));
  }
}
