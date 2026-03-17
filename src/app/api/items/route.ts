import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";

interface ItemRow {
  id: string;
  user_id: string;
  type: "image" | "link" | "text";
  content: string;
}

function getR2KeyFromUrl(urlString: string): string | null {
  try {
    const parsed = new URL(urlString);
    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch {
    return null;
  }
}

function getDeleteErrorMessage(error: unknown): string {
  const maybeError = error as { name?: string; Code?: string; code?: string; message?: string };
  const code = maybeError?.Code || maybeError?.code || maybeError?.name;

  if (code === "NoSuchKey" || code === "NotFound") {
    return "R2 object not found.";
  }
  if (code === "AccessDenied") {
    return "R2 access denied while deleting image.";
  }
  if (typeof maybeError?.message === "string" && maybeError.message.trim()) {
    return maybeError.message;
  }

  return "Failed to delete item.";
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("id,user_id,type,content")
      .eq("id", id)
      .single<ItemRow>();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    if (item.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (item.type === "image") {
      const key = getR2KeyFromUrl(item.content);
      if (!key) {
        return NextResponse.json({ error: "Invalid image URL for this item." }, { status: 400 });
      }

      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
          })
        );
      } catch (error) {
        const message = getDeleteErrorMessage(error);
        if (message !== "R2 object not found.") {
          return NextResponse.json({ error: message }, { status: 500 });
        }
      }
    }

    const { error: deleteError } = await supabase.from("items").delete().eq("id", id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message || "Failed to delete item." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete item." }, { status: 500 });
  }
}
