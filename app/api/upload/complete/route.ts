import {
  CompleteMultipartUploadCommand,
  CompletedPart,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { B2_BUCKET_NAME, b2Client } from "@/lib/b2";

export const runtime = "nodejs";

type ApiPart = {
  PartNumber: number;
  ETag: string;
};

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
    const parts: ApiPart[] | undefined = body?.parts;

    if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { error: "key, uploadId and parts are required." },
        { status: 400 }
      );
    }

    const completedParts: CompletedPart[] = parts
      .map((part) => ({
        PartNumber: part.PartNumber,
        ETag: part.ETag,
      }))
      .sort((a, b) => (a.PartNumber ?? 0) - (b.PartNumber ?? 0));

    const command = new CompleteMultipartUploadCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: completedParts,
      },
    });

    await b2Client.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof S3ServiceException
        ? error.message
        : "Failed to complete multipart upload.";
    console.error("Multipart complete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


