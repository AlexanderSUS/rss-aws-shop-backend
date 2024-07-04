import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, GetItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { apiBadRequestError, apiInternalServerError, apiNotFoundError, apiSuccessResponse } from "./response";
import { clientConfig } from "./clientConfig";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// TODO USE DynamoDocumentDbClient

type PathParams = { pathParameters: { productId?: string }}

export type APIGatewayEventWithPathParams = APIGatewayEvent & PathParams;

export const handler = async (event:  APIGatewayEventWithPathParams): Promise<APIGatewayProxyResult> => {
  console.log(event);

  const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME;
  const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME;

  if (!STOCK_TABLE_NAME || !PRODUCT_TABLE_NAME) {
    return apiInternalServerError();
  }

  const productId = event.pathParameters?.productId;

  if (!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    return apiBadRequestError('Invalid product id')
  }

  const client = new DynamoDBClient(clientConfig);

  try {
    const command = new GetItemCommand({
      TableName: PRODUCT_TABLE_NAME,
      Key: {
        id: {
          S: productId,
        },
      },
    })

    const res = await client.send(command);

    if (!res.Item) {
      return apiNotFoundError('Product not found')
    }

    const product = unmarshall(res.Item);

    const getStockItemCommand = new GetItemCommand({
      TableName: STOCK_TABLE_NAME,
      Key: {
        product_id: {
          S: productId,
        },
      },
    });

    const stockRes = await client.send(getStockItemCommand);

    if (!stockRes.Item) {
      return apiNotFoundError('Product not found')
    }
    const stockItem =  unmarshall(stockRes.Item);
    
    return apiSuccessResponse({ ...product, count: stockItem.count })
  } catch (err) {
    return apiInternalServerError();
  }
};