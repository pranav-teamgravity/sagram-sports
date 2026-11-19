import "server-only";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { JerseyDetails, PhotoSlot } from "@/lib/jersey";

/*
 * Local bridge between the admin and the customer app, used until the backend exists.
 * It writes jersey photos into Customer/public/jerseys/<slug>/ and the jersey list into
 * Customer/content/jerseys.json, which the customer home page reads on every request.
 *
 * It writes to disk and has no login, so it only runs in development and only answers
 * requests made from this computer.
 */

const CUSTOMER_DIR = path.resolve(process.env.CUSTOMER_APP_DIR ?? path.join(process.cwd(), "..", "Customer"));
const JERSEYS_FILE = path.join(CUSTOMER_DIR, "content", "jerseys.json");
const PHOTOS_DIR = path.join(CUSTOMER_DIR, "public", "jerseys");
const TOOLS_DIR = path.join(process.cwd(), "tools");
const PYTHON =
  process.env.REMBG_PYTHON ??
  path.join(TOOLS_DIR, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");

export interface StoredJersey {
  id: string;
  slug: string;
  team: string;
  name: string;
  season: string;
  sport: JerseyDetails["sport"];
  price: number;
  mrp?: number;
  sizes: JerseyDetails["sizes"];
  customisable: boolean;
  onRack: boolean;
  createdAt: string;
  photos: { frames: string[]; rack: number; hover: number; thumbs: number[]; rackMirror?: boolean };
}

export class BridgeError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Only in development, and only for requests from this machine. */
export function assertBridgeAllowed(request: Request) {
  if (process.env.NODE_ENV === "production") throw new BridgeError("Not available.", 404);
  // Use the Host header the browser sent (Next may report a different local name in request.url).
  const host = request.headers.get("host") ?? "";
  const hostname = host.replace(/:\d+$/, "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) throw new BridgeError("Not available.", 404);
  // Changes must come from the admin's own pages, so another website open in the same browser
  // can't post to localhost and add or delete jerseys (CSRF).
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    let originHost = "";
    try {
      originHost = origin ? new URL(origin).host : "";
    } catch {
      originHost = "";
    }
    if (originHost !== host) throw new BridgeError("Request blocked: it didn't come from the admin.", 403);
  }
  if (!existsSync(CUSTOMER_DIR)) {
    throw new BridgeError(`Can't find the customer app at ${CUSTOMER_DIR}. Set CUSTOMER_APP_DIR.`, 500);
  }
}

/* ------------------------------------------------------------ jersey list */

// Serialise writes so two saves can't overwrite each other's changes.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export async function readJerseys(): Promise<StoredJersey[]> {
  try {
    const data = JSON.parse(await readFile(JERSEYS_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new BridgeError("The jersey list file is unreadable. Check content/jerseys.json in the customer app.", 500);
  }
}

async function writeJerseys(list: StoredJersey[]) {
  await mkdir(path.dirname(JERSEYS_FILE), { recursive: true });
  const tmp = `${JERSEYS_FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2) + "\n", "utf8");
  await rename(tmp, JERSEYS_FILE); // atomic replace: the customer site never reads half a file
}

export function updateJersey(id: string, change: (j: StoredJersey) => StoredJersey) {
  return exclusive(async () => {
    const list = await readJerseys();
    const i = list.findIndex((j) => j.id === id);
    if (i === -1) throw new BridgeError("That jersey no longer exists.", 404);
    list[i] = change(list[i]);
    await writeJerseys(list);
    return list[i];
  });
}

export function deleteJersey(id: string) {
  return exclusive(async () => {
    const list = await readJerseys();
    const jersey = list.find((j) => j.id === id);
    if (!jersey) throw new BridgeError("That jersey no longer exists.", 404);
    await writeJerseys(list.filter((j) => j.id !== id));
    const dir = safePhotoDir(jersey.slug);
    await rm(dir, { recursive: true, force: true });
  });
}

/* ----------------------------------------------------------------- photos */

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Resolve a jersey's photo folder, refusing anything that would land outside public/jerseys. */
function safePhotoDir(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new BridgeError("Invalid jersey folder name.", 400);
  const dir = path.resolve(PHOTOS_DIR, slug);
  if (path.dirname(dir) !== path.resolve(PHOTOS_DIR)) throw new BridgeError("Invalid jersey folder name.", 400);
  return dir;
}

/** Absolute path of a stored photo URL such as /jerseys/chelsea-home-2025/1.webp, or null. */
export function photoPathFromUrl(url: string) {
  const m = /^\/jerseys\/([a-z0-9-]+)\/(\d{1,2})\.webp$/.exec(url);
  if (!m) return null;
  return path.join(safePhotoDir(m[1]), `${m[2]}.webp`);
}

function runCutout(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    // Arguments are passed as an array (no shell), so file names can't inject commands.
    execFile(PYTHON, ["-I", path.join(TOOLS_DIR, "cutout.py"), ...args], { timeout: 5 * 60_000, windowsHide: true }, (err, _out, stderr) => {
      if (!err) return resolve();
      const detail = String(stderr).trim().split("\n").pop() ?? "";
      reject(new BridgeError(`Couldn't process the photos. ${detail}`.trim(), 500));
    });
  });
}

