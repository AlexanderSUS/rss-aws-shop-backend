import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

type Prop = {
  region: string; 
  bucket: string;
  key: string
}

export const createPresignedUrlWithClient = ({ region, bucket, key }: Prop) => {
  const client = new S3Client({ region });
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });

  return getSignedUrl(client, command, { expiresIn: 3600 });
};