#!/usr/bin/env python3
"""Minimal BLE probe for nearby devices and GATT inspection.

Supports:
- BLE scan with name/address/RSSI and advertised service UUIDs
- Optional connect by --address and enumerate GATT tree
- Simple profile heuristics (HID/media vs custom/vendor BLE)
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from typing import Iterable

from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError


BLUETOOTH_BASE_SUFFIX = "-0000-1000-8000-00805f9b34fb"
HID_SERVICE_UUIDS = {
    "1812",  # Human Interface Device
    "00001812-0000-1000-8000-00805f9b34fb",
}
MEDIA_LIKE_SERVICE_UUIDS = {
    "1848",  # Media Control Service
    "1849",  # Generic Media Control Service
    "184a",  # Constant Tone Extension (not media, but often consumer audio-adjacent)
    "00001848-0000-1000-8000-00805f9b34fb",
    "00001849-0000-1000-8000-00805f9b34fb",
    "0000184a-0000-1000-8000-00805f9b34fb",
}


def normalize_uuid(value: str) -> str:
    v = value.strip().lower()
    if len(v) == 4:
        return f"0000{v}{BLUETOOTH_BASE_SUFFIX}"
    return v


def short_uuid(value: str) -> str:
    n = normalize_uuid(value)
    if n.startswith("0000") and n.endswith(BLUETOOTH_BASE_SUFFIX):
        return n[4:8]
    return n


def classify_device(name: str | None, uuids: Iterable[str]) -> str:
    lowered = [normalize_uuid(u) for u in uuids if u]
    lowered_set = set(lowered)
    short_set = {short_uuid(u) for u in lowered_set}
    name_lc = (name or "").lower()

    has_hid = bool(lowered_set & {normalize_uuid(u) for u in HID_SERVICE_UUIDS}) or "1812" in short_set
    has_media_like = bool(lowered_set & {normalize_uuid(u) for u in MEDIA_LIKE_SERVICE_UUIDS}) or bool(
        short_set & {"1848", "1849", "184a"}
    )
    has_vendor_128 = any(
        len(u) == 36 and not u.endswith(BLUETOOTH_BASE_SUFFIX) for u in lowered_set
    )
    looks_switchbot = "switchbot" in name_lc

    if has_hid or has_media_like:
        return "likely HID/media profile"
    if looks_switchbot or has_vendor_128:
        return "likely custom BLE GATT/vendor profile"
    return "unknown profile type"


async def run_scan(scan_timeout: float) -> list[tuple[str, str, int | None, list[str], str]]:
    devices = await BleakScanner.discover(timeout=scan_timeout, return_adv=True)
    rows: list[tuple[str, str, int | None, list[str], str]] = []
    for _, (device, adv) in devices.items():
        name = device.name or adv.local_name or "(unknown)"
        addr = device.address
        rssi = adv.rssi if adv and hasattr(adv, "rssi") else None
        uuids = sorted((adv.service_uuids or [])) if adv else []
        classification = classify_device(name, uuids)
        rows.append((name, addr, rssi, uuids, classification))

    rows.sort(key=lambda row: (row[2] is None, -(row[2] or -999)))
    return rows


def print_scan(rows: list[tuple[str, str, int | None, list[str], str]]) -> None:
    if not rows:
        print("No BLE devices found in scan window.")
        return

    print(f"Found {len(rows)} device(s):")
    for idx, (name, addr, rssi, uuids, classification) in enumerate(rows, start=1):
        print(f"\n[{idx}] {name}")
        print(f"  address: {addr}")
        print(f"  rssi: {rssi if rssi is not None else 'n/a'} dBm")
        if uuids:
            print("  advertised service UUIDs:")
            for u in uuids:
                print(f"    - {normalize_uuid(u)} (short: {short_uuid(u)})")
        else:
            print("  advertised service UUIDs: none")
        print(f"  heuristic: {classification}")


async def enumerate_gatt(address: str, connect_timeout: float) -> None:
    print(f"\nConnecting to {address} (timeout={connect_timeout:.1f}s)...")
    try:
        async with BleakClient(address, timeout=connect_timeout) as client:
            if not client.is_connected:
                print("Connection failed (not connected).")
                return

            print("Connected.")
            services = await asyncio.wait_for(client.get_services(), timeout=connect_timeout)

            if len(services.services) == 0:
                print("No GATT services discovered.")
                return

            print("\nGATT services:")
            for service in services:
                print(f"- {service.uuid} (handle={service.handle})")
                for char in service.characteristics:
                    props = ",".join(char.properties) if char.properties else "none"
                    print(f"  * char {char.uuid} (handle={char.handle}, props={props})")
                    for desc in char.descriptors:
                        print(f"    - desc {desc.uuid} (handle={desc.handle})")
    except asyncio.TimeoutError:
        print(f"Timed out while connecting/discovering services for {address}.")
    except BleakError as exc:
        print(f"Bleak error while connecting/discovering {address}: {exc}")
    except Exception as exc:  # noqa: BLE001
        print(f"Unexpected error while probing {address}: {exc}")


async def main() -> int:
    parser = argparse.ArgumentParser(description="BLE probe to inspect nearby devices and profiles.")
    parser.add_argument(
        "--scan-timeout",
        type=float,
        default=8.0,
        help="Seconds to scan for advertisements (default: 8.0)",
    )
    parser.add_argument(
        "--connect-timeout",
        type=float,
        default=10.0,
        help="Seconds for connect/service discovery timeout (default: 10.0)",
    )
    parser.add_argument(
        "--address",
        type=str,
        default=None,
        help="Optional BLE address/UUID to connect and enumerate GATT.",
    )
    args = parser.parse_args()

    if args.scan_timeout <= 0 or args.connect_timeout <= 0:
        print("Timeout values must be positive.", file=sys.stderr)
        return 2

    try:
        rows = await run_scan(args.scan_timeout)
        print_scan(rows)
    except BleakError as exc:
        print(f"BLE scan failed: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"Unexpected scan error: {exc}", file=sys.stderr)
        return 1

    if args.address:
        await enumerate_gatt(args.address, args.connect_timeout)

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
