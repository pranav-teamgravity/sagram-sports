"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { jerseyApi } from "@/lib/api/jerseys";
import type { AdminJersey } from "@/lib/jersey";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });


export default function JerseysPage() {
  const [jerseys, setJerseys] = useState<AdminJersey[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await jerseyApi.list();
      setJerseys(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load jerseys. Reload the page to try again.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleRack = async (j: AdminJersey) => {
    setJerseys((list) => list?.map((x) => (x.id === j.id ? { ...x, onRack: !j.onRack } : x)) ?? null);
    try {
      await jerseyApi.setOnRack(j.id, !j.onRack);
    } catch {
      setError(`Couldn't update ${j.name}. Try again.`);
      void load();
    }
  };

  const remove = async (j: AdminJersey) => {
    if (!window.confirm(`Delete ${j.name}? This removes its photos too.`)) return;
    try {
      await jerseyApi.remove(j.id);
      void load();
    } catch {
      setError(`Couldn't delete ${j.name}. Try again.`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-black">Jerseys</h1>
          <p className="mt-1 text-slate">Jerseys switched on here hang on the rack on the customer home page.</p>
        </div>
        <Link
          href="/jerseys/new"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-cobalt px-4 font-semibold text-white hover:bg-cobalt/90"
        >
          <Plus className="size-4" aria-hidden /> Add jersey
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-danger/10 px-4 py-3 text-danger" role="alert">
          {error}
        </p>
      )}

      {jerseys === null ? (
        <p className="mt-10 text-slate">Loading jerseys…</p>
      ) : jerseys.length === 0 ? (
        <div className="mt-10 rounded-xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-3xl font-extrabold">No jerseys added yet</p>
          <p className="mx-auto mt-2 max-w-md text-slate">
            Add a jersey with its front, side and back photos and it will hang on the rack on the home page.
          </p>
          <Link
            href="/jerseys/new"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-cobalt px-4 font-semibold text-white hover:bg-cobalt/90"
          >
            <Plus className="size-4" aria-hidden /> Add your first jersey
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {jerseys.map((j) => (
            <li key={j.id} className="flex items-center gap-4 px-4 py-3">
              <div className="checker relative h-20 w-14 shrink-0 overflow-hidden rounded-md">
                {(j.photos.side ?? j.photos.front) && (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img
                    src={j.photos.side ?? j.photos.front}
                    alt=""
                    className="absolute inset-0 size-full object-contain"
                    style={{ transform: j.rackMirror ? "scaleX(-1)" : undefined }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{j.name}</p>
                <p className="text-sm text-slate">
                  {j.team}, {j.season} · {j.sizes.join(", ")}
                </p>
              </div>
              <p className="hidden w-28 text-right sm:block">
                <span className="font-semibold">{inr.format(j.price)}</span>
                {j.mrp && <s className="block text-sm text-slate">{inr.format(j.mrp)}</s>}
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  role="switch"
                  checked={j.onRack}
                  onChange={() => void toggleRack(j)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-10 rounded-full bg-line transition-colors peer-checked:bg-turf peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                />
                On rack
              </label>
              <button
                type="button"
                onClick={() => void remove(j)}
                aria-label={`Delete ${j.name}`}
                className="grid size-9 place-items-center rounded-lg text-slate hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
