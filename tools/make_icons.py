#!/usr/bin/env python3.11
"""生成 PWA 图标（纯标准库，无 Pillow）。

画出与 public/icon.svg 一致的圆角渐变方块 + 白色 H，输出 icon-192.png / icon-512.png /
apple-icon.png(180)。手机「添加到主屏幕」时用得到。
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

PUB = Path(__file__).resolve().parent.parent / "public"
C1 = (0x7C, 0x5C, 0xFF)
C2 = (0x4B, 0x2F, 0xD6)


def lerp(a: int, b: int, t: float) -> int:
    return int(round(a + (b - a) * t))


def rounded_alpha(x: float, y: float, size: float, radius: float) -> float:
    """圆角矩形内部=1，外部=0，4x4 超采样算边缘覆盖率。"""
    hit = 0
    for i in range(4):
        for j in range(4):
            px = x + (i + 0.5) / 4
            py = y + (j + 0.5) / 4
            cx = min(max(px, radius), size - radius)
            cy = min(max(py, radius), size - radius)
            if (px - cx) ** 2 + (py - cy) ** 2 <= radius**2:
                hit += 1
    return hit / 16


def letter_h(x: float, y: float, size: float) -> bool:
    """白色 H：两条竖杠 + 中间横杠，按 64 的坐标系缩放。"""
    u = size / 64
    left, right = 20 * u, 25.4 * u
    rleft, rright = 38.6 * u, 44 * u
    top, bot = 20 * u, 44 * u
    bar1, bar2 = 29.6 * u, 34.4 * u
    if top <= y <= bot:
        if left <= x <= right or rleft <= x <= rright:
            return True
        if bar1 <= y <= bar2 and left <= x <= rright:
            return True
    return False


def make(size: int, path: Path) -> None:
    radius = size * 0.25
    rows = []
    for y in range(size):
        row = bytearray([0])  # filter type 0
        for x in range(size):
            a = rounded_alpha(x, y, size, radius)
            t = (x + y) / (2 * size)
            r, g, b = lerp(C1[0], C2[0], t), lerp(C1[1], C2[1], t), lerp(C1[2], C2[2], t)
            if letter_h(x + 0.5, y + 0.5, size):
                r = g = b = 255
            row += bytes((r, g, b, int(a * 255)))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)
    print(f"[ok] {path.name} {size}x{size} {len(png)/1024:.1f}KB")


if __name__ == "__main__":
    make(192, PUB / "icon-192.png")
    make(512, PUB / "icon-512.png")
    make(180, PUB / "apple-icon.png")