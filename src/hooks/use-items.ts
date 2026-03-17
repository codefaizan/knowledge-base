"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";

// Types
export type ItemType = "image" | "link" | "text";

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  content: string;
  tags: string[];
  user_id: string;
  created_at: string;
}

interface NewItem {
  type: ItemType;
  title: string;
  content: string;
  tags: string[];
  user_id: string;
}

function isUrl(str: string): boolean {
  try {
    const url = new URL(str.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useItems(userId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (activeTag) {
      result = result.filter((item) => item.tags.includes(activeTag));
    }

    if (search.trim()) {
      const terms = search
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const scored = result
        .map((item) => {
          const title = item.title.toLowerCase();
          const content = item.content.toLowerCase();
          const tags = item.tags.map((tag) => tag.toLowerCase());

          let score = 0;
          const allTermsMatch = terms.every((term) => {
            const titleMatch = title.includes(term);
            const contentMatch = content.includes(term);
            const tagMatch = tags.some((tag) => tag.includes(term));

            if (!titleMatch && !contentMatch && !tagMatch) {
              return false;
            }

            const wordRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
            const prefixRegex = new RegExp(`\\b${escapeRegex(term)}`, "i");

            if (titleMatch) score += 8;
            if (tagMatch) score += 5;
            if (contentMatch) score += 3;

            if (wordRegex.test(title)) score += 2;
            if (tags.some((tag) => wordRegex.test(tag))) score += 2;
            if (wordRegex.test(content)) score += 1;

            if (prefixRegex.test(title)) score += 1;
            if (tags.some((tag) => prefixRegex.test(tag))) score += 1;

            return true;
          });

          const ageMs = Date.now() - new Date(item.created_at).getTime();
          const ageDays = ageMs / (1000 * 60 * 60 * 24);
          const recencyBonus = 2 / (1 + Math.max(0, ageDays));
          score += recencyBonus;

          return { item, score, allTermsMatch };
        })
        .filter((entry) => entry.allTermsMatch)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime();
        });

      result = scored.map((entry) => entry.item);
    }

    return result;
  }, [items, search, activeTag]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => item.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [items]);

  const capture = useCallback(
    async (input: { text: string; tags: string[]; image?: File; link?: string }) => {
      if (!userId) {
        throw new Error("You must be signed in to capture items.");
      }

      let type: ItemType;
      let content: string;
      let title = "";
      const description = input.text.trim();
      const link = input.link?.trim() ?? "";

      if (input.image) {
        type = "image";
        const session = await getSupabase()?.auth.getSession();
        const token = session?.data.session?.access_token;
        if (!token) {
          throw new Error("Your session expired. Please sign in again.");
        }

        const formData = new FormData();
        formData.append("file", input.image);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          let message = "Image upload failed.";
          try {
            const body = await res.json();
            if (typeof body?.error === "string" && body.error.trim()) {
              message = body.error;
            }
          } catch {
            // Keep default message when response isn't JSON
          }
          throw new Error(message);
        }

        const { url } = await res.json();
        if (!url) {
          throw new Error("Image upload failed. Missing uploaded file URL.");
        }

        content = url;
        title = description || input.image.name;
      } else if (link) {
        if (!isUrl(link)) {
          throw new Error("Please enter a valid link URL (http or https).");
        }

        type = "link";
        content = link;
        title = description || content;
      } else if (isUrl(description)) {
        type = "link";
        content = description;
        title = content;
      } else {
        if (!description) {
          throw new Error("Add text, an image, or a link before saving.");
        }

        type = "text";
        content = description;
        title = content.slice(0, 100);
      }

      const newItem: NewItem = { type, title, content, tags: input.tags, user_id: userId };
      const { error } = await getSupabase()?.from("items").insert(newItem) ?? {};
      if (error) {
        throw new Error(error.message || "Failed to save item.");
      }

      await fetchItems();
    },
    [userId, fetchItems]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const supabase = getSupabase();
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;

      if (!token) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const res = await fetch("/api/items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        let message = "Failed to delete item.";
        try {
          const body = await res.json();
          if (typeof body?.error === "string" && body.error.trim()) {
            message = body.error;
          }
        } catch {
          // Keep default message when response isn't JSON
        }
        throw new Error(message);
      }

      await fetchItems();
    },
    [fetchItems]
  );

  const updateTags = useCallback(
    async (id: string, tags: string[]) => {
      await getSupabase()?.from("items").update({ tags }).eq("id", id);
      await fetchItems();
    },
    [fetchItems]
  );

  return {
    items: filteredItems,
    allTags,
    loading,
    search,
    setSearch,
    activeTag,
    setActiveTag,
    capture,
    deleteItem,
    updateTags,
  };
}
