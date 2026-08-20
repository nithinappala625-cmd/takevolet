import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and contentType are required" },
        { status: 400 }
      );
    }

    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID) {
      return NextResponse.json({ error: "Missing R2 credentials" }, { status: 500 });
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename, // e.g., 'Takevolet/rooms/image.jpg'
      ContentType: contentType,
    });

    // The presigned URL expires in 15 minutes
    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 900 });

    const publicUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL}/${filename}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
    });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
