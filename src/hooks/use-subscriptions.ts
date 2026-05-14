"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  account_email?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  created_at: string;
}

const EXPIRY_WINDOW_DAYS = 30;

function getDaysUntilExpiry(expiryDate?: string | null) {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isExpiringSoon(subscription: Subscription, days = EXPIRY_WINDOW_DAYS): boolean {
  const daysLeft = getDaysUntilExpiry(subscription.expiry_date);
  return daysLeft !== null && daysLeft > 0 && daysLeft <= days;
}

export function useSubscriptions(userId: string | undefined) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    if (!userId) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) {
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      const res = await window.fetch("/api/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      const body = await res.json();
      setSubscriptions(body.subscriptions ?? []);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const add = useCallback(
    async (data: { service_name: string; account_email?: string; expiry_date?: string; notes?: string }) => {
      const supabase = getSupabase();
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("You must be signed in to add subscriptions.");

      const res = await window.fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        let message = "Failed to add subscription.";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // Keep default message.
        }
        throw new Error(message);
      }

      await fetchSubscriptions();
    },
    [fetchSubscriptions]
  );

  const update = useCallback(
    async (
      id: string,
      data: { service_name?: string; account_email?: string; expiry_date?: string | null; notes?: string }
    ) => {
      const supabase = getSupabase();
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("You must be signed in to update subscriptions.");

      const res = await window.fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, ...data }),
      });

      if (!res.ok) {
        let message = "Failed to update subscription.";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // Keep default message.
        }
        throw new Error(message);
      }

      await fetchSubscriptions();
    },
    [fetchSubscriptions]
  );

  const remove = useCallback(
    async (id: string) => {
      const supabase = getSupabase();
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("You must be signed in to delete subscriptions.");

      const res = await window.fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        let message = "Failed to delete subscription.";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // Keep default message.
        }
        throw new Error(message);
      }

      await fetchSubscriptions();
    },
    [fetchSubscriptions]
  );

  const expiringSoonCount = useMemo(
    () => subscriptions.filter((subscription) => isExpiringSoon(subscription)).length,
    [subscriptions]
  );

  return { subscriptions, loading, add, update, remove, expiringSoonCount, refetch: fetchSubscriptions };
}
