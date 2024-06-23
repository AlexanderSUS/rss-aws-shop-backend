import { BatchGetItemCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { ProductServiceTable } from "./enums";
import { apiInternalServerError, apiSuccessResponse } from "./response";
import { APIGatewayProxyResult } from "aws-lambda";
import { clientConfig } from "./clientConfig";
import { AvailableProduct, Product, StockItem } from "./types";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = async (): Promise<APIGatewayProxyResult>=> {
  try {
    const client = new DynamoDBClient(clientConfig);
    const command = new ScanCommand({ TableName: ProductServiceTable.product })

    const response = await client.send(command);

    if(!response.Items) {
      return apiInternalServerError();
    }

    if (response.Items.length === 0) {
      return apiSuccessResponse([])
    }

    const productsList = response.Items.map((item) => unmarshall(item)) as Product[];
    const stockItemsKeys = productsList.map(({ id: product_id }) => ({ product_id: { S: product_id }}));

    const getStockItemCommand = new BatchGetItemCommand({
      RequestItems: { [`${ProductServiceTable.stock}`]: { Keys: stockItemsKeys, } }
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