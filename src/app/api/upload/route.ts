import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const folder = (formData.get("folder") as string) || "Takevolet";

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Return placeholder URLs if Cloudinary not configured
      const placeholders = files.map((_, i) => `https://images.unsplash.com/photo-150269026626${i}?w=800&q=80`);
      return NextResponse.json({ urls: placeholders, success: true });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const dataUri = `data:${file.type};base64,${base64}`;

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: dataUri,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "Takevolet",
            folder: `Takevolet/${folder}`,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        uploadedUrls.push(data.secure_url);
      }
    }

    return NextResponse.json({ urls: uploadedUrls, success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
