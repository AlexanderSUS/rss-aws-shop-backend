import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { seedProducts } from "./seed-products";
import { clientConfig } from "../product-service/clientConfig";

(async () => {
  const client = new DynamoDBClient(clientConfig);

  const [productsResult] = await seedProducts(client)

  console.log(JSON.stringify(productsResult, null, 2));
})();