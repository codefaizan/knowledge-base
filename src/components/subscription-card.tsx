"use client";

import { useEffect, useMemo, useState } from "react";
import type { Subscription } from "@/hooks/use-subscriptions";

interface Props {
  subscription: Subscription;
  onUpdate: (
    id: string,
    data: { service_name?: string; account_email?: string; expiry_date?: string | null; notes?: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

function toDateInputValue(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function getDaysLeft(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function SubscriptionCard({ subscription, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState(subscription.service_name);
  const [accountEmail, setAccountEmail] = useState(subscription.account_email ?? "");
  const [expiryDate, setExpiryDate] = useState(toDateInputValue(subscription.expiry_date));
  const [notes, setNotes] = useState(subscription.notes ?? "");

  useEffect(() => {
    if (!isEditing) {
      setServiceName(subscription.service_name);
      setAccountEmail(subscription.account_email ?? "");
      setExpiryDate(toDateInputValue(subscription.expiry_date));
      setNotes(subscription.notes ?? "");
    }
  }, [subscription, isEditing]);

  const daysLeft = useMemo(() => getDaysLeft(subscription.expiry_date), [subscription.expiry_date]);
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
  const isExpired = daysLeft !== null && daysLeft < 0;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await onUpdate(subscription.id, {
        service_name: serviceName.trim(),
        account_email: accountEmail.trim() || null,
        expiry_date: expiryDate || null,
        notes,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete ${subscription.service_name}?`);
    if (!confirmed) return;

    setError(null);
    setSaving(true);
    try {
      await onDelete(subscription.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subscription.");
      setSaving(false);
    }
  };

  return (
    <div className="group h-full flex flex-col border border-zinc-800 bg-zinc-900/60 rounded-lg p-3.5 transition-colors">
      {!isEditing ? (
        <>
          <div className="mb-2 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">{subscription.service_name}</h3>
                <p className="mt-1 text-xs text-zinc-400">Created {formatDate(subscription.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-zinc-300 px-2.5 py-1.5 border border-zinc-700 bg-zinc-800 rounded-md hover:bg-zinc-700 cursor-pointer whitespace-nowrap transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-xs text-red-300 px-2.5 py-1.5 border border-red-500/30 bg-red-500/10 rounded-md hover:bg-red-500/20 disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-zinc-300 whitespace-pre-wrap break-words">{subscription.notes || "No notes"}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400">Email: {subscription.account_email ?? "-"}</span>
              <span
                className={`font-medium px-2 py-0.5 rounded-full border ${
                  isExpired
                    ? "text-red-300 bg-red-500/10 border-red-500/20"
                    : isExpiringSoon
                      ? "text-yellow-300 bg-yellow-500/10 border-yellow-500/20"
                      : "text-zinc-300 bg-zinc-950/60 border-zinc-800"
                }`}
              >
                Expiry: {formatDate(subscription.expiry_date)} {daysLeft !== null ? `(${daysLeft}d)` : ""}
              </span>
            </div>
          </div>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3">
            <input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Service name"
              disabled={saving}
              className="w-full text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
            />
            <input
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="Account email (optional)"
              disabled={saving}
              className="w-full text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={saving}
              className="w-full text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={3}
              disabled={saving}
              className="w-full resize-none text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 rounded-md"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="text-xs text-zinc-300 px-2.5 py-1.5 border border-zinc-700 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !serviceName.trim()}
              className="ml-auto text-xs text-zinc-300 px-2.5 py-1.5 border border-zinc-700 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
