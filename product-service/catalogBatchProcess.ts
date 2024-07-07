import { DynamoDBClient, TransactWriteItem, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { SQSEvent } from "aws-lambda";
import { clientConfig } from "./clientConfig";
import { AvailableProduct, CreateProductBody } from "./types";
import { randomUUID } from "crypto";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

export const handler = async (event: SQSEvent) => {
  console.log(JSON.stringify(event, null, 2))

  const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME;
  const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME;
  const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN

  if (!STOCK_TABLE_NAME || !PRODUCT_TABLE_NAME) {
    return console.error('Error some of env variables is undefined')
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

  const transactionItems = products.reduce((acc, product) => {
    const productId =  randomUUID();

    acc.push({
      Put: {
        TableName: PRODUCT_TABLE_NAME,
        Item: {
          id: { S: productId },
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
          product_id: { S: productId },
          count: { N: product?.count.toString() },
        },
      },
    });

    return acc
  }, [] as TransactWriteItem[])


  try {
    if (transactionItems.length === 0)  return;

    const client = new DynamoDBClient(clientConfig);

    await client.send(new TransactWriteItemsCommand({
      TransactItems: transactionItems 
    }));

    const snsClient =  new SNSClient()

    await snsClient.send(
      new PublishCommand({
        Message: `${new Date().toISOString()}: ${transactionItems.length} products was added to database`,
        TopicArn: CREATE_PRODUCT_TOPIC_ARN,
      }),
    );

    console.log('COMPLETE!')
  } catch (err) {
    console.error(`Error = ${JSON.stringify(err)}`);
  }
}