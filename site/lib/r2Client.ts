import {S3Client} from "@aws-sdk/client-s3";

export function getR2Client() {
  const ACCOUNT_ID = process.env.S3_ACCOUNT_ID!;
  const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY!;
  const S3_SECRET_KEY = process.env.S3_SECRET_KEY!;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
  });
  return client;
}
