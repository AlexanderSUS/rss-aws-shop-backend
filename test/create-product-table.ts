import { DynamoDBClient, CreateTableCommand, BillingMode } from "@aws-sdk/client-dynamodb";
import { ProductServiceTable } from "../product-service/enums";

export async function createProductTable(client: DynamoDBClient) {
  const command = new CreateTableCommand({
    TableName: ProductServiceTable.product,
    AttributeDefinitions: [
        { 
          AttributeName: 'id',
          AttributeType: 'S',
        },
    ],
    KeySchema: [
        {
          AttributeName: 'id' ,
          KeyType: 'HASH'
        },
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST 
  });

  return client.send(command)
}
