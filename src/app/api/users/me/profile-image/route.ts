import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import prisma from "@/lib/prisma";
import { uploadProfileImage, isValidFileType, isValidFileSize, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/blob-storage";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!isValidFileType(file.type, ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only images are allowed (JPEG, PNG, WebP, GIF)" 
      }, { status: 400 });
    }

    // Validate file size
    if (!isValidFileSize(file.size, MAX_FILE_SIZE)) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const imageUrl = await uploadProfileImage(buffer, file.type);

    // Update user profile with new image URL
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImageUrl: imageUrl },
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json({ 
      error: "Failed to upload image", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 