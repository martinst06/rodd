import {
  CreateMultipartUploadCommand,
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
    const fileName = body?.fileName;
    const contentType = body?.contentType;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required." },
        { status: 400 }
      );
    }

    const isVideo = contentType.startsWith("video/");
    const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `images/${isVideo ? "video" : "image"}-${Date.now()}-${safeName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        originalname: safeName,
      },
    });

    const response = await b2Client.send(command);

    if (!response.UploadId) {
      throw new Error("Failed to start multipart upload.");
    }

    return NextResponse.json({ uploadId: response.UploadId, key });
  } catch (error) {
    const message =
      error instanceof S3ServiceException
        ? error.message
        : "Failed to start multipart upload.";
    console.error("Multipart start error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


