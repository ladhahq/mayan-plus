#!/usr/bin/env python3
"""
Extract a UV-mapped region from a texture atlas.

Usage:
  # Extract cylinder body region from Scene_Mid.png
  tools/extract-texture.py LayaScene_JumpDown/Assets/Texture/Scene_Mid.png \\
      --x0 654 --x1 1015 --y0 0 --y1 1023

  # With edge bleed for seamless GPU wrapping
  tools/extract-texture.py Scene_Mid.png --x0 654 --x1 1015 --y0 0 --y1 1023 \\
      --bleed 4 --output Scene_Mid-cyl.png

  # Extract all regions discovered by analyze-mesh.py
  tools/extract-texture.py Scene_Mid.png --auto --output-dir out/
"""

import sys
import os
from PIL import Image


def extract_region(
    src: Image.Image,
    x0: int, y0: int,
    x1: int, y1: int,
    bleed: int = 0,
    background: tuple[int, int, int, int] = (0, 0, 0, 0),
) -> Image.Image:
    """Create a new RGBA image with only the specified region copied from src.
    The output is the same size as src. Pixels outside the region are transparent.
    If bleed > 0, edge pixels are repeated outward to prevent GPU sampling artifacts."""
    w, h = src.size
    out = Image.new("RGBA", (w, h), background)

    # Clamp to image bounds
    x0c = max(0, x0)
    y0c = max(0, y0)
    x1c = min(w - 1, x1)
    y1c = min(h - 1, y1)

    # Copy the target region
    region = src.crop((x0c, y0c, x1c + 1, y1c + 1))
    out.paste(region, (x0c, y0c))

    # Bleed: extend edge pixels outward
    if bleed > 0:
        # Top edge → copy upward
        top = out.crop((x0c, y0c, x1c + 1, y0c + 1))
        for dy in range(1, bleed + 1):
            if y0c - dy >= 0:
                out.paste(top, (x0c, y0c - dy))

        # Bottom edge → copy downward
        bottom = out.crop((x0c, y1c, x1c + 1, y1c + 1))
        for dy in range(1, bleed + 1):
            if y1c + dy < h:
                out.paste(bottom, (x0c, y1c + dy))

        # Left edge → copy leftward
        left = out.crop((x0c, y0c, x0c + 1, y1c + 1))
        for dx in range(1, bleed + 1):
            if x0c - dx >= 0:
                out.paste(left, (x0c - dx, y0c))

        # Right edge → copy rightward
        right = out.crop((x1c, y0c, x1c + 1, y1c + 1))
        for dx in range(1, bleed + 1):
            if x1c + dx < w:
                out.paste(right, (x1c + dx, y0c))

    return out


# ── Auto mode: known Mayan Jump regions ─────────────────────

MAYAN_JUMP_REGIONS = {
    "cylinder-body":  {"x0": 654, "y0": 0, "x1": 1015, "y1": 1023, "bleed": 4},
    "normal-platform": {"x0": 173, "y0": 8, "x1": 612, "y1": 575, "bleed": 2},
    "trap-block":     {"x0": 21,  "y0": 8, "x1": 622, "y1": 763, "bleed": 2},
    "wall-obstacle":  {"x0": 10,  "y0": 631,"x1": 622, "y1": 1015,"bleed": 2},
}


# ── CLI ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract a UV-mapped region from a texture atlas"
    )
    parser.add_argument("texture", help="Path to the source texture PNG")
    parser.add_argument("--x0", type=int, help="Left pixel of region")
    parser.add_argument("--y0", type=int, help="Top pixel of region")
    parser.add_argument("--x1", type=int, help="Right pixel of region")
    parser.add_argument("--y1", type=int, help="Bottom pixel of region")
    parser.add_argument("--bleed", type=int, default=0,
                        help="Edge bleed in pixels (default: 0)")
    parser.add_argument("--output", "-o", help="Output path (default: derived from input)")
    parser.add_argument("--auto", action="store_true",
                        help="Extract all known Mayan Jump regions")
    parser.add_argument("--output-dir", default=".",
                        help="Output directory for --auto mode")

    args = parser.parse_args()

    if not os.path.exists(args.texture):
        print(f"Error: '{args.texture}' not found", file=sys.stderr)
        sys.exit(1)

    src = Image.open(args.texture).convert("RGBA")

    if args.auto:
        base = os.path.splitext(os.path.basename(args.texture))[0]
        for name, r in MAYAN_JUMP_REGIONS.items():
            out = extract_region(
                src, r["x0"], r["y0"], r["x1"], r["y1"], r.get("bleed", 0)
            )
            out_path = os.path.join(args.output_dir, f"{base}-{name}.png")
            out.save(out_path, "PNG")
            print(f"  {name}: {out_path}")
        print("Done.")
    else:
        if any(v is None for v in [args.x0, args.y0, args.x1, args.y1]):
            parser.error("--x0 --y0 --x1 --y1 are required (or use --auto)")

        out = extract_region(src, args.x0, args.y0, args.x1, args.y1, args.bleed)

        if not args.output:
            base = os.path.splitext(args.texture)[0]
            args.output = f"{base}-extract.png"

        out.save(args.output, "PNG")
        w = args.x1 - args.x0 + 1 + 2 * args.bleed
        h = args.y1 - args.y0 + 1 + 2 * args.bleed
        print(f"Extracted {w}×{h}px region → {args.output}")
