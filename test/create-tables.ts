import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { createProductTable } from "./create-product-table"
import { createStockTable } from "./create-stock-table"

(async () => {
  const client = new DynamoDBClient({
    endpoint: process.env.LOCAL_DB_HOST,
    region: 'us-east-1'
  });
  
  const res1 = await createProductTable(client);
  console.log(res1);
  const res2 = await createStockTable(client);
  console.log(res2);
})()