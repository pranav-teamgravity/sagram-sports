"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { JerseyFrame, getJerseyFrames } from "@/components/jersey/jersey-frame";
import { JerseyViewer } from "@/components/jersey/jersey-viewer";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

/* ------------------------------------------------------------------ layout */

/** Up to this many jerseys hang spaced apart; more than this pack together, overlapping. */
const SPACIOUS_MAX = 10;
const PIPE_R = 7;
const BEND_R = 18;
const RAIL_Y = 22;

interface RackLayout {
  spacious: boolean;
  /** Jersey image height */
  jh: number;
  /** Width of each jersey's image box */
  boxW: number;
  /** Distance between hangers */
  step: number;
  /** Rack leg x positions */
  legL: number;
  legR: number;
  width: number;
  collarY: number;
  floorY: number;
  height: number;
  centers: number[];
}

function computeLayout(count: number, available: number): RackLayout {
  const spacious = count <= SPACIOUS_MAX;
  const legL = 18;
  const gaps = Math.max(1, count - 1);
  const insetFor = (h: number) => (spacious ? h * 0.36 : h * 0.22);
  const widthFor = (h: number, st: number) => legL * 2 + (count - 1) * st + insetFor(h) * 2;

  // Largest jersey size (within limits) whose rack fits the available width. Spaced-apart jerseys
  // may close up to about half a jersey before it looks crowded; below the minimum size the rack
  // scrolls sideways instead.
  let jh = Math.round(Math.min(360, Math.max(230, available * 0.26)));
  let step = 0;
  for (; ; jh -= 10) {
    const ideal = spacious ? jh * 0.82 : jh * 0.19;
    const tightest = spacious ? jh * 0.5 : jh * 0.19;
    const fit = (available - legL * 2 - insetFor(jh) * 2) / gaps;
    step = Math.round(Math.max(tightest, Math.min(ideal, fit)));
    if (widthFor(jh, step) <= available || jh <= 230) break;
  }

  const boxW = Math.round(jh * (spacious ? 0.9 : 0.5));
  const span = (count - 1) * step;
  const width = Math.round(Math.max(widthFor(jh, step), spacious ? jh * 1.9 : 0));
  const legR = width - legL;
  const first = (width - span) / 2;
  const collarY = RAIL_Y + Math.round(jh * 0.17);
  const floorY = collarY + jh + Math.round(jh * 0.36);
  return {
    spacious,
    jh,
    boxW,
    step,
    legL,
    legR,
    width,
    collarY,
    floorY,
    height: floorY + 14,
    centers: Array.from({ length: count }, (_, i) => first + i * step),
  };
}

function useAvailableWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/* -------------------------------------------------------------- the rack */

