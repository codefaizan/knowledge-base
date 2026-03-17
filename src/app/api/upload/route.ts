import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

function getUploadErrorMessage(error: unknown): string {
  const maybeError = error as { name?: string; Code?: string; code?: string; message?: string };
  const code = maybeError?.Code || maybeError?.code || maybeError?.name;

  if (code === "NoSuchBucket") {
    return "Storage bucket not found. Check R2_BUCKET_NAME in your environment settings.";
  }
  if (code === "InvalidAccessKeyId" || code === "SignatureDoesNotMatch") {
    return "Invalid R2 credentials. Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.";
  }
  if (code === "AccessDenied") {
    return "R2 access denied. Ensure your API token has object read/write permission for this bucket.";
  }
  if (code === "RequestTimeout" || code === "TimeoutError") {
    return "Upload timed out. Please try again.";
  }

  if (typeof maybeError?.message === "string" && maybeError.message.trim()) {
    return maybeError.message;
  }

  return "Image upload failed. Please try again.";
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Upload to R2
    const key = `users/${user.id}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return NextResponse.json({ url: `${R2_PUBLIC_URL}/${key}` });
  } catch (error) {
    return NextResponse.json({ error: getUploadErrorMessage(error) }, { status: 500 });
  }
}
