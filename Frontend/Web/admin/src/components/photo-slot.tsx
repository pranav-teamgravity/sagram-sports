"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { MAX_PHOTO_BYTES, sniffImageType } from "@/lib/jersey";

interface PhotoSlotProps {
  label: string;
  hint: string;
  required: boolean;
  previewUrl?: string;
  error?: string;
  onChange: (file: File | null) => void;
  onReject: (message: string) => void;
}

export function PhotoSlot({ label, hint, required, previewUrl, error, onChange, onReject }: PhotoSlotProps) {
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      onReject(`${label}: the file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Use a photo under 10 MB.`);
      return;
    }
    if (!(await sniffImageType(file))) {
      onReject(`${label}: this isn't a PNG, JPEG or WebP image.`);
      return;
    }
    onChange(file);
  };

  return (
    <div>
      {/* Fixed-height header keeps all four photo boxes aligned. */}
      <div className="min-h-16">
        <label htmlFor={inputId} className="font-semibold">
          {label}
        </label>
        <p id={hintId} className="text-sm leading-snug text-slate">
          {hint}
        </p>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void accept(e.dataTransfer.files[0]);
        }}
        className={`relative mt-2 aspect-[4/5] overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          dragging ? "border-cobalt bg-cobalt/5" : error ? "border-danger" : "border-line"
        } ${previewUrl ? "checker border-solid" : "bg-white"}`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={previewUrl} alt={`${label} photo`} className="absolute inset-0 size-full object-contain p-2" />
        ) : (
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-sm text-slate">
            <ImagePlus className="size-6" aria-hidden />
            Drop a photo or click to choose
            <span className="text-xs">PNG, JPEG or WebP, up to 10 MB</span>
          </span>
        )}
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-describedby={hintId}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          onChange={(e) => void accept(e.target.files?.[0])}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      {previewUrl && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            if (input.current) input.current.value = "";
          }}
          className="mt-1 inline-flex items-center gap-1 text-sm text-slate hover:text-danger"
          aria-label={`Remove ${label.toLowerCase()} photo`}
        >
          <X className="size-3.5" aria-hidden /> Remove
        </button>
      )}
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
