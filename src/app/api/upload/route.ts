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

    const uploadPromises = files.map(async (file) => {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "Takevolet");
      formDataUpload.append("folder", `Takevolet/${folder}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.secure_url;
      }
      return null;
    });

    const results = await Promise.all(uploadPromises);
    const uploadedUrls = results.filter((url): url is string => url !== null);

    return NextResponse.json({ urls: uploadedUrls, success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
