import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { ProductServiceTable } from "./enums";
import { apiBadRequestError, apiInternalServerError, apiNotFoundError, apiSuccessResponse } from "./response";
import { clientConfig } from "./clientConfig";
import { unmarshall } from "@aws-sdk/util-dynamodb";

type PathParams = { pathParameters: { productId?: string }}

export type APIGatewayEventWithPathParams = APIGatewayEvent & PathParams;

export const handler = async (event:  APIGatewayEventWithPathParams): Promise<APIGatewayProxyResult> => {
  const { productId } = event.pathParameters;

  if (!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    return apiBadRequestError('Invalid product id')
  }

  const client = new DynamoDBClient(clientConfig);

  try {
    const command = new QueryCommand({
      TableName: ProductServiceTable.product,
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
      TableName: ProductServiceTable.stock,
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