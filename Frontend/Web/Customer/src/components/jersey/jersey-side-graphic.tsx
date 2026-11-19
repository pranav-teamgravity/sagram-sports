import type { Kit } from "@/lib/catalog";

/** Placeholder: a jersey seen side-on while hanging, front facing left. Used until real photos exist. */
export function JerseySideGraphic({
  kit,
  uid,
  className,
}: {
  kit: Kit;
  uid: string;
  className?: string;
}) {
  const clip = `side-clip-${uid}`;
  const shade = `side-shade-${uid}`;
  const body =
    "M40 10 C31 18 29 38 31 60 L27 204 C40 208 72 208 86 204 L81 60 C83 38 81 18 72 10 C62 14 50 14 40 10 Z";
  const sleeve = "M36 18 L8 66 C14 74 24 78 30 79 L41 52 Z";

  return (
    <svg viewBox="0 0 110 210" className={className} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <path d={body} />
          <path d={sleeve} />
        </clipPath>
        <linearGradient id={shade} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="110" height="210" fill={kit.primary} />
        {kit.pattern === "stripes" &&
          [34, 52, 70].map((x) => <rect key={x} x={x} y="0" width="8" height="210" fill={kit.secondary} />)}
        {kit.pattern === "hoops" &&
          [34, 66, 98, 130, 162, 194].map((y) => (
            <rect key={y} x="0" y={y} width="110" height="14" fill={kit.secondary} />
          ))}
        {kit.pattern === "sash" && <polygon points="30,30 46,30 86,200 70,200" fill={kit.secondary} />}
        {kit.pattern === "halves" && <rect x="58" y="0" width="52" height="210" fill={kit.secondary} />}
        {/* Sleeve cuff */}
        <path d="M8 66 C14 74 24 78 30 79" stroke={kit.secondary} strokeWidth="7" fill="none" />
        {/* Soft folds */}
        <path d="M44 70 C42 120 46 160 42 204" stroke="#000" strokeOpacity="0.08" strokeWidth="3" fill="none" />
        <path d="M66 64 C70 110 64 150 70 204" stroke="#000" strokeOpacity="0.1" strokeWidth="4" fill="none" />
        <rect width="110" height="210" fill={`url(#${shade})`} />
      </g>
      <ellipse cx="56" cy="12" rx="16" ry="3.5" fill="none" stroke={kit.secondary} strokeWidth="4" />
    </svg>
  );
}
