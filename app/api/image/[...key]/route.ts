import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

import { B2_BUCKET_NAME, b2Client } from "@/lib/b2";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
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

  const { key } = await context.params;
  const joinedKey = key.join("/");

  try {
    const result = await b2Client.send(
      new GetObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: joinedKey,
      })
    );

    if (!result.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    const nodeStream = result.Body as Readable;
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    const fileName = joinedKey.split("/").pop() || "file";

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": result.ContentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          fileName
        )}"`,
        ...(result.ContentLength
          ? { "Content-Length": result.ContentLength.toString() }
          : {}),
      },
    });
  } catch (error) {
    console.error("Get image error:", error);
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
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

  const { key } = await context.params;
  const joinedKey = key.join("/");

  try {
    await b2Client.send(
      new DeleteObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: joinedKey,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}