/** Galvanised pipe rack: rail, bent corners with fitting collars, legs, floor flanges, wall shadow. */
function PipeRack({ l }: { l: RackLayout }) {
  const uid = useId().replace(/:/g, "");
  const top = RAIL_Y;
  const legBottom = l.floorY - 6;
  const cyl = (id: string, vertical: boolean) => (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? 1 : 0} y2={vertical ? 0 : 1}>
      <stop offset="0" stopColor="#7d848e" />
      <stop offset="0.18" stopColor="#eef1f4" />
      <stop offset="0.32" stopColor="#c3c8cf" />
      <stop offset="0.62" stopColor="#8a919b" />
      <stop offset="0.86" stopColor="#5b616a" />
      <stop offset="1" stopColor="#888f99" />
    </linearGradient>
  );

  /** Quarter bend between rail and leg, shaded like a curved pipe. */
  const bend = (side: "l" | "r") => {
    const cx = side === "l" ? l.legL + BEND_R : l.legR - BEND_R;
    const cy = top + BEND_R;
    const ro = BEND_R + PIPE_R;
    const ri = BEND_R - PIPE_R;
    const sx = side === "l" ? -1 : 1;
    const d = [
      `M ${cx + sx * ro} ${cy}`,
      `A ${ro} ${ro} 0 0 ${side === "l" ? 1 : 0} ${cx} ${cy - ro}`,
      `L ${cx} ${cy - ri}`,
      `A ${ri} ${ri} 0 0 ${side === "l" ? 0 : 1} ${cx + sx * ri} ${cy}`,
      "Z",
    ].join(" ");
    return <path d={d} fill={`url(#${uid}-bend-${side})`} />;
  };

  const bendGrad = (side: "l" | "r") => {
    const cx = side === "l" ? l.legL + BEND_R : l.legR - BEND_R;
    return (
      <radialGradient
        id={`${uid}-bend-${side}`}
        gradientUnits="userSpaceOnUse"
        cx={cx}
        cy={top + BEND_R}
        r={BEND_R + PIPE_R}
      >
        <stop offset={(BEND_R - PIPE_R) / (BEND_R + PIPE_R)} stopColor="#5b616a" />
        <stop offset="0.62" stopColor="#8a919b" />
        <stop offset="0.8" stopColor="#c3c8cf" />
        <stop offset="0.9" stopColor="#eef1f4" />
        <stop offset="1" stopColor="#7d848e" />
      </radialGradient>
    );
  };

  /** Slightly wider collar where a pipe enters a fitting. */
  const collar = (x: number, y: number, vertical: boolean) =>
    vertical ? (
      <rect x={x - PIPE_R - 1.5} y={y - 4} width={(PIPE_R + 1.5) * 2} height={8} rx={1.5} fill={`url(#${uid}-cv)`} />
    ) : (
      <rect x={x - 4} y={y - PIPE_R - 1.5} width={8} height={(PIPE_R + 1.5) * 2} rx={1.5} fill={`url(#${uid}-ch)`} />
    );

  const frame = (
    <>
      <rect x={l.legL + BEND_R} y={top - PIPE_R} width={l.legR - l.legL - BEND_R * 2} height={PIPE_R * 2} fill={`url(#${uid}-ch)`} />
      {[l.legL, l.legR].map((x) => (
        <rect key={x} x={x - PIPE_R} y={top + BEND_R} width={PIPE_R * 2} height={legBottom - top - BEND_R} fill={`url(#${uid}-cv)`} />
      ))}
      {bend("l")}
      {bend("r")}
      {collar(l.legL + BEND_R + 2, top, false)}
      {collar(l.legR - BEND_R - 2, top, false)}
      {collar(l.legL, top + BEND_R + 2, true)}
      {collar(l.legR, top + BEND_R + 2, true)}
      {[l.legL, l.legR].map((x) => (
        <g key={`f${x}`}>
          {collar(x, legBottom - 6, true)}
          <ellipse cx={x} cy={legBottom + 1} rx={24} ry={5.5} fill={`url(#${uid}-flange)`} />
          <ellipse cx={x} cy={legBottom - 0.5} rx={24} ry={4.5} fill="none" stroke="#e7eaee" strokeOpacity="0.5" />
        </g>
      ))}
    </>
  );

  return (
    <svg
      className="absolute inset-0"
      width={l.width}
      height={l.height}
      viewBox={`0 0 ${l.width} ${l.height}`}
      aria-hidden
      overflow="visible"
    >
      <defs>
        {cyl(`${uid}-ch`, false)}
        {cyl(`${uid}-cv`, true)}
        {bendGrad("l")}
        {bendGrad("r")}
        <linearGradient id={`${uid}-flange`} x1="0" x2="1">
          <stop offset="0" stopColor="#6c737d" />
          <stop offset="0.35" stopColor="#d9dde2" />
          <stop offset="1" stopColor="#5d636c" />
        </linearGradient>
        <filter id={`${uid}-blur`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id={`${uid}-floor`}>
          <stop offset="0" stopColor="#0f1e4a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0f1e4a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft shadow of the rack on the wall behind, lit from the front-left. */}
      <g transform="translate(14 10)" filter={`url(#${uid}-blur)`} opacity="0.16">
        <g fill="#0f1e4a">
          <rect x={l.legL} y={top - PIPE_R} width={l.legR - l.legL} height={PIPE_R * 2} />
          <rect x={l.legL - PIPE_R} y={top} width={PIPE_R * 2} height={legBottom - top - 30} />
          <rect x={l.legR - PIPE_R} y={top} width={PIPE_R * 2} height={legBottom - top - 30} />
        </g>
      </g>
      {/* Contact shadows on the floor. */}
      {[l.legL, l.legR].map((x) => (
        <ellipse key={x} cx={x + 4} cy={legBottom + 4} rx={38} ry={7} fill={`url(#${uid}-floor)`} />
      ))}
      <ellipse cx={l.width / 2} cy={legBottom + 4} rx={(l.legR - l.legL) / 2} ry={12} fill={`url(#${uid}-floor)`} opacity="0.6" />

      {frame}
    </svg>
  );
}

