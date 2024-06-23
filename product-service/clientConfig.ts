import { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

// It is needed for testing purpose with dynamodb-local in docker
export const clientConfig: DynamoDBClientConfig = process.env.LOCAL_DB_HOST ?  {
  endpoint: process.env.LOCAL_DB_HOST,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secret'
  }
} : {};

