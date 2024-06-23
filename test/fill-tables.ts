import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { seedProducts } from "./seed-products";
import { clientConfig } from "../product-service/clientConfig";

(async () => {
  const client = new DynamoDBClient(clientConfig);

  const result = await seedProducts(client)

  console.log(result);
})();