/** Metal hook from the hanger in the collar, up and over the rail. */
function Hook({ l }: { l: RackLayout }) {
  const h = l.collarY - RAIL_Y + PIPE_R + 6;
  return (
    <svg
      viewBox={`0 0 30 ${h}`}
      width={30}
      height={h}
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: RAIL_Y - PIPE_R - 6 }}
      aria-hidden
    >
      {/* Stem rises from the collar, curls over the top of the rail, tip drops behind it. */}
      <path
        d={`M15 ${h} L15 ${PIPE_R + 12} C15 1 25 -1.5 26.5 4 C27 6 26 6.8 23.5 6.2`}
        fill="none"
        stroke="#6f7680"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={`M14.2 ${h - 2} L14.2 ${PIPE_R + 12} C14.2 3 22 0.5 24.6 5.5`}
        fill="none"
        stroke="#e9ecef"
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Hanger neck where the hook meets the hanger, just above the collar. */}
      <rect x="11" y={h - 9} width="8" height="11" rx="2.5" fill="#1b1d22" />
    </svg>
  );
}

/* ----------------------------------------------------------- one jersey */

const LIFT = { type: "spring", stiffness: 260, damping: 30, mass: 1 } as const;
const PART = { type: "spring", stiffness: 200, damping: 30 } as const;
const FADE = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } as const;

function partOffset(index: number, active: number | null, spacious: boolean) {
  if (active === null || index === active) return 0;
  const d = Math.abs(index - active);
  const amount = (spacious ? 8 : 12) * Math.max(0, 1 - (d - 1) / 3);
  return index < active ? -amount : amount;
}

interface RackJerseyProps {
  product: Product;
  index: number;
  layout: RackLayout;
  active: number | null;
  onActive: (index: number | null) => void;
  onOpen: () => void;
}

