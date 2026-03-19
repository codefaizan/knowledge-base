"use client";

import { useState } from "react";
import type { Item } from "@/hooks/use-items";

interface ItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const seconds = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (seconds < 60) return rtf.format(-seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}

export function ItemCard({ item, onDelete }: ItemCardProps) {
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  const isTextItem = item.type === "text";
  const shouldShowTextToggle = isTextItem && item.content.length > 120;

  return (
    <div className="group h-full flex flex-col border border-zinc-800 bg-zinc-900/60 rounded-lg p-3.5 hover:border-zinc-700 transition-colors">
      <div className="mb-2 flex-1">
        {item.type === "image" && (
          <>
            <img
              src={item.content}
              alt={item.title}
              className="w-full h-40 object-cover rounded"
            />
            {item.title && (
              <p className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap break-words">{item.title}</p>
            )}
          </>
        )}
        {item.type === "link" && (
          <div className="space-y-1.5">
            {item.title && item.title !== item.content && (
              <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{item.title}</p>
            )}
            <a
              href={item.content}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-400 hover:text-blue-300 hover:underline break-all overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
              title={item.content}
            >
              {item.content}
            </a>
          </div>
        )}
        {item.type === "text" && (
          <div>
            <p
              className={`text-sm text-zinc-200 whitespace-pre-wrap break-words ${
                isTextExpanded
                  ? ""
                  : "overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
              }`}
            >
              {item.content}
            </p>
            {shouldShowTextToggle && (
              <button
                type="button"
                onClick={() => setIsTextExpanded((prev) => !prev)}
                className="mt-1 text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
              >
                {isTextExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>
        )}
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {formatRelativeTime(item.created_at)}
        </span>
        <button
          onClick={() => onDelete(item.id)}
          className="text-xs text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:text-red-300 cursor-pointer"
        >
          delete
        </button>
      </div>
    </div>
  );
}
