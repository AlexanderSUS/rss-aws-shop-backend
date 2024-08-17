import { DynamoDBClient, TransactWriteItem, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { SQSEvent } from 'aws-lambda';
import { clientConfig } from './clientConfig';
import { AvailableProduct, CreateProductBody } from './types';
import { randomUUID } from 'crypto';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { apiSuccessResponse } from './response';

export const handler = async (event: SQSEvent) => {
  console.log(JSON.stringify(event, null, 2));

  const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME;
  const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME;
  const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;

  if (!STOCK_TABLE_NAME || !PRODUCT_TABLE_NAME) {
    return console.error('Error some of env variables is undefined');
  }

  const products: CreateProductBody[] = [];

  for (const record of event.Records) {
    try {
      const product = JSON.parse(record.body) as AvailableProduct;
      products.push(product);
    } catch (err) {
      return console.log(err);
    }
  }

  const productsWithId = products.map((product) => ({ ...product, id: randomUUID()}));

  const transactionItems = productsWithId.reduce((acc, product) => {
    acc.push({
      Put: {
        TableName: PRODUCT_TABLE_NAME,
        Item: {
          id: { S: product.id },
          title: { S: product.title },
          description: { S: product.description || '' },
          price: { N: product.price.toString() },
        }
      }
    },
    {
      Put: {
        TableName: STOCK_TABLE_NAME,
        Item: {
          product_id: { S: product.id },
          count: { N: product?.count.toString() },
        },
      },
    });

    return acc;
  }, [] as TransactWriteItem[]);


  try {
    if (transactionItems.length === 0)  return;

    const client = new DynamoDBClient(clientConfig);

    await client.send(new TransactWriteItemsCommand({
      TransactItems: transactionItems 
    }));

    const snsMessage = {
      default: {
        message: `${transactionItems.length / 2} products was added to database`,
        products: productsWithId,
      }
    };

    const snsClient =  new SNSClient();

    await snsClient.send(
      new PublishCommand({
        Message: JSON.stringify(snsMessage),
        TopicArn: CREATE_PRODUCT_TOPIC_ARN,
      }),
    );

    return apiSuccessResponse({ message: 'Batch processed successfully'});
  } catch (err) {
    console.error(err);
  }
};