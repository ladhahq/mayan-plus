#!/usr/bin/env python3
"""
Parse LayaAir .lm binary mesh files (LAYAMODEL:03 format) and extract
per-submesh UV coordinate bounds.

Usage:
  tools/analyze-mesh.py LayaScene_JumpDown/Assets/model/SceneStatic-SceneObject01.lm
  tools/analyze-mesh.py LayaScene_JumpDown/Assets/model/        # all .lm in dir

Output:
  - Submesh name, vertex/index counts, vertex format, UV range
  - Texture pixel region (for a given texture size, default 1024×1024)
  - Mesh type guess (cylinder, platform, etc.) based on UV pattern
"""

import struct
import sys
import os
from pathlib import Path

TEXTURE_W = 1024
TEXTURE_H = 1024

# ── Binary parsing ────────────────────────────────────────────

def read_lstr(data: bytes, off: int) -> tuple[str, int]:
    """Read a length-prefixed string: uint16 length, then ASCII chars."""
    length = struct.unpack_from("<H", data, off)[0]
    s = data[off + 2 : off + 2 + length].decode("ascii", errors="ignore")
    return s, off + 2 + length


def vertex_stride(fmt: str) -> int:
    """Calculate vertex stride from a LayaAir vertex format string.
    Example: 'POSITION,NORMAL,UV,TANGENT' → 48 bytes."""
    stride = 0
    for part in fmt.split(","):
        p = part.strip()
        if p.startswith("POSITION"):     stride += 12   # 3 × float32
        elif p.startswith("NORMAL"):      stride += 12
        elif p.startswith("UV"):          stride += 8    # 2 × float32
        elif p.startswith("TANGENT"):     stride += 16   # 4 × float32
        elif p.startswith("COLOR"):       stride += 4
        elif p.startswith("BLENDWEIGHT"): stride += 16   # 4 × float32
        elif p.startswith("BLENDINDICES"):stride += 4
    return stride


def uv_offset_in_vertex(fmt: str) -> int:
    """Byte offset of UV data within a single vertex."""
    off = 0
    for part in fmt.split(","):
        p = part.strip()
        if p.startswith("POSITION"):     off += 12
        elif p.startswith("NORMAL"):      off += 12
        elif p.startswith("UV"):          return off
        elif p.startswith("TANGENT"):     off += 16
        elif p.startswith("COLOR"):       off += 4
        elif p.startswith("BLENDWEIGHT"): off += 16
        elif p.startswith("BLENDINDICES"):off += 4
    return off


