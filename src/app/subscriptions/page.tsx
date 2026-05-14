"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { SubscriptionCard } from "@/components/subscription-card";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscriptions, loading, add, update, remove } = useSubscriptions(user?.id);

  const [serviceName, setServiceName] = useState("");
  const [email, setEmail] = useState("");
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await add({ service_name: serviceName, account_email: email || undefined, expiry_date: expiry || undefined, notes });
      setServiceName("");
      setEmail("");
      setExpiry("");
      setNotes("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to add subscription");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">Subscriptions</h1>
              <p className="text-sm text-zinc-500">Manage your recurring services and know when they expire.</p>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">All subscriptions</h2>
              {loading ? (
                <p className="text-sm text-zinc-500 text-center py-10">Loading subscriptions...</p>
              ) : subscriptions.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-10">No subscriptions yet. Add one from the right.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {subscriptions.map((s: any) => (
                    <SubscriptionCard key={s.id} subscription={s} onUpdate={update} onDelete={remove} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-6 space-y-2">
            <h2 className="text-sm font-medium text-zinc-300">Add subscription</h2>
            <form
              onSubmit={handleAdd}
              className="border rounded-lg p-3.5 space-y-3 border-zinc-800 bg-zinc-900/60 transition-colors"
            >
              <input
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Service name"
                className="w-full text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
                disabled={saving}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Account email (optional)"
                className="w-full text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
                disabled={saving}
              />
              <input
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                type="date"
                className="w-full text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
                disabled={saving}
              />
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
                disabled={saving}
              />

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 flex-1">Add a service and set an expiry date to track renewals.</span>
                <button
                  type="submit"
                  disabled={saving || !serviceName.trim()}
                  className="text-xs text-zinc-300 px-2.5 py-1.5 border border-zinc-700 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-30 cursor-pointer whitespace-nowrap transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>

            <p className="text-xs text-zinc-500">Tip: expiry dates are shown in local time. Subscriptions expiring within 30 days are highlighted.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
