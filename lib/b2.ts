import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.B2_REGION || "us-west-004";
const ENDPOINT =
  process.env.B2_ENDPOINT || `https://s3.${REGION}.backblazeb2.com`;

export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || "";

if (
  !process.env.B2_BUCKET_NAME ||
  !process.env.B2_KEY_ID ||
  !process.env.B2_APPLICATION_KEY
) {
  console.warn(
    "Backblaze B2 is not fully configured. Set B2_BUCKET_NAME, B2_REGION, B2_KEY_ID and B2_APPLICATION_KEY in your environment."
  );
}

export const b2Client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials:
    process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY
      ? {
          accessKeyId: process.env.B2_KEY_ID,
          secretAccessKey: process.env.B2_APPLICATION_KEY,
        }
      : undefined,
});


