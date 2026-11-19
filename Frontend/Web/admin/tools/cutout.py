"""Turn one uploaded jersey photo into a rack-ready cut-out.

Usage: python -I cutout.py [--remove-bg] <input> <output.webp> [<input> <output.webp> ...]

With --remove-bg the background is removed with rembg (isnet-general-use); the largest shape is
kept, holes enclosed by the jersey are filled back in with their original colours, and the
result is trimmed. Always writes a transparent WebP, 640 px on its longer side.
Exits non-zero with a message on stderr if anything fails.
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageOps

MAX_SIDE = 640


def keep_largest(alpha: np.ndarray) -> np.ndarray:
    h, w = alpha.shape
    solid = alpha > 24
    label = np.zeros((h, w), dtype=np.int32)
    best, best_size, current = 0, 0, 0
    for y in range(h):
        for x in range(w):
            if not solid[y, x] or label[y, x]:
                continue
            current += 1
            size = 0
            q = deque([(y, x)])
            label[y, x] = current
            while q:
                cy, cx = q.popleft()
                size += 1
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not label[ny, nx]:
                        label[ny, nx] = current
                        q.append((ny, nx))
            if size > best_size:
                best, best_size = current, size
    keep = label == best
    for _ in range(2):  # keep the soft edge around the shape
        g = keep.copy()
        g[1:, :] |= keep[:-1, :]
        g[:-1, :] |= keep[1:, :]
        g[:, 1:] |= keep[:, :-1]
        g[:, :-1] |= keep[:, 1:]
        keep = g
    return np.where(keep, alpha, 0).astype(np.uint8)


def process(img: Image.Image, remove_bg: bool, session) -> Image.Image:
    if remove_bg:
        from rembg import remove
        from scipy.ndimage import binary_fill_holes

        rgb = img.convert("RGB")
        cut = remove(rgb, session=session, post_process_mask=True).convert("RGBA")
        rgba = np.array(cut)
        rgba[..., :3] = np.array(rgb)  # rembg blanks removed pixels; keep original colours
        rgba[..., 3] = keep_largest(rgba[..., 3])
        holes = binary_fill_holes(rgba[..., 3] > 24) & (rgba[..., 3] <= 24)
        rgba[..., 3][holes] = 255
        img = Image.fromarray(rgba, "RGBA")
    box = img.getbbox()
    if box is None:
        raise ValueError("The photo came out empty after removing the background.")
    img = img.crop(box)
    scale = MAX_SIDE / max(img.width, img.height)
    return img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)


def main() -> int:
    args = sys.argv[1:]
    remove_bg = "--remove-bg" in args
    paths = [a for a in args if a != "--remove-bg"]
    if not paths or len(paths) % 2:
        print("usage: cutout.py [--remove-bg] <input> <output.webp> [...]", file=sys.stderr)
        return 2

    # Guard against decompression bombs from untrusted uploads.
    Image.MAX_IMAGE_PIXELS = 40_000_000
    session = None
    if remove_bg:
        from rembg import new_session

        session = new_session("isnet-general-use")  # load the model once for all photos

    for src_path, out_path in zip(paths[0::2], paths[1::2]):
        try:
            img = ImageOps.exif_transpose(Image.open(src_path)).convert("RGBA")
            img.thumbnail((1600, 1600), Image.LANCZOS)  # output is 640 px; no need to work bigger
            process(img, remove_bg, session).save(out_path, "WEBP", quality=90, alpha_quality=100)
        except Exception as exc:  # report which photo failed, in plain words
            print(f"{src_path}: {exc}", file=sys.stderr)
            return 3
    return 0


if __name__ == "__main__":
    sys.exit(main())
