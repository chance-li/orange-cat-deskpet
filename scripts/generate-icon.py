#!/usr/bin/env python3
"""Generate an original 橘猫 tray/app icon (no third-party assets)."""

from __future__ import annotations

import math
import os
import struct
import zlib


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: str, width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> None:
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw.extend((r, g, b, a))
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(png)


def clamp(v: float) -> int:
    return max(0, min(255, int(v)))


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        clamp(a[0] + (b[0] - a[0]) * t),
        clamp(a[1] + (b[1] - a[1]) * t),
        clamp(a[2] + (b[2] - a[2]) * t),
    )


def dist(x: float, y: float, cx: float, cy: float) -> float:
    return math.hypot(x - cx, y - cy)


def inside_ellipse(x: float, y: float, cx: float, cy: float, rx: float, ry: float) -> bool:
    if rx <= 0 or ry <= 0:
        return False
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


def inside_triangle(x: float, y: float, p1: tuple[float, float], p2: tuple[float, float], p3: tuple[float, float]) -> bool:
    def sign(a, b, c):
        return (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1])

    p = (x, y)
    d1 = sign(p, p1, p2)
    d2 = sign(p, p2, p3)
    d3 = sign(p, p3, p1)
    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (has_neg and has_pos)


def render(size: int) -> list[tuple[int, int, int, int]]:
    pixels: list[tuple[int, int, int, int]] = []
    s = float(size)
    cx, cy = s * 0.50, s * 0.54
    head_r = s * 0.32
    fur = (240, 154, 62)
    fur_dark = (196, 96, 28)
    stripe = (168, 78, 20)
    cream = (255, 244, 224)
    pink = (244, 168, 164)
    nose = (232, 120, 140)
    eye = (48, 28, 18)
    white = (255, 255, 255)

    for y in range(size):
        for x in range(size):
            fx, fy = x + 0.5, y + 0.5
            r, g, b, a = 0, 0, 0, 0

            # soft ground shadow
            if inside_ellipse(fx, fy, cx, s * 0.90, s * 0.28, s * 0.08):
                r, g, b, a = 40, 24, 12, 50

            # ears
            left_ear = ((cx - s * 0.22, cy - s * 0.12), (cx - s * 0.34, cy - s * 0.42), (cx - s * 0.02, cy - s * 0.22))
            right_ear = ((cx + s * 0.22, cy - s * 0.12), (cx + s * 0.34, cy - s * 0.42), (cx + s * 0.02, cy - s * 0.22))
            left_inner = ((cx - s * 0.20, cy - s * 0.12), (cx - s * 0.30, cy - s * 0.36), (cx - s * 0.06, cy - s * 0.20))
            right_inner = ((cx + s * 0.20, cy - s * 0.12), (cx + s * 0.30, cy - s * 0.36), (cx + s * 0.06, cy - s * 0.20))

            if inside_triangle(fx, fy, *left_ear) or inside_triangle(fx, fy, *right_ear):
                r, g, b, a = *fur_dark, 255
            if inside_triangle(fx, fy, *left_inner) or inside_triangle(fx, fy, *right_inner):
                r, g, b, a = *pink, 255

            # head
            d = dist(fx, fy, cx, cy)
            if d <= head_r:
                t = d / head_r
                col = mix(fur, fur_dark, t * 0.55)
                r, g, b, a = *col, 255

                # cream muzzle
                if inside_ellipse(fx, fy, cx, cy + s * 0.10, s * 0.16, s * 0.12):
                    r, g, b, a = *cream, 255

                # forehead M stripes
                for sx, sy, rx, ry in (
                    (cx, cy - s * 0.16, s * 0.035, s * 0.11),
                    (cx - s * 0.08, cy - s * 0.14, s * 0.03, s * 0.10),
                    (cx + s * 0.08, cy - s * 0.14, s * 0.03, s * 0.10),
                ):
                    if inside_ellipse(fx, fy, sx, sy, rx, ry):
                        r, g, b, a = *stripe, 255

                # cheeks
                if inside_ellipse(fx, fy, cx - s * 0.18, cy + s * 0.02, s * 0.05, s * 0.035) or inside_ellipse(
                    fx, fy, cx + s * 0.18, cy + s * 0.02, s * 0.05, s * 0.035
                ):
                    r, g, b = mix((r, g, b), pink, 0.45)

                # eyes
                if inside_ellipse(fx, fy, cx - s * 0.11, cy - s * 0.02, s * 0.07, s * 0.08) or inside_ellipse(
                    fx, fy, cx + s * 0.11, cy - s * 0.02, s * 0.07, s * 0.08
                ):
                    r, g, b, a = *white, 255
                if inside_ellipse(fx, fy, cx - s * 0.11, cy - s * 0.01, s * 0.04, s * 0.055) or inside_ellipse(
                    fx, fy, cx + s * 0.11, cy - s * 0.01, s * 0.04, s * 0.055
                ):
                    r, g, b, a = *eye, 255
                if inside_ellipse(fx, fy, cx - s * 0.13, cy - s * 0.04, s * 0.016, s * 0.018) or inside_ellipse(
                    fx, fy, cx + s * 0.09, cy - s * 0.04, s * 0.016, s * 0.018
                ):
                    r, g, b, a = *white, 255

                # nose
                if inside_triangle(
                    fx,
                    fy,
                    (cx, cy + s * 0.10),
                    (cx - s * 0.035, cy + s * 0.06),
                    (cx + s * 0.035, cy + s * 0.06),
                ) or inside_ellipse(fx, fy, cx, cy + s * 0.085, s * 0.03, s * 0.02):
                    r, g, b, a = *nose, 255

            pixels.append((r, g, b, a))
    return pixels


def main() -> None:
    root = os.path.join(os.path.dirname(__file__), "..", "resources")
    root = os.path.abspath(root)
    big = render(256)
    write_png(os.path.join(root, "icon.png"), 256, 256, big)
    small = render(32)
    write_png(os.path.join(root, "tray.png"), 32, 32, small)
    print("wrote", root)


if __name__ == "__main__":
    main()
