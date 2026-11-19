import { NextResponse } from "next/server";
import { z } from "zod";
import { BridgeError, assertBridgeAllowed, deleteJersey, updateJersey } from "@/lib/server/bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(err: unknown) {
  if (err instanceof BridgeError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error(err);
  return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
}

// Only these fields can be changed after creation.
const patchSchema = z.object({ onRack: z.boolean() }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertBridgeAllowed(request);
    const { id } = await params;
    const body = patchSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) throw new BridgeError("Only the on-rack setting can be changed here.");
    const jersey = await updateJersey(id, (j) => ({ ...j, onRack: body.data.onRack }));
    return NextResponse.json(jersey);
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertBridgeAllowed(request);
    const { id } = await params;
    await deleteJersey(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return fail(err);
  }
}
