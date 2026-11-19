import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { BridgeError, assertBridgeAllowed, photoPathFromUrl } from "@/lib/server/bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serves a stored jersey photo (e.g. ?src=/jerseys/chelsea-home-2025/1.webp) for admin thumbnails. */
export async function GET(request: Request) {
  try {
    assertBridgeAllowed(request);
    const src = new URL(request.url).searchParams.get("src") ?? "";
    const file = photoPathFromUrl(src);
    if (!file) throw new BridgeError("Not found.", 404);
    const data = await readFile(file).catch(() => null);
    if (!data) throw new BridgeError("Not found.", 404);
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    const status = err instanceof BridgeError ? err.status : 500;
    return new NextResponse(null, { status });
  }
}
