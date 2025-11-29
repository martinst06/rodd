import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { B2_BUCKET_NAME, b2Client } from "@/lib/b2";

export const runtime = "nodejs";

export async function GET() {
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
    const data = await b2Client.send(
      new ListObjectsV2Command({
        Bucket: B2_BUCKET_NAME,
        Prefix: "images/",
      })
    );

    const images =
      data.Contents?.filter((obj) => obj.Key)
        .map((obj) => ({
          key: obj.Key as string,
          size: Number(obj.Size ?? 0),
          lastModified: obj.LastModified
            ? obj.LastModified.toISOString()
            : null,
        }))
        .sort((a, b) => {
          if (!a.lastModified || !b.lastModified) return 0;
          return a.lastModified < b.lastModified ? 1 : -1;
        }) ?? [];

    return NextResponse.json({ images });
  } catch (error) {
    console.error("List images error:", error);
    return NextResponse.json(
      { error: "Failed to list images. Check server logs for details." },
      { status: 500 }
    );
  }
}


