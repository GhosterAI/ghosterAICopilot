#!/usr/bin/env python3
"""Inject the sanitized web assets into a clean GhosterAI executable.

The executable stores Brotli-compressed assets in a custom PHF table.  For each
changed asset this script:

* compresses the sanitized file with Brotli quality 11,
* checks that it fits the original slot,
* overwrites the slot and updates the PHF value length,
* zero-fills the unused tail of the slot so old builds (and old keys) cannot be
  recovered from the file.

Always run this against the clean upstream executable, not against a previously
patched one, because the PHF value lengths are updated in place.

Usage:
    python GhosterAI/scripts/inject_assets.py --base path/to/client-rust.exe
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path

import brotli
import pefile

ROOT = Path(__file__).resolve().parents[1]
PHF_OFFSET = 40_688_784
PHF_COUNT = 620
ENTRY_SIZE = 32


def rva_to_offset(pe: pefile.PE, va: int) -> int:
    image_base = pe.OPTIONAL_HEADER.ImageBase
    rva = va - image_base
    for section in pe.sections:
        start = section.VirtualAddress
        end = start + section.Misc_VirtualSize
        if start <= rva < end:
            return rva - start + section.PointerToRawData
    raise SystemExit(f"VA 0x{va:x} is not in a mapped section")


def parse_entries(data: bytes, pe: pefile.PE) -> dict[str, tuple[int, int, int]]:
    entries: dict[str, tuple[int, int, int]] = {}
    for index in range(PHF_COUNT):
        pos = PHF_OFFSET + index * ENTRY_SIZE
        key_ptr, key_len, value_ptr, value_len = struct.unpack("<QQQQ", data[pos:pos + ENTRY_SIZE])
        if key_ptr == 0 or key_len == 0:
            continue
        key_off = rva_to_offset(pe, key_ptr)
        name = data[key_off:key_off + key_len].decode("utf-8")
        name = name.lstrip("/")
        if name in entries:
            raise SystemExit(f"duplicate PHF asset name: {name}")
        entries[name] = (index, rva_to_offset(pe, value_ptr), value_len)
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, help="clean upstream client-rust.exe")
    parser.add_argument("--out", default=str(ROOT / "build" / "GhosterAI-patched.exe"))
    parser.add_argument("--manifest", default=str(ROOT / "build" / "changed_assets.json"))
    args = parser.parse_args()

    base_path = Path(args.base)
    out_path = Path(args.out)
    manifest_path = Path(args.manifest)
    if not base_path.is_file():
        raise SystemExit(f"base executable not found: {base_path}")
    if not manifest_path.is_file():
        raise SystemExit(f"manifest not found: {manifest_path}")

    data = bytearray(base_path.read_bytes())
    pe = pefile.PE(data=bytes(data))
    entries = parse_entries(data, pe)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    print(f"base: {base_path}")
    print(f"size: {len(data):,} bytes")
    for item in manifest:
        rel = item["path"]
        asset_path = ROOT / "src" / "web-dist" / rel
        if rel not in entries:
            raise SystemExit(f"asset missing from PHF: {rel}")
        index, value_off, capacity = entries[rel]
        raw = asset_path.read_bytes()
        compressed = brotli.compress(raw, quality=11)
        if len(compressed) > capacity:
            raise SystemExit(
                f"{rel}: compressed {len(compressed)} > capacity {capacity}"
            )
        data[value_off:value_off + len(compressed)] = compressed
        data[value_off + len(compressed):value_off + capacity] = b"\x00" * (capacity - len(compressed))
        struct.pack_into("<Q", data, PHF_OFFSET + index * ENTRY_SIZE + 24, len(compressed))
        print(
            f"{rel:48} {len(compressed):8,} / {capacity:8,} "
            f"(margin {capacity - len(compressed):8,})"
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(data)
    digest = hashlib.sha256(data).hexdigest()
    print(f"wrote: {out_path}")
    print(f"sha256: {digest}")

    # Verify every injected asset can be read back and decompressed.
    check = bytearray(out_path.read_bytes())
    check_pe = pefile.PE(data=bytes(check))
    check_entries = parse_entries(check, check_pe)
    for item in manifest:
        rel = item["path"]
        _, value_off, capacity = check_entries[rel]
        length = struct.unpack_from("<Q", check, PHF_OFFSET + check_entries[rel][0] * ENTRY_SIZE + 24)[0]
        blob = bytes(check[value_off:value_off + length])
        if brotli.decompress(blob) != (ROOT / "src" / "web-dist" / rel).read_bytes():
            raise SystemExit(f"verification failed: {rel}")
        if any(check[value_off + length:value_off + capacity]):
            raise SystemExit(f"slot tail was not zeroed: {rel}")
    print("verified: all injected assets decompress and slot tails are zeroed")


if __name__ == "__main__":
    main()
