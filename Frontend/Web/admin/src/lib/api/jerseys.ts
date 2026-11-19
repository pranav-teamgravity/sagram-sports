/**
 * Jersey data access for the admin screens.
 *
 * Talks to the admin's local bridge routes (/api/jerseys), which write straight into the customer
 * app until the Node + SQL backend exists. The backend contract is in
 * Documentation/admin-jersey-api.md; when it's ready, point these calls at the backend and no
 * screen needs to change.
 */
import type { AdminJersey, JerseyDetails, PhotoSlot } from "@/lib/jersey";

export interface NewJersey {
  details: JerseyDetails;
  photos: Partial<Record<PhotoSlot, File>>;
}

export interface JerseyApi {
  list(): Promise<AdminJersey[]>;
  create(input: NewJersey): Promise<AdminJersey>;
  setOnRack(id: string, onRack: boolean): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Shape stored in the customer app's content/jerseys.json. */
interface StoredJersey {
  id: string;
  slug: string;
  team: string;
  name: string;
  season: string;
  sport: AdminJersey["sport"];
  price: number;
  mrp?: number;
  sizes: AdminJersey["sizes"];
  customisable: boolean;
  onRack: boolean;
  createdAt: string;
  photos: { frames: string[]; rack: number; hover: number; rackMirror?: boolean };
}

const photoUrl = (src: string | undefined) => (src ? `/api/jersey-photo?src=${encodeURIComponent(src)}` : undefined);

function toAdmin(j: StoredJersey): AdminJersey {
  return {
    id: j.id,
    team: j.team,
    name: j.name,
    season: j.season,
    sport: j.sport,
    price: j.price,
    mrp: j.mrp,
    sizes: j.sizes,
    customisable: j.customisable,
    onRack: j.onRack,
    rackMirror: Boolean(j.photos.rackMirror),
    createdAt: j.createdAt,
    photos: {
      front: photoUrl(j.photos.frames[j.photos.hover] ?? j.photos.frames[0]),
      side: photoUrl(j.photos.frames[j.photos.rack]),
    },
  };
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `The server answered ${res.status}. Try again.`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const jerseyApi: JerseyApi = {
  async list() {
    const all = await request<StoredJersey[]>("/api/jerseys");
    // Newest first in the admin; the rack itself keeps the file's order.
    return [...all].reverse().map(toAdmin);
  },

  async create({ details, photos }) {
    const form = new FormData();
    form.set("team", details.team);
    form.set("name", details.name);
    form.set("season", details.season);
    form.set("sport", details.sport);
    form.set("price", String(details.price));
    if (typeof details.mrp === "number") form.set("mrp", String(details.mrp));
    details.sizes.forEach((s) => form.append("sizes", s));
    form.set("customisable", String(details.customisable));
    form.set("onRack", String(details.onRack));
    form.set("rackMirror", String(details.rackMirror));
    form.set("removeBackground", String(details.removeBackground));
    for (const [slot, file] of Object.entries(photos) as [PhotoSlot, File][]) form.set(`photo_${slot}`, file);
    return toAdmin(await request<StoredJersey>("/api/jerseys", { method: "POST", body: form }));
  },

  async setOnRack(id, onRack) {
    await request(`/api/jerseys/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onRack }),
    });
  },

  async remove(id) {
    await request(`/api/jerseys/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
