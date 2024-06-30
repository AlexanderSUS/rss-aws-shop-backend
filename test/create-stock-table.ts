import { DynamoDBClient, CreateTableCommand, BillingMode } from "@aws-sdk/client-dynamodb";
import { ProductServiceTable } from "../product-service/enums";

export async function createStockTable(client: DynamoDBClient) {
  const command = new CreateTableCommand({
    TableName: ProductServiceTable.stock,
    AttributeDefinitions: [
        { 
          AttributeName: 'product_id',
          AttributeType: 'S',
        },
    ],
    KeySchema: [
        {
          AttributeName: 'product_id' ,
          KeyType: 'HASH'
        },
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST 
  });

  return client.send(command)
}
