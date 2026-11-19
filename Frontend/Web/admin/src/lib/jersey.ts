import { z } from "zod";

export const SPORTS = ["football", "cricket", "basketball"] as const;
export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Sport = (typeof SPORTS)[number];
export type Size = (typeof SIZES)[number];

/** Photo slots in spin order. The side view is what hangs on the rack. */
export const PHOTO_SLOTS = [
  { key: "front", label: "Front", required: true, hint: "Facing the camera" },
  { key: "side", label: "Side", required: true, hint: "Front facing left. Hangs on the rack" },
  { key: "backSide", label: "Back-side", required: false, hint: "Optional. Between side and back" },
  { key: "back", label: "Back", required: true, hint: "Back to the camera" },
] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number]["key"];

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Jersey details as entered in the form (photos are handled separately). */
export const jerseyDetailsSchema = z
  .object({
    team: z.string().trim().min(1, "Enter the team").max(60, "Keep the team under 60 characters"),
    name: z.string().trim().min(1, "Enter the jersey name").max(80, "Keep the name under 80 characters"),
    season: z
      .string()
      .trim()
      .regex(/^\d{4}\/\d{2}$/, "Use the format 2025/26"),
    sport: z.enum(SPORTS),
    price: z.coerce.number().int("Use whole rupees").positive("Enter a price above 0"),
    mrp: z.union([z.literal(""), z.coerce.number().int("Use whole rupees").positive()]).optional(),
    sizes: z.array(z.enum(SIZES)).min(1, "Choose at least one size"),
    customisable: z.boolean(),
    onRack: z.boolean(),
    rackMirror: z.boolean(),
    removeBackground: z.boolean(),
  })
  .refine((d) => d.mrp === undefined || d.mrp === "" || d.mrp > d.price, {
    path: ["mrp"],
    message: "The original price must be higher than the selling price",
  });

export type JerseyDetailsInput = z.input<typeof jerseyDetailsSchema>;
export type JerseyDetails = z.output<typeof jerseyDetailsSchema>;

export interface AdminJersey {
  id: string;
  team: string;
  name: string;
  season: string;
  sport: Sport;
  price: number;
  mrp?: number;
  sizes: Size[];
  customisable: boolean;
  onRack: boolean;
  rackMirror: boolean;
  createdAt: string;
  /** Display URLs for the front (hover) and side (rack) photos. */
  photos: Partial<Record<PhotoSlot, string>>;
}

/**
 * Check a file is really a PNG, JPEG or WebP by its first bytes, not just its name or type.
 * (The server must repeat this check; this only gives early feedback.)
 */
export async function sniffImageType(file: File): Promise<(typeof ACCEPTED_TYPES)[number] | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return "image/webp";
  return null;
}
