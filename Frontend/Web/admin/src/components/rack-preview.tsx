"use client";

import { useState } from "react";

const PIPE = "bg-[linear-gradient(to_bottom,#eef1f4_0%,#c3c8cf_30%,#8a919b_62%,#5b616a_86%,#888f99_100%)]";

/**
 * How the jersey will hang on the customer site's rack: side photo at rest, front photo on hover,
 * between two neighbouring placeholder jerseys so spacing and direction are easy to judge.
 */
export function RackPreview({
  sideUrl,
  frontUrl,
  mirror,
}: {
  sideUrl?: string;
  frontUrl?: string;
  mirror: boolean;
}) {
  const [hover, setHover] = useState(false);
  const showFront = hover && frontUrl;

  return (
    <div
      className="relative h-72 overflow-hidden rounded-xl bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,#fafbfc,#e6e9ee)]"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div className={`absolute inset-x-6 top-6 h-2.5 rounded-full ${PIPE}`} />
      {[-1, 0, 1].map((pos) => (
        <div
          key={pos}
          className="absolute top-3 flex h-60 w-36 -translate-x-1/2 flex-col items-center"
          style={{ left: `calc(50% + ${pos * 150}px)` }}
        >
          <svg viewBox="0 0 30 40" className="h-10 w-7 shrink-0" aria-hidden>
            <path d="M15 40 L15 18 C15 4 25 1 26.5 7 C27 9 26 9.8 23.5 9.2" fill="none" stroke="#6f7680" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="11" y="32" width="8" height="9" rx="2" fill="#1b1d22" />
          </svg>
          {pos === 0 ? (
            <div className="relative -mt-1 w-full flex-1 drop-shadow-[8px_10px_12px_rgba(15,30,74,0.22)]">
              {sideUrl || frontUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img
                  src={showFront ? frontUrl : sideUrl ?? frontUrl}
                  alt=""
                  className="absolute inset-0 size-full object-contain object-top transition-transform duration-300"
                  style={{ transform: !showFront && mirror ? "scaleX(-1)" : undefined }}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-line text-center text-sm text-slate">
                  Add a side photo
                </span>
              )}
            </div>
          ) : (
            <div className="-mt-1 h-44 w-16 rounded-b-lg rounded-t-2xl bg-slate/15" aria-hidden />
          )}
        </div>
      ))}
      <p className="absolute right-3 bottom-2 text-xs text-slate">
        {frontUrl ? "Point at the rack to see the hover view" : "Rack preview"}
      </p>
    </div>
  );
}
