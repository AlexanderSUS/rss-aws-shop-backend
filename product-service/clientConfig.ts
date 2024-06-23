import { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

// It is needed for testing purpose with dynamodb-local in docker
export const clientConfig: DynamoDBClientConfig = process.env.NODE_ENV === 'test' ?  {
  endpoint: process.env.DB_HOST,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secret'
  }
} : {};

