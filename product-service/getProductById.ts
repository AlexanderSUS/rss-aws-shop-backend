import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { apiBadRequestError, apiInternalServerError, apiNotFoundError, apiSuccessResponse } from "./response";
import { clientConfig } from "./clientConfig";
import { unmarshall } from "@aws-sdk/util-dynamodb";

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
    const command = new QueryCommand({
      TableName: PRODUCT_TABLE_NAME,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": {
          S: productId,
        },
      },
    })

    const { Items } = await client.send(command);

    if (Items === undefined || Items.length === 0) {
      return apiNotFoundError('Product not found')
    }

    const product = unmarshall(Items[0]);

    const getStockItemCommand = new QueryCommand({
      TableName: STOCK_TABLE_NAME,
      KeyConditionExpression: "product_id = :id",
      ExpressionAttributeValues: {
        ":id": {
          S: productId,
        },
      },
    });

    const { Items: StockItems } = await client.send(getStockItemCommand);

    if (StockItems === undefined || StockItems.length === 0) {
      return apiInternalServerError()
    }
 
    product.count = unmarshall(StockItems[0]).count;
    
    return apiSuccessResponse(product)
  } catch (err) {
    return apiInternalServerError();
  }
};