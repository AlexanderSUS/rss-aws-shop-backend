import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { createPresignedUrlWithClient } from "./createPresignedUrlWithClient";
import { apiBadRequestError, apiInternalServerError } from "./response";

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult>  => {
  const REGION = process.env.AWS_REGION;
  const BUCKET = process.env.BUCKET;
  const queryStringParameters = event.queryStringParameters;


  if (!REGION || !BUCKET) {
    return apiInternalServerError('Config error');
  }

  if (queryStringParameters !== null && typeof queryStringParameters === 'object' && 'name' in queryStringParameters) {
    const key = `uploaded/${queryStringParameters.name}`;

    try {
      const clientUrl = await createPresignedUrlWithClient({
        region: REGION,
        bucket: BUCKET,
        key,
      })

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS, GET',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'text/plain',
        },
        body: clientUrl,
      }    
    } catch (err) {
      return apiInternalServerError('An error occurs during signing process')
    }
  }

  return apiBadRequestError('Bad parameter')
}