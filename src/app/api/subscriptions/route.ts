import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface SubscriptionRow {
  id: string;
  user_id: string;
  service_name: string;
  account_email?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
}

function getUserClient(token: string) {
  return createClient(
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
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getUserClient(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("expiry_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message || "Failed to fetch subscriptions" }, { status: 500 });

    return NextResponse.json({ subscriptions: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getUserClient(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const service_name = (body.service_name || "").toString().trim();
    const account_email = body.account_email ? String(body.account_email).trim() : null;
    const expiry_date = body.expiry_date ? String(body.expiry_date).trim() : null; // expect YYYY-MM-DD
    const notes = body.notes ? String(body.notes) : "";

    if (!service_name) return NextResponse.json({ error: "service_name is required" }, { status: 400 });

    const payload: any = {
      user_id: user.id,
      service_name,
      notes,
    };
    if (account_email) payload.account_email = account_email;
    if (expiry_date) payload.expiry_date = expiry_date;

    const { data, error } = await supabase.from("subscriptions").insert(payload).select("*").single();
    if (error) return NextResponse.json({ error: error.message || "Failed to save subscription" }, { status: 500 });

    return NextResponse.json({ subscription: data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getUserClient(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const id = body.id ? String(body.id) : "";
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const updates: Partial<Pick<SubscriptionRow, "service_name" | "account_email" | "expiry_date" | "notes">> = {};
    if (body.service_name !== undefined) {
      const service_name = String(body.service_name).trim();
      if (!service_name) return NextResponse.json({ error: "service_name cannot be empty" }, { status: 400 });
      updates.service_name = service_name;
    }
    if (body.account_email !== undefined) {
      const account_email = String(body.account_email).trim();
      updates.account_email = account_email || undefined;
    }
    if (body.expiry_date !== undefined) {
      const expiry_date = String(body.expiry_date).trim();
      updates.expiry_date = expiry_date || undefined;
    }
    if (body.notes !== undefined) {
      updates.notes = String(body.notes);
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message || "Failed to update subscription" }, { status: 500 });

    return NextResponse.json({ subscription: data });
  } catch {
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getUserClient(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const id = body.id ? String(body.id) : "";
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabase.from("subscriptions").delete().eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message || "Failed to delete subscription" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
