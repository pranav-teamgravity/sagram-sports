import type { Kit } from "@/lib/catalog";

interface JerseyGraphicProps {
  kit: Kit;
  /** Unique per instance on the page, used for SVG clip and gradient ids */
  uid: string;
  view?: "front" | "back";
  printName?: string;
  printNumber?: string;
  className?: string;
  title?: string;
}

const BODY = {
  front: "M62 8 L28 20 L2 56 L26 84 L44 72 L44 204 L156 204 L156 72 L174 84 L198 56 L172 20 L138 8 C128 28 72 28 62 8 Z",
  back: "M62 8 L28 20 L2 56 L26 84 L44 72 L44 204 L156 204 L156 72 L174 84 L198 56 L172 20 L138 8 C124 17 76 17 62 8 Z",
};

const COLLAR = {
  front: "M62 8 C72 28 128 28 138 8",
  back: "M62 8 C76 17 124 17 138 8",
};

function Pattern({ kit }: { kit: Kit }) {
  switch (kit.pattern) {
    case "stripes":
      return (
        <g fill={kit.secondary}>
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={6 + i * 24} y={0} width={12} height={210} />
          ))}
        </g>
      );
    case "hoops":
      return (
        <g fill={kit.secondary}>
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={0} y={34 + i * 32} width={200} height={14} />
          ))}
        </g>
      );
    case "sash":
      return <polygon fill={kit.secondary} points="14,8 50,8 196,210 160,210" />;
    case "halves":
      return <rect fill={kit.secondary} x={100} y={0} width={100} height={210} />;
    default:
      return null;
  }
}

export function JerseyGraphic({
  kit,
  uid,
  view = "front",
  printName,
  printNumber,
  className,
  title,
}: JerseyGraphicProps) {
  const clipId = `jersey-clip-${uid}`;
  const shadeId = `jersey-shade-${uid}`;

  return (
    <svg
      viewBox="0 0 200 210"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={clipId}>
          <path d={BODY[view]} />
        </clipPath>
        <linearGradient id={shadeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.2" stopColor="#000" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect width="200" height="210" fill={kit.primary} />
        <Pattern kit={kit} />
        {/* Sleeve cuffs */}
        <line x1="2" y1="56" x2="26" y2="84" stroke={kit.secondary} strokeWidth="8" />
        <line x1="198" y1="56" x2="174" y2="84" stroke={kit.secondary} strokeWidth="8" />
        <rect width="200" height="210" fill={`url(#${shadeId})`} />
      </g>

      <path d={COLLAR[view]} fill="none" stroke={kit.secondary} strokeWidth="6" />
      <path d={BODY[view]} fill="none" stroke="#0f1e4a" strokeOpacity="0.18" strokeWidth="1.5" />

      {view === "front" && (
        <circle cx="128" cy="62" r="8" fill={kit.secondary} stroke={kit.print} strokeWidth="2" />
      )}

      {view === "back" && (
        <g
          fill={kit.print}
          textAnchor="middle"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          {printName && (
            <text x="100" y="66" fontSize="21" letterSpacing="1.5">
              {printName.toUpperCase()}
            </text>
          )}
          {printNumber && (
            <text x="100" y="168" fontSize="96">
              {printNumber}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
