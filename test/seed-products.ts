import { BatchWriteItemCommandOutput, DynamoDBClient, TransactWriteItem, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { AvailableProduct } from "../product-service/types";
import { ProductServiceTable } from "../product-service/enums";
import { createFakeAvailableProducts } from "./create-fake-available-products";

export async function seedProducts(client: DynamoDBClient): Promise<[AvailableProduct[], BatchWriteItemCommandOutput]>  {
  const products = createFakeAvailableProducts();

  const productsToPut: TransactWriteItem[] = products.map((product) => ({
    Put: {
      TableName: ProductServiceTable.product,
      Item: {
        id: { S: product.id },
        title: { S: product.title },
        description: { S: product.description || '' },
        price: { N: product.price.toString() },
      }
    }
  }))

  const stockItemsToPut: TransactWriteItem[] = 
    products.map(({ id: product_id, count }) => ({
    Put: {
      TableName: ProductServiceTable.stock,
      Item: {
        product_id: { S: product_id },
        count: { N: count.toString() },
      },
    },
  }))

  const transaction = new TransactWriteItemsCommand({
    TransactItems: [
      ...productsToPut,
      ...stockItemsToPut, 
    ]
  })

  const result = await client.send(transaction);

  return [ products, result];
}