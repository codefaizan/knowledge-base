"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CaptureInput } from "@/components/capture-input";
import { useAuth } from "@/components/auth-provider";
import { useItems } from "@/hooks/use-items";

function extractFirstUrl(input: string): string | null {
  const match = input.match(/https?:\/\/[^\s)\]}"']+/i);
  return match?.[0] ?? null;
}

function removeUrlFromText(input: string, url: string): string {
  return input.replace(url, "").replace(/\n{3,}/g, "\n\n").trim();
}

function inferSourceTagFromUrl(inputUrl: string): string | null {
  if (!inputUrl) return null;

  try {
    const hostname = new URL(inputUrl).hostname.toLowerCase();
    const normalizedHost = hostname.replace(/^www\./, "");
    const parts = normalizedHost.split(".").filter(Boolean);
    if (parts.length === 0) return null;

    const tldLike = new Set(["co", "com", "org", "net", "gov", "edu", "ac"]);
    const rootIndex =
      parts.length >= 3 && tldLike.has(parts[parts.length - 2])
        ? parts.length - 3
        : parts.length - 2;

    const root = parts[Math.max(0, rootIndex)] ?? parts[0];
    if (!root) return null;

    return `source:${root.replace(/[^a-z0-9-]/g, "")}`;
  } catch {
    return null;
  }
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <p className="text-zinc-500 text-sm">Preparing shared item...</p>
        </div>
      }
    >
      <SharePageContent />
    </Suspense>
  );
}

function SharePageContent() {
  const { user, loading: authLoading } = useAuth();
  const { capture } = useItems(user?.id);
  const router = useRouter();
  const searchParams = useSearchParams();

  const sharedUrl = searchParams.get("url")?.trim() ?? "";
  const sharedTitle = searchParams.get("title")?.trim() ?? "";
  const sharedText = searchParams.get("text")?.trim() ?? "";

  const normalizedLink = useMemo(() => {
    if (sharedUrl) return sharedUrl;
    return extractFirstUrl(sharedText) ?? extractFirstUrl(sharedTitle) ?? "";
  }, [sharedUrl, sharedText, sharedTitle]);

  const cleanedText = useMemo(() => {
    if (!normalizedLink || !sharedText.includes(normalizedLink)) return sharedText;
    return removeUrlFromText(sharedText, normalizedLink);
  }, [sharedText, normalizedLink]);

  const inferredSourceTag = useMemo(() => inferSourceTagFromUrl(normalizedLink), [normalizedLink]);

  const prefilledText = useMemo(() => {
    if (sharedTitle && cleanedText) return `${sharedTitle}\n\n${cleanedText}`;
    return sharedTitle || cleanedText;
  }, [sharedTitle, cleanedText]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/share")}`);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">Preparing shared item...</p>
      </div>
    );
  }

  const hasSharePayload = Boolean(normalizedLink || sharedTitle || cleanedText);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">Save shared item</h1>
          <p className="text-sm text-zinc-500">
            Review the imported content, add tags, then save it to your knowledge base.
          </p>
        </div>

        {!hasSharePayload && (
          <div className="border border-zinc-800 rounded-md bg-zinc-900/50 p-3">
            <p className="text-sm text-zinc-300">
              No share payload detected. You can still paste a link or note manually below.
            </p>
          </div>
        )}

        {hasSharePayload && (
          <div className="border border-zinc-800 rounded-md bg-zinc-900/50 p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Detected shared content</p>
            {sharedTitle && <p className="text-sm text-zinc-200">Title: {sharedTitle}</p>}
            {cleanedText && <p className="text-sm text-zinc-400">Text: {cleanedText}</p>}
            {normalizedLink && <p className="text-sm text-zinc-400">URL: {normalizedLink}</p>}
            {inferredSourceTag && <p className="text-sm text-zinc-400">Suggested tag: {inferredSourceTag}</p>}
          </div>
        )}

        <CaptureInput
          onCapture={capture}
          initialText={prefilledText}
          initialLink={normalizedLink}
          initialTags={inferredSourceTag ?? ""}
          submitLabel="Save shared item"
          onCaptured={() => router.replace("/")}
        />

        {inferredSourceTag && (
          <p className="text-xs text-zinc-500">
            We prefilled <span className="text-zinc-300">{inferredSourceTag}</span> based on the URL.
            You can edit or remove it before saving.
          </p>
        )}

        <p className="text-xs text-zinc-500">
          On platforms without web share target support, open the app and paste content manually on the
          <Link href="/" className="ml-1 text-zinc-300 hover:text-zinc-100 underline underline-offset-2">
            home screen
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
