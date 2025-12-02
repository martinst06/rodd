import {
  AbortMultipartUploadCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { B2_BUCKET_NAME, b2Client } from "@/lib/b2";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (
    !B2_BUCKET_NAME ||
    !process.env.B2_KEY_ID ||
    !process.env.B2_APPLICATION_KEY
  ) {
    return NextResponse.json(
      {
        error:
          "Backblaze B2 storage is not configured on the server. Please set B2_BUCKET_NAME, B2_REGION, B2_KEY_ID and B2_APPLICATION_KEY.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const key: string | undefined = body?.key;
    const uploadId: string | undefined = body?.uploadId;

    if (!key || !uploadId) {
      return NextResponse.json(
        { error: "key and uploadId are required." },
        { status: 400 }
      );
    }

    const command = new AbortMultipartUploadCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
    });

    await b2Client.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof S3ServiceException
        ? error.message
        : "Failed to abort multipart upload.";
    console.error("Multipart abort error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


