"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CaptureInputProps {
  onCapture: (input: { text: string; tags: string[]; image?: File; link?: string }) => Promise<void>;
}

export function CaptureInput({ onCapture }: CaptureInputProps) {
  const [text, setText] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parseTags = (input: string): string[] =>
    input.split(",").map((t) => t.trim()).filter(Boolean);

  useEffect(() => {
    if (!pastedImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pastedImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pastedImage]);

  const submit = useCallback(
    async () => {
      const trimmed = text.trim();
      const trimmedLink = linkInput.trim();
      if (!trimmed && !pastedImage && !trimmedLink) return;

      setErrorMessage(null);
      setUploading(true);
      try {
        await onCapture({
          text: trimmed,
          tags: parseTags(tagInput),
          image: pastedImage ?? undefined,
          link: trimmedLink || undefined,
        });
        setText("");
        setLinkInput("");
        setTagInput("");
        setPastedImage(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save item. Please try again.";
        setErrorMessage(message);
      } finally {
        setUploading(false);
      }
    },
    [text, linkInput, tagInput, pastedImage, onCapture]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setErrorMessage(null);
          setPastedImage(file);
        }
        return;
      }
    }
  };

  const extractImageFile = (dataTransfer: DataTransfer): File | null => {
    const item = Array.from(dataTransfer.items).find((it) => it.type.startsWith("image/"));
    if (item) return item.getAsFile();

    const file = Array.from(dataTransfer.files).find((f) => f.type.startsWith("image/"));
    return file ?? null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingImage) setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = extractImageFile(e.dataTransfer);
    if (file) {
      setErrorMessage(null);
      setPastedImage(file);
    }
  };

  return (
    <div
      className={`border rounded-lg p-3.5 space-y-3 transition-colors ${
        isDraggingImage
          ? "border-zinc-600 bg-zinc-900"
          : "border-zinc-800 bg-zinc-900/60"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Add description or notes..."
        rows={2}
        disabled={uploading}
        className="w-full resize-none text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-500 disabled:opacity-50"
      />

      <input
        type="url"
        value={linkInput}
        onChange={(e) => setLinkInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="link (optional): https://..."
        disabled={uploading}
        className="w-full text-sm px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 text-zinc-100 rounded-md placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 disabled:opacity-50"
      />

      {isDraggingImage && (
        <p className="text-xs text-zinc-300">Drop image to attach it before saving.</p>
      )}

      {previewUrl && (
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-md p-2 space-y-2">
          <img
            src={previewUrl}
            alt="Pasted preview"
            className="w-full max-h-48 object-contain rounded"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">Image attached. Press save to upload.</p>
            <button
              type="button"
              onClick={() => setPastedImage(null)}
              disabled={uploading}
              className="text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-50 cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-400">{errorMessage}</p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="tags: comma-separated"
          disabled={uploading}
          className="flex-1 text-sm px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 text-zinc-100 rounded-md placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={uploading || (!text.trim() && !pastedImage && !linkInput.trim())}
          className="text-xs text-zinc-300 px-2.5 py-1.5 border border-zinc-700 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-30 cursor-pointer whitespace-nowrap transition-colors"
        >
          {uploading ? "Uploading..." : "⌘Enter: save"}
        </button>
      </div>
    </div>
  );
}