const SLOT_ORDER: PhotoSlot[] = ["front", "side", "backSide", "back"];

/** Process the uploaded photos and add the jersey to the list. */
export async function createJersey(details: JerseyDetails, files: Partial<Record<PhotoSlot, File>>) {
  if (!existsSync(PYTHON)) {
    throw new BridgeError("The photo tool isn't set up. Create tools/.venv with rembg installed (see tools/README.md).", 500);
  }
  const slots = SLOT_ORDER.filter((s) => files[s]);
  const tmp = await mkdtemp(path.join(os.tmpdir(), "sagram-jersey-"));
  try {
    // Work out a unique folder name, then process into a temporary folder first.
    const base = slugify(`${details.name.replace(/\bjersey\b/i, "")} ${details.season.slice(0, 4)}`) || "jersey";
    const args: string[] = details.removeBackground ? ["--remove-bg"] : [];
    const outputs: string[] = [];
    for (const [i, slot] of slots.entries()) {
      const input = path.join(tmp, `in-${i}`);
      await writeFile(input, Buffer.from(await files[slot]!.arrayBuffer()));
      const output = path.join(tmp, `${i}.webp`);
      args.push(input, output);
      outputs.push(output);
    }
    await runCutout(args);

    return await exclusive(async () => {
      const list = await readJerseys();
      let slug = base;
      for (let n = 2; list.some((j) => j.slug === slug) || existsSync(path.join(PHOTOS_DIR, slug)); n++) slug = `${base}-${n}`;
      const dir = safePhotoDir(slug);
      await mkdir(dir, { recursive: true });
      const frames: string[] = [];
      for (const [i, output] of outputs.entries()) {
        await writeFile(path.join(dir, `${i}.webp`), await readFile(output));
        frames.push(`/jerseys/${slug}/${i}.webp`);
      }
      const jersey: StoredJersey = {
        id: randomUUID(),
        slug,
        team: details.team,
        name: details.name,
        season: details.season,
        sport: details.sport,
        price: details.price,
        ...(typeof details.mrp === "number" ? { mrp: details.mrp } : {}),
        sizes: details.sizes,
        customisable: details.customisable,
        onRack: details.onRack,
        createdAt: new Date().toISOString(),
        photos: {
          frames,
          rack: slots.indexOf("side"),
          hover: slots.indexOf("front"),
          thumbs: frames.map((_, i) => i),
          rackMirror: details.rackMirror,
        },
      };
      list.push(jersey);
      await writeJerseys(list);
      return jersey;
    });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
