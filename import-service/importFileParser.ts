import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3, S3Client } from "@aws-sdk/client-s3";
import { NodeJsClient } from "@smithy/types";
import { S3Event } from "aws-lambda";
import csvParser = require("csv-parser");

export const handler = async (event: S3Event): Promise<any> => {
  const bucket = event.Records[0].s3.bucket.arn;
  const key = event.Records[0].s3.object.key;

  if (!process.env.AWS_REGION) {
    return console.log('AWS_REGION id undefined')
  }

  const client = new S3({}) as NodeJsClient<S3Client>
  const params = { Bucket: bucket, Key: key };

  try {
    const cmd = new GetObjectCommand(params)
    const res = await client.send(cmd);

    if (res.Body === undefined) return console.log('File is empty');
      const parsedData = await new Promise<Record<string, string | number>[]>((resolve, reject) => {
        const results:Record<string, string | number>[] = [];

        res.Body!
        .pipe(csvParser())
        .on('data', (chunk) => results.push(chunk))
        .on('end', () => resolve(results))
        .on('error', reject)
      })

      console.log('PARSED DATA', JSON.stringify(parsedData, null, 2));

      const oldKey = key;
      const [, fileName] = oldKey.split('/')
      const newKey = `parsed/${fileName}`
    
      await client.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${oldKey}`,
        Key: newKey,
      }));

      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }));
  } catch (err) {
    console.log(err);
  }
}