import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const roomData = {
      title: formData.get("title") as string,
      rent: Number(formData.get("rent")),
      advance: Number(formData.get("advance")),
      location: formData.get("location") as string,
      colony: formData.get("colony") as string,
      leavingDate: formData.get("leavingDate") as string,
      membersAllowed: Number(formData.get("membersAllowed")),
      genderPreference: formData.get("genderPreference") as string,
      furnishing: formData.get("furnishing") as string,
      parking: formData.get("parking") as string,
      commission: Number(formData.get("commission")) || 500,
      description: formData.get("description") as string,
      amenities: (formData.get("amenities") as string)?.split(",").map(a => a.trim()).filter(Boolean) || [],
    };

    // Validate required fields
    if (!roomData.title || !roomData.rent || !roomData.location || !roomData.leavingDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Handle uploaded media files
    const mediaFiles = formData.getAll("media") as File[];
    const uploadedUrls: string[] = [];

    for (const file of mediaFiles) {
      if (file && file.size > 0) {
        // Upload to Cloudinary if configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64 = buffer.toString("base64");
            const dataUri = `data:${file.type};base64,${base64}`;

            const uploadResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  file: dataUri,
                  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "Takevolet",
                  folder: "Takevolet/rooms",
                }),
              }
            );

            if (uploadResponse.ok) {
              const data = await uploadResponse.json();
              uploadedUrls.push(data.secure_url);
            }
          } catch (uploadErr) {
            console.error("Cloudinary upload failed:", uploadErr);
          }
        }
      }
    }

    // Create room in database (Prisma) if available
    // For now return the room data with uploaded URLs
    const newRoom = {
      id: Date.now().toString(),
      ...roomData,
      images: uploadedUrls.filter(url => !url.includes("video")),
      videos: uploadedUrls.filter(url => url.includes("video")),
      furniture: [],
      hasItems: false,
      items: [],
      currentMembers: Number(roomData.membersAllowed),
      isAvailable: true,
      postedBy: {
        name: "You",
        phone: "",
        whatsapp: "",
        avatar: "https://i.pravatar.cc/150?img=1",
        profession: "",
      },
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ 
      success: true, 
      room: newRoom,
      message: "Room listing created successfully" 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const budget = searchParams.get("budget");
    const members = searchParams.get("members");
    const furnishing = searchParams.get("furnishing");
    const gender = searchParams.get("gender");
    const parking = searchParams.get("parking");
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    // Return mock rooms with filtering applied
    // In production this would query Prisma DB
    const { MOCK_ROOMS } = await import("@/data/mock");
    
    let rooms = MOCK_ROOMS.filter(room => room.isAvailable);

    if (location) rooms = rooms.filter(r => r.location === location);
    if (members) rooms = rooms.filter(r => r.membersAllowed >= Number(members));
    if (furnishing) rooms = rooms.filter(r => r.furnishing === furnishing);
    if (gender) rooms = rooms.filter(r => r.genderPreference === gender || r.genderPreference === "Any Gender");
    if (parking) rooms = rooms.filter(r => r.parking === parking || (parking === "Bike Parking" && r.parking.includes("Bike")) || (parking === "Car Parking" && r.parking.includes("Car")));

    if (budget) {
      const ranges: Record<string, [number, number]> = {
        "Under ₹5,000": [0, 5000],
        "₹5,000 - ₹8,000": [5000, 8000],
        "₹8,000 - ₹12,000": [8000, 12000],
        "₹12,000 - ₹18,000": [12000, 18000],
        "₹18,000 - ₹25,000": [18000, 25000],
        "₹25,000 - ₹40,000": [25000, 40000],
        "₹40,000 - ₹60,000": [40000, 60000],
        "₹60,000 - ₹80,000": [60000, 80000],
        "₹80,000+": [80000, 9999999],
      };
      const [min, max] = ranges[budget] || [0, 9999999];
      rooms = rooms.filter(r => r.rent >= min && r.rent <= max);
    }

    const total = rooms.length;
    const paginated = rooms.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      rooms: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
