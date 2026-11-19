import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Product } from "@/lib/catalog";

/**
 * Jerseys for the home page rack, read from content/jerseys.json.
 *
 * Until the backend exists, the admin app writes this file (and the photos in public/jerseys/)
 * through its local bridge. Later this becomes a call to the backend's public jersey endpoint.
 */
const JERSEYS_FILE = path.join(process.cwd(), "content", "jerseys.json");

const photoUrl = z.string().regex(/^\/jerseys\/[a-z0-9-]+\/\d+\.webp$/);

const rackJerseySchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  team: z.string().min(1),
  name: z.string().min(1),
  season: z.string().min(1),
  sport: z.enum(["football", "cricket", "basketball"]),
  price: z.number().int().positive(),
  mrp: z.number().int().positive().optional(),
  sizes: z.array(z.enum(["S", "M", "L", "XL", "XXL"])).min(1),
  customisable: z.boolean(),
  onRack: z.boolean(),
  createdAt: z.string(),
  photos: z.object({
    frames: z.array(photoUrl).min(1),
    rack: z.number().int().min(0),
    hover: z.number().int().min(0),
    thumbs: z.array(z.number().int().min(0)),
    rackMirror: z.boolean().optional(),
  }),
});

export type RackJersey = z.infer<typeof rackJerseySchema>;

// Neutral colours for the (unused when photos exist) drawn fallback.
const DEFAULT_KIT: Product["kit"] = { primary: "#1f3fd1", secondary: "#ffffff", print: "#ffffff", pattern: "solid" };

function toProduct(j: RackJersey): Product {
  const last = j.photos.frames.length - 1;
  const clamp = (i: number) => Math.min(Math.max(i, 0), last);
  return {
    id: j.id,
    slug: j.slug,
    name: j.name,
    team: j.team,
    sport: j.sport,
    season: j.season,
    price: j.price,
    mrp: j.mrp,
    sizes: j.sizes,
    customisable: j.customisable,
    kit: DEFAULT_KIT,
    photos: {
      frames: j.photos.frames,
      rack: clamp(j.photos.rack),
      hover: clamp(j.photos.hover),
      thumbs: j.photos.thumbs.map(clamp),
      rackMirror: j.photos.rackMirror,
    },
  };
}

/** Jerseys switched on for the rack, in rack order. Invalid entries are skipped, not fatal. */
export async function getRackJerseys(): Promise<Product[]> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(JERSEYS_FILE, "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const out: Product[] = [];
  for (const entry of raw) {
    const parsed = rackJerseySchema.safeParse(entry);
    if (parsed.success && parsed.data.onRack) out.push(toProduct(parsed.data));
    else if (!parsed.success) console.warn("Skipping invalid jersey in content/jerseys.json", parsed.error.issues[0]);
  }
  return out;
}
