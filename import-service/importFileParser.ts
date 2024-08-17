import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsCommand, S3, S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { NodeJsClient } from "@smithy/types";
import { S3Event } from "aws-lambda";
import csvParser = require("csv-parser");

export const handler = async (event: S3Event): Promise<any> => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const QUEUE_URL = process.env.QUEUE_URL;

  const s3client= new S3({}) as NodeJsClient<S3Client>;
  const params = { Bucket: bucket, Key: key };

  try {
    const cmd = new GetObjectCommand(params)
    const res = await s3client.send(cmd);

    if (res.Body === undefined) return console.log('File is empty');

    const parsedData = await new Promise<Record<string, string | number>[]>((resolve, reject) => {
      const results:Record<string, string | number>[] = [];

      res.Body!
      .pipe(csvParser())
      .on('data', (chunk) => {
        results.push(chunk)
      })
      .on('end', () => {
        resolve(results)
      })
      .on('error', reject)
    })

    const sqsClient = new SQSClient({})

    await Promise.all(parsedData.map((item) => 
      sqsClient.send(new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(item) 
      }))
    ))

    const oldKey = key;
    const [, fileName] = oldKey.split('/')
    const newKey = `parsed/${fileName}`
  
    await s3client.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${oldKey}`,
      Key: newKey,
    }));

    await s3client.send(new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }));
  } catch (err) {
    console.log(`ERROR=${JSON.stringify(err)}`);
  }
}