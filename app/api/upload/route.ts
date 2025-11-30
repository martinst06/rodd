import { PutObjectCommand } from "@aws-sdk/client-s3";
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
    const formData = await req.formData();
    const allFiles = formData
      .getAll("file")
      .filter((value): value is File => value instanceof File);

    if (!allFiles.length) {
      return NextResponse.json(
        { error: "No file found in the request." },
        { status: 400 }
      );
    }

    const keys: string[] = [];

    for (const file of allFiles) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        return NextResponse.json(
          { error: "Only image or video uploads are allowed." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName =
        file.name?.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "image-upload";
      const keyPrefix = isVideo ? "video" : "image";
      const key = `images/${keyPrefix}-${Date.now()}-${safeName}`;

      await b2Client.send(
        new PutObjectCommand({
          Bucket: B2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        })
      );

      keys.push(key);
    }

    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Check server logs for details." },
      { status: 500 }
    );
  }
}


