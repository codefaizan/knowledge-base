"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { SearchBar } from "@/components/search-bar";
import { CaptureInput } from "@/components/capture-input";
import { ItemCard } from "@/components/item-card";
import { useItems } from "@/hooks/use-items";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    items,
    allTags,
    loading: itemsLoading,
    search,
    setSearch,
    activeTag,
    setActiveTag,
    capture,
    deleteItem,
  } = useItems(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

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
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">Knowledge Base</h1>
              <p className="text-sm text-zinc-500">Capture, tag, and find everything instantly.</p>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar value={search} onChange={setSearch} />
              </div>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`text-xs px-3 py-1 rounded-full cursor-pointer ${
                    activeTag === null
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`text-xs px-3 py-1 rounded-full cursor-pointer ${
                      activeTag === tag
                        ? "bg-zinc-100 text-zinc-900"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Item grid */}
            {itemsLoading ? (
              <p className="text-sm text-zinc-500 text-center py-10">Loading items...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-10">
                {search || activeTag ? "No matching items" : "No items yet. Add something from the sidebar."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} onDelete={deleteItem} />
                ))}
              </div>
            )}
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-6 space-y-2">
            <h2 className="text-sm font-medium text-zinc-300">Add note</h2>
            <CaptureInput onCapture={capture} submitLabel="Save" />
            <p className="text-xs text-zinc-500">Tip: use ⌘/Ctrl + Enter to save quickly.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
