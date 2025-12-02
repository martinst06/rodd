import { UploadPartCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
    const key = body?.key;
    const uploadId = body?.uploadId;
    const partNumber = body?.partNumber;

    if (!key || !uploadId || typeof partNumber !== "number") {
      return NextResponse.json(
        { error: "key, uploadId and partNumber are required." },
        { status: 400 }
      );
    }

    const command = new UploadPartCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const url = await getSignedUrl(b2Client, command, { expiresIn: 3600 });
    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof S3ServiceException
        ? error.message
        : "Failed to create part URL.";
    console.error("Multipart part URL error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


