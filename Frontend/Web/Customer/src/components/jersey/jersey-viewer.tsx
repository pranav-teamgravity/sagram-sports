"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Box, Check, Heart, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Product, Size } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { JerseyFrame, getJerseyFrames } from "./jersey-frame";

interface JerseyViewerProps {
  product: Product | null;
  onClose: () => void;
}

export function JerseyViewer({ product, onClose }: JerseyViewerProps) {
  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      {product && (
        <DialogContent
          className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-5xl md:grid-cols-[1.35fr_1fr] md:overflow-hidden"
          showCloseButton={false}
        >
          <ViewerBody key={product.id} product={product} onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ViewerBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const { frames, thumbs } = getJerseyFrames(product);
  const n = frames.length;
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number; id: number } | null>(null);
  const introTimer = useRef<number | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const hydrated = useHydrated();
  const saved = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleSaved = useWishlistStore((s) => s.toggle);

  const stopIntro = () => {
    if (introTimer.current !== null) window.clearInterval(introTimer.current);
    introTimer.current = null;
  };

  // One slow turn on open shows that the jersey can be rotated.
  useEffect(() => {
    if (reducedMotion || n < 3) return;
    let step = 0;
    introTimer.current = window.setInterval(() => {
      step++;
      setFrame(step % n);
      if (step >= n) stopIntro();
    }, 140);
    return stopIntro;
  }, [n, reducedMotion]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const go = (i: number) => {
    stopIntro();
    setFrame(((i % n) + n) % n);
  };

  const stepPx = () => Math.max(24, (stage.current?.clientWidth ?? 480) / (n * 1.2));

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopIntro();
    drag.current = { x: e.clientX, start: frame, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // Drag right turns the jersey to show its left side, like spinning it by hand.
    go(d.start - Math.round((e.clientX - d.x) / stepPx()));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(frame + 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(frame - 1);
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.current?.requestFullscreen?.();
  };

  const addToBag = () => {
    if (!size) {
      setSizeError(true);
      return;
    }
    addItem({ productId: product.id, size });
    setAdded(true);
  };

  return (
    <>
      {/* Dark 360° stage */}
      <div
        ref={stage}
        className="relative flex min-h-[420px] flex-col bg-[radial-gradient(ellipse_at_50%_40%,#3a3d46_0%,#1d1f25_55%,#121317_100%)] text-white md:min-h-[600px]"
      >
        <div className="flex items-center justify-between p-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium">
            <Box className="size-4" aria-hidden />
            360° view
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
          >
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>

        <div className="flex flex-1 gap-3 px-4 pb-4">
          <div
            role="group"
            aria-roledescription="360 degree viewer"
            aria-label={`${product.name}, ${frames[frame].angle}. Use the left and right arrow keys to turn it.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="relative flex-1 cursor-grab touch-pan-y select-none rounded-lg outline-offset-4 active:cursor-grabbing"
          >
            <div className="absolute inset-x-[8%] top-[4%] bottom-[16%]">
              {frames.map((f, i) => (
                <JerseyFrame
                  key={i}
                  product={product}
                  frame={f}
                  uid={`viewer-${product.id}-${i}`}
                  sizes="(min-width: 768px) 520px, 90vw"
                  priority={i === 0}
                  className={cn(
                    "drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)] transition-opacity duration-150 ease-out motion-reduce:transition-none",
                    i === frame ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
            {/* 360° ring */}
            <svg
              viewBox="0 0 400 70"
              className="pointer-events-none absolute inset-x-[6%] bottom-[2%] h-auto w-[88%]"
              aria-hidden
            >
              <ellipse cx="200" cy="30" rx="185" ry="24" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
              <path d="M70 50 Q200 66 300 50" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <path d="M292 43 L304 50 L292 57" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <text x="318" y="58" fill="#fff" fontSize="20" fontWeight="700" fontFamily="var(--font-display)">
                360°
              </text>
            </svg>
          </div>

          {/* Angle thumbnails */}
          <ul className="flex w-16 flex-col gap-2 sm:w-20" aria-label="Angles">
            {thumbs.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => go(t)}
                  aria-pressed={frame === t}
                  aria-label={frames[t].angle}
                  className={cn(
                    "relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-white transition-colors",
                    frame === t ? "border-shirt" : "border-transparent hover:border-white/60",
                  )}
                >
                  <span className="absolute inset-1.5">
                    <JerseyFrame
                      product={product}
                      frame={frames[t]}
                      uid={`thumb-${product.id}-${t}`}
                      sizes="80px"
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="px-4 pb-4 text-center text-sm text-white/60">Drag to turn the jersey</p>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogDescription className="text-slate">
              {product.team}, {product.season}
            </DialogDescription>
            <DialogTitle className="mt-1 font-display text-4xl leading-none font-extrabold text-navy">
              {product.name}
            </DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-navy">{formatPrice(product.price)}</span>
          {product.mrp && <s className="text-slate">{formatPrice(product.mrp)}</s>}
        </p>

        <fieldset>
          <legend className="text-sm font-semibold text-navy">Size</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <label key={s} className="cursor-pointer">
                <input
                  type="radio"
                  name={`size-${product.id}`}
                  value={s}
                  checked={size === s}
                  onChange={() => {
                    setSize(s);
                    setSizeError(false);
                    setAdded(false);
                  }}
                  className="peer sr-only"
                />
                <span className="grid h-11 min-w-12 place-items-center rounded-lg border border-input px-3 text-sm font-semibold text-navy transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:border-navy">
                  {s}
                </span>
              </label>
            ))}
          </div>
          {sizeError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              Choose a size to add this jersey to your bag.
            </p>
          )}
        </fieldset>

        {product.customisable && (
          <p className="text-sm text-slate">Name and number printing is available on this jersey.</p>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <Button size="lg" className="h-12 flex-1 text-base" onClick={addToBag}>
              {added ? (
                <>
                  <Check className="size-4" /> Added to bag
                </>
              ) : (
                "Add to bag"
              )}
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              className="size-12"
              onClick={() => toggleSaved(product.id)}
              aria-pressed={hydrated && saved}
              aria-label={hydrated && saved ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart className={cn("size-5", hydrated && saved && "fill-cobalt text-cobalt")} />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="lg"
            className="h-11"
            nativeButton={false}
            render={<Link href={`/jerseys/${product.slug}`} />}
          >
            View full details
          </Button>
        </div>
      </div>
    </>
  );
}
