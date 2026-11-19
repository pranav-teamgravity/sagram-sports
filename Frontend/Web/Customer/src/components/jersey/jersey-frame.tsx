import Image from "next/image";
import { cn } from "cn";
import type { Product } from "@/lib/catalog";
import { JerseyGraphic } from "./jersey-graphic";
import { JerseySideGraphic } from "./jersey-side-graphic";

export type JerseyFrameData =
  | { type: "photo"; src: string; angle: string }
  | { type: "drawn"; face: "front" | "back" | "side"; scaleX: number; flip: boolean; angle: string };

export interface JerseyFrameSet {
  frames: JerseyFrameData[];
  rack: number;
  /** Mirror the rack frame so it faces left like the others */
  rackMirror: boolean;
  hover: number;
  thumbs: number[];
}

const ANGLES_8 = ["Front", "Front right", "Right side", "Back right", "Back", "Back left", "Left side", "Front left"];

/** Placeholder frames for jerseys without photos: 8 angles, 45° apart. */
const DRAWN: JerseyFrameData[] = [
  { type: "drawn", face: "front", scaleX: 1, flip: false, angle: ANGLES_8[0] },
  { type: "drawn", face: "front", scaleX: 0.74, flip: false, angle: ANGLES_8[1] },
  { type: "drawn", face: "side", scaleX: 1, flip: false, angle: ANGLES_8[2] },
  { type: "drawn", face: "back", scaleX: 0.74, flip: false, angle: ANGLES_8[3] },
  { type: "drawn", face: "back", scaleX: 1, flip: false, angle: ANGLES_8[4] },
  { type: "drawn", face: "back", scaleX: 0.74, flip: false, angle: ANGLES_8[5] },
  { type: "drawn", face: "side", scaleX: 1, flip: true, angle: ANGLES_8[6] },
  { type: "drawn", face: "front", scaleX: 0.74, flip: true, angle: ANGLES_8[7] },
];

export function getJerseyFrames(product: Product): JerseyFrameSet {
  const p = product.photos;
  if (p && p.frames.length > 0) {
    return {
      frames: p.frames.map((src, i) => ({
        type: "photo",
        src,
        angle: p.frames.length === 8 ? ANGLES_8[i] : `View ${i + 1}`,
      })),
      rack: p.rack,
      rackMirror: p.rackMirror ?? false,
      hover: p.hover,
      thumbs: p.thumbs,
    };
  }
  return { frames: DRAWN, rack: 2, rackMirror: false, hover: 1, thumbs: [0, 1, 2, 4] };
}

interface JerseyFrameProps {
  product: Product;
  frame: JerseyFrameData;
  /** Unique per rendered instance (SVG ids) */
  uid: string;
  /** next/image sizes hint */
  sizes: string;
  priority?: boolean;
  /** Flip horizontally */
  mirror?: boolean;
  className?: string;
}

/** One angle of a jersey, filling its (relatively positioned) parent. */
export function JerseyFrame({ product, frame, uid, sizes, priority, mirror, className }: JerseyFrameProps) {
  if (frame.type === "photo") {
    return (
      <Image
        src={frame.src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        // Jersey photos are already sized, compressed WebP cut-outs; serve them as they are.
        unoptimized
        draggable={false}
        className={cn("object-contain object-top", mirror && "-scale-x-100", className)}
      />
    );
  }

  const flipped = frame.flip !== Boolean(mirror);
  const transform = `scaleX(${flipped ? -frame.scaleX : frame.scaleX})`;
  return (
    <div className={cn("absolute inset-0 flex justify-center", className)} style={{ transform }}>
      {frame.face === "side" ? (
        <JerseySideGraphic kit={product.kit} uid={uid} className="h-full w-auto" />
      ) : (
        <JerseyGraphic
          kit={product.kit}
          uid={uid}
          view={frame.face}
          printName={frame.face === "back" ? "Sagram" : undefined}
          printNumber={frame.face === "back" ? "10" : undefined}
          className="h-full w-auto"
        />
      )}
    </div>
  );
}
