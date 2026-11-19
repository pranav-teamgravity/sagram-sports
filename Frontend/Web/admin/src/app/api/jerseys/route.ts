import { NextResponse } from "next/server";
import { MAX_PHOTO_BYTES, PHOTO_SLOTS, jerseyDetailsSchema, sniffImageType, type PhotoSlot } from "@/lib/jersey";
import { BridgeError, assertBridgeAllowed, createJersey, readJerseys } from "@/lib/server/bridge";

// Writes files and runs the photo tool: Node runtime, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(err: unknown) {
  if (err instanceof BridgeError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error(err);
  return NextResponse.json({ error: "Something went wrong saving the jersey. Try again." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    assertBridgeAllowed(request);
    return NextResponse.json(await readJerseys());
  } catch (err) {
    return fail(err);
  }
}

const bool = (v: FormDataEntryValue | null) => v === "true";

export async function POST(request: Request) {
  try {
    assertBridgeAllowed(request);
    // Reject oversized bodies before reading them (4 photos × 10 MB plus form fields).
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 4 * MAX_PHOTO_BYTES + 64 * 1024) throw new BridgeError("The upload is too large. Use photos under 10 MB each.", 413);

    const form = await request.formData();
    // Validate on the server too; only known fields are read (no mass assignment).
    const parsed = jerseyDetailsSchema.safeParse({
      team: form.get("team") ?? "",
      name: form.get("name") ?? "",
      season: form.get("season") ?? "",
      sport: form.get("sport") ?? "",
      price: form.get("price") ?? "",
      mrp: form.get("mrp") ?? "",
      sizes: form.getAll("sizes"),
      customisable: bool(form.get("customisable")),
      onRack: bool(form.get("onRack")),
      rackMirror: bool(form.get("rackMirror")),
      removeBackground: bool(form.get("removeBackground")),
    });
    if (!parsed.success) throw new BridgeError(parsed.error.issues[0]?.message ?? "Check the jersey details.");

    const files: Partial<Record<PhotoSlot, File>> = {};
    for (const slot of PHOTO_SLOTS) {
      const value = form.get(`photo_${slot.key}`);
      if (!(value instanceof File) || value.size === 0) {
        if (slot.required) throw new BridgeError(`Add the ${slot.label.toLowerCase()} photo.`);
        continue;
      }
      if (value.size > MAX_PHOTO_BYTES) throw new BridgeError(`The ${slot.label.toLowerCase()} photo is over 10 MB.`, 413);
      if (!(await sniffImageType(value))) throw new BridgeError(`The ${slot.label.toLowerCase()} photo isn't a PNG, JPEG or WebP image.`);
      files[slot.key] = value;
    }

    const jersey = await createJersey(parsed.data, files);
    return NextResponse.json(jersey, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
