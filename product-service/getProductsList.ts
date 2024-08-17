import { BatchGetItemCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { apiInternalServerError, apiSuccessResponse } from "./response";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { clientConfig } from "./clientConfig";
import { AvailableProduct, Product, StockItem } from "./types";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult>=> {
  console.log(event);

  const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME;
  const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME;

  if (!STOCK_TABLE_NAME || !PRODUCT_TABLE_NAME) {
    return apiInternalServerError();
  }

  try {
    const client = new DynamoDBClient(clientConfig);
    const getProductsListCommand = new ScanCommand({ TableName: PRODUCT_TABLE_NAME })

    const response = await client.send(getProductsListCommand);

    if(!response.Items) {
      return apiInternalServerError();
    }

    if (response.Items.length === 0) {
      return apiSuccessResponse([])
    }

    const productsList = response.Items.map((item) => unmarshall(item)) as Product[];
    const stockItemsKeys = productsList.map(({ id: product_id }) => ({ product_id: { S: product_id }}));

    const getStockItemCommand = new BatchGetItemCommand({
      RequestItems: { [`${STOCK_TABLE_NAME}`]: { Keys: stockItemsKeys, } }
    })

    const stockRes = await client.send(getStockItemCommand);
    const stockItems = stockRes.Responses!.stock.map((item) => unmarshall(item)) as StockItem[];

    const fullProducts = productsList as Partial<AvailableProduct>[]

    stockItems.forEach(({ product_id, count }) => fullProducts.find(({ id}) => id === product_id)!.count = count)

    return apiSuccessResponse(fullProducts);
  } catch (err) {
    return apiInternalServerError(JSON.stringify(err))
  }
};