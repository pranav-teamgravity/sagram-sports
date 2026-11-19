"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PhotoSlot } from "@/components/photo-slot";
import { RackPreview } from "@/components/rack-preview";
import { jerseyApi } from "@/lib/api/jerseys";
import {
  PHOTO_SLOTS,
  SIZES,
  SPORTS,
  jerseyDetailsSchema,
  type JerseyDetailsInput,
  type PhotoSlot as Slot,
  type Size,
} from "@/lib/jersey";

const INITIAL: JerseyDetailsInput = {
  team: "",
  name: "",
  season: "",
  sport: "football",
  price: "",
  mrp: "",
  sizes: [...SIZES],
  customisable: true,
  onRack: true,
  rackMirror: false,
  removeBackground: true,
};

type Errors = Partial<Record<keyof JerseyDetailsInput | Slot | "form", string>>;

const field =
  "mt-1 block h-11 w-full rounded-lg border border-line bg-white px-3 aria-invalid:border-danger focus-visible:border-cobalt";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-danger">
      {message}
    </p>
  );
}

export default function NewJerseyPage() {
  const router = useRouter();
  const [details, setDetails] = useState<JerseyDetailsInput>(INITIAL);
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({});
  const [urls, setUrls] = useState<Partial<Record<Slot, string>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Object URLs for previews; revoked when replaced or on leaving the page.
  useEffect(() => {
    const next: Partial<Record<Slot, string>> = {};
    for (const [slot, file] of Object.entries(files) as [Slot, File][]) next[slot] = URL.createObjectURL(file);
    setUrls(next);
    return () => Object.values(next).forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  const set = <K extends keyof JerseyDetailsInput>(key: K, value: JerseyDetailsInput[K]) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Suggest a name from the team once, without overwriting what the user typed.
  const onTeamBlur = () => {
    if (!details.name && details.team.trim()) set("name", `${details.team.trim()} home jersey`);
  };

  const toggleSize = (s: Size) =>
    set("sizes", details.sizes.includes(s) ? details.sizes.filter((x) => x !== s) : SIZES.filter((x) => x === s || details.sizes.includes(x)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = jerseyDetailsSchema.safeParse(details);
    const next: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
    }
    for (const slot of PHOTO_SLOTS) {
      if (slot.required && !files[slot.key]) next[slot.key] = `Add the ${slot.label.toLowerCase()} photo`;
    }
    setErrors(next);
    if (!parsed.success || Object.keys(next).length > 0) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setSaving(true);
    try {
      await jerseyApi.create({ details: parsed.data, photos: files });
      router.push("/jerseys");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Couldn't save the jersey. Try again." });
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/jerseys" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Jerseys
      </Link>
      <h1 className="mt-2 font-display text-5xl font-black">Add jersey</h1>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Details */}
          <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="details-heading">
            <h2 id="details-heading" className="font-display text-2xl font-extrabold">
              Details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="team" className="font-semibold">Team</label>
                <input
                  id="team"
                  className={field}
                  value={details.team}
                  onChange={(e) => set("team", e.target.value)}
                  onBlur={onTeamBlur}
                  maxLength={60}
                  placeholder="Chelsea"
                  aria-invalid={errors.team ? true : undefined}
                  aria-describedby="team-error"
                />
                <FieldError id="team-error" message={errors.team} />
              </div>
              <div>
                <label htmlFor="name" className="font-semibold">Jersey name</label>
                <input
                  id="name"
                  className={field}
                  value={details.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={80}
                  placeholder="Chelsea home jersey"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby="name-error"
                />
                <FieldError id="name-error" message={errors.name} />
              </div>
              <div>
                <label htmlFor="season" className="font-semibold">Season</label>
                <input
                  id="season"
                  className={field}
                  value={details.season}
                  onChange={(e) => set("season", e.target.value)}
                  placeholder="2025/26"
                  inputMode="numeric"
                  aria-invalid={errors.season ? true : undefined}
                  aria-describedby="season-error"
                />
                <FieldError id="season-error" message={errors.season} />
              </div>
              <div>
                <label htmlFor="sport" className="font-semibold">Sport</label>
                <select
                  id="sport"
                  className={field}
                  value={details.sport}
                  onChange={(e) => set("sport", e.target.value as JerseyDetailsInput["sport"])}
                >
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="price" className="font-semibold">Price (₹)</label>
                <input
                  id="price"
                  className={field}
                  value={String(details.price ?? "")}
                  onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="2199"
                  aria-invalid={errors.price ? true : undefined}
                  aria-describedby="price-error"
                />
                <FieldError id="price-error" message={errors.price} />
              </div>
              <div>
                <label htmlFor="mrp" className="font-semibold">
                  Original price (₹) <span className="font-normal text-slate">(optional, for offers)</span>
                </label>
                <input
                  id="mrp"
                  className={field}
                  value={String(details.mrp ?? "")}
                  onChange={(e) => set("mrp", e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="2599"
                  aria-invalid={errors.mrp ? true : undefined}
                  aria-describedby="mrp-error"
                />
                <FieldError id="mrp-error" message={errors.mrp} />
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="font-semibold">Sizes in stock</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input type="checkbox" checked={details.sizes.includes(s)} onChange={() => toggleSize(s)} className="peer sr-only" />
                    <span className="grid h-10 min-w-12 place-items-center rounded-lg border border-line px-3 font-semibold transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt">
                      {s}
                    </span>
                  </label>
                ))}
              </div>
              <FieldError id="sizes-error" message={errors.sizes} />
            </fieldset>

            <label className="mt-5 flex items-center gap-2">
              <input
                type="checkbox"
                checked={details.customisable}
                onChange={(e) => set("customisable", e.target.checked)}
                className="size-4 accent-cobalt"
              />
              Name and number printing available
            </label>
          </section>

          {/* Photos */}
          <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="font-display text-2xl font-extrabold">
              Photos
            </h2>
            <p className="mt-1 text-slate">
              Same distance and lighting for every angle. These turn into the 360° view, in this order.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {PHOTO_SLOTS.map((slot) => (
                <PhotoSlot
                  key={slot.key}
                  label={slot.label}
                  hint={slot.hint}
                  required={slot.required}
                  previewUrl={urls[slot.key]}
                  error={errors[slot.key]}
                  onChange={(file) => {
                    setFiles((f) => {
                      const next = { ...f };
                      if (file) next[slot.key] = file;
                      else delete next[slot.key];
                      return next;
                    });
                    setErrors((e) => ({ ...e, [slot.key]: undefined }));
                  }}
                  onReject={(message) => setErrors((e) => ({ ...e, [slot.key]: message }))}
                />
              ))}
            </div>
            <label className="mt-6 flex items-start gap-2">
              <input
                type="checkbox"
                checked={details.removeBackground}
                onChange={(e) => set("removeBackground", e.target.checked)}
                className="mt-1 size-4 accent-cobalt"
              />
              <span>
                Remove backgrounds automatically
                <span className="block text-sm text-slate">
                  Uses the AI cut-out tool. White kits cut out best from photos on a plain dark or coloured backdrop;
                  turn this off if your photos already have transparent backgrounds.
                </span>
              </span>
            </label>
          </section>
        </div>

        {/* Rack preview and publish */}
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <section className="rounded-xl border border-line bg-white p-4" aria-labelledby="rack-heading">
            <h2 id="rack-heading" className="font-display text-2xl font-extrabold">
              On the rack
            </h2>
            <div className="mt-3">
              <RackPreview sideUrl={urls.side} frontUrl={urls.front} mirror={details.rackMirror} />
            </div>
            <label className="mt-4 flex items-start gap-2">
              <input
                type="checkbox"
                checked={details.rackMirror}
                onChange={(e) => set("rackMirror", e.target.checked)}
                className="mt-1 size-4 accent-cobalt"
              />
              <span>
                Mirror the side photo
                <span className="block text-sm text-slate">
                  Every jersey on the rack faces left. Turn this on if the side photo faces right.
                </span>
              </span>
            </label>
            <label className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={details.onRack}
                onChange={(e) => set("onRack", e.target.checked)}
                className="size-4 accent-cobalt"
              />
              Show on the home page rack
            </label>
          </section>

          {errors.form && (
            <p className="rounded-lg bg-danger/10 px-4 py-3 text-danger" role="alert">
              {errors.form}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cobalt font-semibold text-white hover:bg-cobalt/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {saving ? "Saving jersey…" : "Save jersey"}
          </button>
          {saving && details.removeBackground && (
            <p className="text-center text-sm text-slate" role="status">
              Removing backgrounds. This can take up to a minute.
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
