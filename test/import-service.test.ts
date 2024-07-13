import { APIGatewayEvent, S3Event } from 'aws-lambda';
import { createPresignedUrlWithClient } from '../import-service/createPresignedUrlWithClient';
import { handler as importProductsFile  } from '../import-service/importProductsFile';
import { handler as importFileParser } from '../import-service/importFileParser';
import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@smithy/util-stream';
import * as sdkClientMock from 'aws-sdk-client-mock';
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { createReadStream } from 'fs';


jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockImplementation((_, { input }) => `https://${input.Bucket}.s3.amazonaws.com/${input.Key}`),
}));

type APIGatewayEventWithQSParams = APIGatewayEvent & {
  queryStringParameters: { name: string }
}

sdkClientMock.mockClient(SQSClient);
const s3Mock = sdkClientMock.mockClient(S3Client);
const BUCKET = 'mybucket';
const KEY = 'testFile.csv';
const CSVString = 'title,price,description,count\nproductone,100,somedescription,10\nproducttwo,200,somedescriptionprod3,2\n';
const mockS3Event = {
  Records: [{ 
    s3: {
      bucket: { arn: 'arn:aws:s3:::mytestbucket' },
      object: { key: 'uploads/testFile.csv' }
  }}]
} as unknown as S3Event;


afterEach(() => {
  s3Mock.reset();
});

describe('createPresignedUrlWithClient', () => {
  test('should return url', async () => {
    const res = await createPresignedUrlWithClient({
      region: process.env.REGION!,
      bucket: process.env.BUCKET!,
      key: KEY,
    });

    expect(res).toMatch('https://' + BUCKET + '.s3.');
  });
});

describe('importProductsFile', () => {
  test('should return url', async () => {
    const res = await importProductsFile({ queryStringParameters: { name: KEY }} as APIGatewayEventWithQSParams);

    expect(res.statusCode).toBe(200);
    expect(res.body)
      .toMatch(`https://mybucket.s3.amazonaws.com/uploaded/${KEY}`);
  });

  test('returned url should have "uploaded" prefix', async () => {
    const res = await importProductsFile({ queryStringParameters: { name: KEY }} as APIGatewayEventWithQSParams);

    expect(res.body).toMatch(`/uploaded/${KEY}`);
  });

  test('should return 400 if there is no queryStringParameters', async () => {
    const res = await importProductsFile({} as unknown as APIGatewayEvent);

    expect(res.statusCode).toBe(400);
  });

  test('should return 400 status code if name was not provided', async () => {
    const res = await importProductsFile({ queryStringParameters: null } as APIGatewayEvent);

    expect(res.statusCode).toBe(400);
  });

  test('should return 500 status code if there are any problem wit bucket', async () => {
    const mockedGetSignedUrl = s3RequestPresigner as jest.Mocked<typeof s3RequestPresigner>;

    mockedGetSignedUrl.getSignedUrl
      .mockImplementationOnce(() => { throw new Error('Error');} );

    const res = await importProductsFile({ queryStringParameters: { name: 'testFile'}} as APIGatewayEventWithQSParams);

    expect(res.statusCode).toBe(500);
  });
});

describe('importFileParser', () => {
  test('should not trow error', async () => {
    const stream = createReadStream('./test/testfile.csv');

    stream.push(null);
    const sdkStream = sdkStreamMixin(stream);

    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });

    await expect(importFileParser(mockS3Event)).resolves.toBeUndefined();
  });

  // TODO
  // shouldn't call GetObjectCommand if AWS_REGION isn't specified
  // shouldn't call GetObjectCommand if QUEUE_URL isn't specified
  // shouldn't call SQSClient.send if Body is empty 
  // shouldn't call CopyObjectCommand if sqsClient rejects 


  test('should call CopyObjectCommand', async () => {
    const stream = createReadStream('./test/testfile.csv');

    stream.push(null);
    const sdkStream = sdkStreamMixin(stream);

    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });

    await expect(importFileParser(mockS3Event)).resolves.toBeUndefined();

    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
  });


  test('should call DeleteObjectCommand', async () => {
    const stream = new Readable();

    stream.push(CSVString);
    stream.push(null);
    const sdkStream = sdkStreamMixin(stream);

    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });

    await expect(importFileParser(mockS3Event)).resolves.toBeUndefined();

    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });
});