def guess_vertex_count(data: bytes, off: int, stride: int) -> int:
    """Auto-detect vertex count by finding where valid index data begins.
    Index data is uint16 values in range [0, vertex_count)."""
    remaining = len(data) - off
    max_try = min(500, remaining // stride)
    best_vtx, best_bad = 0, 999999

    for try_vtx in range(4, max_try + 1):
        idx_start = off + try_vtx * stride
        idx_rem = len(data) - idx_start
        if idx_rem < 6:
            continue
        bad = 0
        sample = min(50, idx_rem // 2)
        for j in range(sample):
            val = struct.unpack_from("<H", data, idx_start + j * 2)[0]
            if val >= try_vtx:
                bad += 1
        if bad < best_bad:
            best_bad = bad
            best_vtx = try_vtx

    return best_vtx


def classify_mesh(name: str, u_min: float, u_max: float, v_min: float, v_max: float) -> str:
    """Heuristic: guess what kind of game object this mesh represents."""
    u_span = u_max - u_min
    v_span = v_max - v_min
    if u_min > 0.6 and u_span > 0.3 and v_span > 0.9:
        return "CYLINDER BODY"
    if u_min < 0.2 and u_span > 0.5 and v_span > 0.7:
        return "TRAP BLOCK"
    if u_min < 0.2 and v_min < 0.1 and v_max > 0.5:
        return "NORMAL PLATFORM"
    if v_min > 0.5 and u_max < 0.6:
        return "WALL OBSTACLE"
    return "unknown"


# ── Main analysis ─────────────────────────────────────────────

def analyze_lm(path: str) -> dict | None:
    with open(path, "rb") as f:
        data = f.read()

    mesh_off = data.find(b"MESH")
    if mesh_off < 0:
        return None

    off = mesh_off - 2  # back up to length prefix
    mesh_name, off = read_lstr(data, off)
    sub_name, off = read_lstr(data, off)
    obj_name, off = read_lstr(data, off)
    fmt_str, off = read_lstr(data, off)

    stride = vertex_stride(fmt_str)
    uv_off = uv_offset_in_vertex(fmt_str)
    vtx_count = guess_vertex_count(data, off, stride)

    vtx_end = off + vtx_count * stride
    idx_count = (len(data) - vtx_end) // 2

    # Collect UV bounds (fractional, to de-tile repeating UVs)
    u_min, u_max = float("inf"), float("-inf")
    v_min, v_max = float("inf"), float("-inf")

    for i in range(vtx_count):
        vo = off + i * stride + uv_off
        u = struct.unpack_from("<f", data, vo)[0]
        v = struct.unpack_from("<f", data, vo + 4)[0]
        # De-tile: fractional part in [0, 1)
        uf = u % 1.0
        vf = v % 1.0
        if uf < 0:
            uf += 1.0
        if vf < 0:
            vf += 1.0
        u_min, u_max = min(u_min, uf), max(u_max, uf)
        v_min, v_max = min(v_min, vf), max(v_max, vf)

    mesh_type = classify_mesh(obj_name, u_min, u_max, v_min, v_max)

    return {
        "file": os.path.basename(path),
        "mesh": mesh_name,
        "submesh": sub_name,
        "object": obj_name,
        "format": fmt_str,
        "stride": stride,
        "vertices": vtx_count,
        "indices": idx_count,
        "uv": {
            "u_min": u_min, "u_max": u_max,
            "v_min": v_min, "v_max": v_max,
            "pixel_x0": max(0, int(u_min * TEXTURE_W)),
            "pixel_x1": min(TEXTURE_W - 1, int(u_max * TEXTURE_W)),
            "pixel_y0": max(0, int(v_min * TEXTURE_H)),
            "pixel_y1": min(TEXTURE_H - 1, int(v_max * TEXTURE_H)),
        },
        "type": mesh_type,
    }


def format_output(info: dict) -> str:
    uv = info["uv"]
    w = uv["pixel_x1"] - uv["pixel_x0"] + 1
    h = uv["pixel_y1"] - uv["pixel_y0"] + 1
    return (
        f"{info['file']}\n"
        f"  Object:   {info['object']}\n"
        f"  Format:   {info['format']}  (stride {info['stride']}B)\n"
        f"  Mesh:     {info['vertices']} vertices, {info['indices']} indices\n"
        f"  UV range: U[{uv['u_min']:.4f}–{uv['u_max']:.4f}]  "
        f"V[{uv['v_min']:.4f}–{uv['v_max']:.4f}]\n"
        f"  Pixels:   X[{uv['pixel_x0']}–{uv['pixel_x1']}]  "
        f"Y[{uv['pixel_y0']}–{uv['pixel_y1']}]  "
        f"({w}×{h}px)\n"
        f"  Type:     {info['type']}"
    )


def format_json(info: dict) -> str:
    import json
    return json.dumps(info, indent=2)


# ── CLI ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Analyze LayaAir .lm mesh files — extract UV-to-texture mapping"
    )
    parser.add_argument(
        "path", help="Path to a .lm file or directory containing .lm files"
    )
    parser.add_argument(
        "--json", action="store_true", help="Output as JSON"
    )
    parser.add_argument(
        "--texture-size", default="1024x1024",
        help="Reference texture dimensions (default: 1024x1024)"
    )
    args = parser.parse_args()

    # Parse texture size
    tw, th = map(int, args.texture_size.split("x"))
    TEXTURE_W, TEXTURE_H = tw, th

    p = Path(args.path)
    if p.is_dir():
        files = sorted(p.glob("*.lm"))
    elif p.is_file():
        files = [p]
    else:
        print(f"Error: '{args.path}' is not a file or directory", file=sys.stderr)
        sys.exit(1)

    if not files:
        print(f"No .lm files found in '{args.path}'", file=sys.stderr)
        sys.exit(1)

    results = []
    for fp in files:
        info = analyze_lm(str(fp))
        if info:
            results.append(info)
            if args.json:
                pass  # collected below
            else:
                print(format_output(info))
                print()

    if args.json:
        print(format_json(results))
