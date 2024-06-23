import { randomUUID } from 'crypto';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { ProductServiceTable } from './enums';
import { apiBadRequestError, apiCreateResponse, apiInternalServerError } from './response';
import { clientConfig } from './clientConfig';
import { CreateProductBody } from './types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) return apiBadRequestError();

  const { count, title, price, description } = JSON.parse(event.body) as CreateProductBody;

  if (!title) return apiBadRequestError();
  if (!price) return apiBadRequestError();

  const client = new DynamoDBClient(clientConfig);
  const productId =  randomUUID();

  const putProductData = {
    TableName: ProductServiceTable.product,
    Item: {
      id: { S: productId },
      title: { S: title },
      description: { S: description || '' },
      price: { N: price.toString() },
    }
  };   

  const putStockData = {
    TableName: ProductServiceTable.stock,
    Item: {
      product_id: { S: productId },
      count: { N: count?.toString() || '0' }
    }
  };

  const transaction = new TransactWriteItemsCommand({
    TransactItems: [
      { Put: putProductData },
      { Put: putStockData }
    ]
  });

  try {
    await client.send(transaction);
  } catch (err) {
    return apiInternalServerError()
  }

  return apiCreateResponse();
}