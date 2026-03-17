import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const MIN_SIZE = 64;
const MAX_SIZE = 1024;

function getSize(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) return 192;
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, parsed));
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = getSize(searchParams.get("size"));
  const maskable = searchParams.get("maskable") === "1";

  const padding = maskable ? Math.floor(size * 0.15) : 0;
  const contentSize = size - padding * 2;
  const fontSize = Math.max(16, Math.floor(contentSize * 0.28));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          padding,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: contentSize,
            height: contentSize,
            borderRadius: Math.floor(contentSize * 0.22),
            background: "linear-gradient(135deg, #27272a 0%, #18181b 100%)",
            border: `${Math.max(2, Math.floor(contentSize * 0.02))}px solid #3f3f46`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f4f4f5",
            fontSize,
            fontWeight: 700,
            letterSpacing: "0.04em",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          KB
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