function RackJersey({ product, index, layout: l, active, onActive, onOpen }: RackJerseyProps) {
  const set = getJerseyFrames(product);
  // Every jersey hangs on its side view; on hover it turns to face the viewer
  // (straight to the front when spaced apart, three-quarters when packed tight).
  const restFrame = set.rack;
  const hoverFrame = l.spacious ? 0 : set.hover;
  const restMirror = set.rackMirror;

  const isActive = active === index;
  const reduced = useReducedMotion() ?? false;
  const rotate = useMotionValue(0);
  const [raised, setRaised] = useState(false);
  const center = l.centers[index];
  const last = index === l.centers.length - 1;

  useEffect(() => {
    if (isActive) {
      setRaised(true);
      if (reduced) return;
      const c = animate(rotate, [rotate.get(), 1.8, -1.1, 0.45, 0], { duration: 1.5, ease: "easeOut" });
      return () => c.stop();
    }
    const c = animate(rotate, 0, { type: "spring", stiffness: 120, damping: 16 });
    return () => c.stop();
  }, [isActive, reduced, rotate]);

  // Pointer target: the part of the jersey that is actually visible (neighbours overlap when packed).
  const hitLeft = l.spacious ? center - l.boxW / 2 : center - l.boxW / 2;
  const hitWidth = l.spacious || last ? l.boxW : l.step;

  return (
    <li className="pointer-events-none" style={{ zIndex: isActive || raised ? 50 : index + 1, position: "relative" }}>
      <motion.div
        className="absolute top-0"
        style={{ left: center - l.boxW / 2, width: l.boxW, height: l.height }}
        animate={{ x: reduced ? 0 : partOffset(index, active, l.spacious) }}
        transition={PART}
      >
        <motion.button
          type="button"
          onClick={onOpen}
          onFocus={() => onActive(index)}
          onBlur={() => isActive && onActive(null)}
          aria-label={`${product.name}, ${formatPrice(product.price)}. Open the 360° view.`}
          className="relative block size-full rounded-lg outline-offset-4"
          style={{ rotate, transformOrigin: `50% ${RAIL_Y}px` }}
          animate={isActive ? { y: 5, scale: 1.035 } : { y: 0, scale: 1 }}
          transition={reduced ? { duration: 0 } : LIFT}
          onAnimationComplete={() => !isActive && setRaised(false)}
        >
          <Hook l={l} />
          <span
            className="absolute inset-x-0 drop-shadow-[10px_12px_14px_rgba(15,30,74,0.22)]"
            style={{ top: l.collarY, height: l.jh }}
          >
            <motion.span className="absolute inset-0" initial={false} animate={{ opacity: isActive ? 0 : 1 }} transition={FADE}>
              <JerseyFrame
                product={product}
                frame={set.frames[restFrame]}
                mirror={restMirror}
                uid={`rack-${product.id}`}
                sizes={`${l.boxW}px`}
                priority
              />
            </motion.span>
            <motion.span className="absolute inset-0" initial={false} animate={{ opacity: isActive ? 1 : 0 }} transition={FADE}>
              <JerseyFrame
                product={product}
                frame={set.frames[hoverFrame]}
                uid={`rack-hover-${product.id}`}
                sizes={`${l.boxW}px`}
              />
            </motion.span>
          </span>
        </motion.button>
      </motion.div>

      <div
        aria-hidden
        onPointerEnter={(e) => e.pointerType === "mouse" && onActive(index)}
        onPointerLeave={(e) => e.pointerType === "mouse" && isActive && onActive(null)}
        onClick={onOpen}
        className="pointer-events-auto absolute cursor-pointer"
        style={{ left: hitLeft, width: hitWidth, top: l.collarY, height: l.jh }}
      />

      <motion.span
        aria-hidden
        initial={false}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut", delay: isActive ? 0.1 : 0 }}
        className="absolute z-10 -translate-x-1/2 rounded-lg bg-white px-3 py-1.5 text-center whitespace-nowrap shadow-[0_6px_20px_-8px_rgba(15,30,74,0.45)]"
        style={{ left: center, top: l.collarY + l.jh + 14 }}
      >
        <span className="block text-sm font-semibold text-navy">{product.team}</span>
        <span className="block text-xs text-slate">{formatPrice(product.price)}</span>
      </motion.span>
    </li>
  );
}

/* --------------------------------------------------------------- section */

export function JerseyRack({ products }: { products: Product[] }) {
  // Only jerseys with real photography hang on the rack; drawn placeholders would look fake.
  const withPhotos = products.filter((p) => p.photos);
  const onRack = withPhotos.length > 0 ? withPhotos : products;

  const [openId, setOpenId] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [wrapRef, available] = useAvailableWidth<HTMLDivElement>();
  const layout = computeLayout(onRack.length, available);
  const open = onRack.find((p) => p.id === openId) ?? null;

  // A link like /?jersey=manchester-united-home-2026 opens that jersey's 360° view.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("jersey");
    const match = slug ? onRack.find((p) => p.slug === slug) : undefined;
    if (match) setOpenId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      aria-labelledby="rack-heading"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_42%,#fafbfc_0%,#eef0f3_55%,#e2e5ea_100%)]"
    >
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <h1 id="rack-heading" className="font-display text-5xl leading-[0.92] font-black text-navy sm:text-7xl">
          Pick yours off the rack
        </h1>
        <p className="mt-3 max-w-md text-base text-slate sm:text-lg">Tap any jersey to see it from every side.</p>
      </div>

      <div ref={wrapRef} className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Scrolls sideways when the rack is wider than the screen. */}
        <div className="mt-6 overflow-x-auto overscroll-x-contain pt-4 pb-12 [scrollbar-width:none]">
          <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
            <PipeRack l={layout} />
            <ul aria-label="Jerseys on the rack" className="absolute inset-0">
              {onRack.map((p, i) => (
                <RackJersey
                  key={p.id}
                  product={p}
                  index={i}
                  layout={layout}
                  active={active}
                  onActive={setActive}
                  onOpen={() => {
                    setActive(null);
                    setOpenId(p.id);
                  }}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      <JerseyViewer product={open} onClose={() => setOpenId(null)} />
    </section>
  );
}
