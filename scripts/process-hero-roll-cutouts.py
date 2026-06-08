#!/usr/bin/env python3
"""Remove white studio background from hero roll PNGs and export 1024 webp cutouts."""

from __future__ import annotations

import argparse
import io
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    "/Users/anastasiia.krasnova/.cursor/projects/"
    "Users-anastasiia-krasnova-Desktop-watta-sushi-main/assets"
)
OUT_DIR = ROOT / "web" / "public" / "watta-hero-rolls"
CANVAS = 1024
FILL_RATIO = 0.9

TOP_ROW_SOURCES = [
    "ChatGPT_Image_23_____2026__.__15_00_48-1dbbde7a-0c87-4a6d-b681-68a72e9e8121.png",
    "ChatGPT_Image_21_____2026__.__01_08_01-a60b8620-9d6e-48dd-b1ce-48e0cdeeed5a.png",
    "ChatGPT_Image_21_____2026__.__00_25_43-88bb8cde-b165-4351-8901-8a92ee486280.png",
    "ChatGPT_Image_23_____2026__.__15_09_11-fbb74e3d-9958-4a4f-8e62-1863a24d30ad.png",
    "ChatGPT_Image_23_____2026__.__15_13_28-e66e771b-50e2-4fdb-ba8e-c68f6fbb7f35.png",
    "ChatGPT_Image_23_____2026__.__15_12_07-349faa39-0a0e-4c53-92bd-6d54a5534454.png",
    "ChatGPT_Image_23_____2026__.__15_19_20-45c40759-36e0-4cd8-9188-3895bfa60097.png",
    "ChatGPT_Image_23_____2026__.__15_20_35-7a01abd5-a631-4f2f-80bc-d7c4b24c58c3.png",
    "ChatGPT_Image_23_____2026__.__15_26_13-ff91b4b6-d87e-4815-9aa8-58be0e4d465b.png",
    "ChatGPT_Image_23_____2026__.__15_39_37-5d1ff54f-fe36-47a6-80b8-ba33085d736e.png",
    "ChatGPT_Image_23_____2026__.__15_24_33-0174f661-998d-4ef6-8769-4778d55cddf1.png",
    "ChatGPT_Image_23_____2026__.__16_03_26-f3c00dfc-b873-433f-abec-9f034fe52b9b.png",
]

TOP_ROW_EXTRA_SOURCES = [
    "ChatGPT_Image_23_____2026__.__14_54_16-fcbe4854-9840-4e65-be03-c6808accd243.png",
    "ChatGPT_Image_23_____2026__.__14_51_51-30d91816-9ae0-42bd-89b9-921559f6a7e2.png",
    "ChatGPT_Image_23_____2026__.__14_55_59-e17bf57d-6ddc-4fdf-8b3f-a1fb6920bd79.png",
    "ChatGPT_Image_23_____2026__.__14_50_17-d58e9c30-8cb5-46d1-96af-07e90d6eb6fc.png",
]

BOTTOM_ROW_SOURCES = [
    "1-56004dd3-6818-4fb6-ae42-1ab10165586a.png",
    "ChatGPT_Image_20_____2026__.__04_23_37-5b0087a0-1455-408c-92e9-6a3dcf175490.png",
    "ChatGPT_Image_20_____2026__.__14_40_07-4fcd2623-8320-459e-9380-b0398ebc870e.png",
    "ChatGPT_Image_20_____2026__.__04_38_20-64856674-315f-421f-84e1-3fa777375315.png",
    "ChatGPT_Image_20_____2026__.__15_00_26-3ca8e76e-9616-400e-8b57-703effb69522.png",
    "ChatGPT_Image_20_____2026__.__15_30_13-b2f9a630-4b07-4963-8b72-67aada0ccce3.png",
    "ChatGPT_Image_20_____2026__.__21_20_44-922ff535-1a5a-4757-aa02-789b4ee7e853.png",
    "ChatGPT_Image_20_____2026__.__22_01_09-51584363-88ba-4d71-8d4d-01b0c23a1959.png",
    "ChatGPT_Image_20_____2026__.__22_10_38-e4451ae1-2b1b-4556-bfa2-471d1987d2c2.png",
    "ChatGPT_Image_20_____2026__.__22_25_13-839ca5ea-fcac-4139-95e9-f131a51a2457.png",
    "ChatGPT_Image_20_____2026__.__22_27_37-7c0fe4f3-4604-4eba-9bf5-40e25fcdfe57.png",
    "ChatGPT_Image_20_____2026__.__22_45_24-09468470-3df3-4cc2-ae1e-e73c46884bd2.png",
    "ChatGPT_Image_20_____2026__.__22_39_57-120a26ee-ebe3-419d-99eb-fedc9ea6a1f5.png",
    "ChatGPT_Image_20_____2026__.__22_53_25-1d16a1fd-774d-4126-aca9-af9be649a15e.png",
    "ChatGPT_Image_20_____2026__.__23_00_46-5a87adc0-f3f8-4096-a156-30dda5893bc2.png",
    "ChatGPT_Image_20_____2026__.__22_57_00-192eada6-88f6-4d50-8419-afc0875e298e.png",
    "ChatGPT_Image_20_____2026__.__23_03_01-e1fa12c0-6e63-4508-bb84-f642a21afef1.png",
    "ChatGPT_Image_20_____2026__.__23_13_54-71fa1665-2a7b-4ecd-9dba-94bfbe09afc8.png",
    "ChatGPT_Image_20_____2026__.__23_59_01-e1ec01a3-bd52-40de-9538-1fb736a5f681.png",
    "ChatGPT_Image_21_____2026__.__00_02_47-690c62bb-c12f-45e7-a056-7a5778ad3748.png",
    "ChatGPT_Image_21_____2026__.__00_04_24-25c3230c-4ac5-4adc-8dda-2716a82dfef8.png",
    "ChatGPT_Image_21_____2026__.__00_01_27-c0b422fa-c97f-43a1-b50b-ccbec705ae90.png",
    "ChatGPT_Image_21_____2026__.__00_19_46-68bd1961-96f1-40e9-963c-ac5180b6b939.png",
    "ChatGPT_Image_21_____2026__.__00_27_18-bae262ce-09ff-49e8-ba8c-1f612427eac1.png",
    "ChatGPT_Image_21_____2026__.__00_36_52-8dbfa8bb-1b30-4abb-927c-83901bd62410.png",
    "ChatGPT_Image_21_____2026__.__00_41_10-57d7d544-9b7b-4288-b116-60e57dbbfad4.png",
    "ChatGPT_Image_21_____2026__.__00_48_33-41ddbffd-dcf6-4288-83ab-dc4d24c3d658.png",
    "ChatGPT_Image_21_____2026__.__00_51_30-ad0bab1a-227d-462b-b491-d9d95cc04385.png",
    "ChatGPT_Image_21_____2026__.__00_54_09-dc60ebad-ea39-4f5f-8394-a51791c6f0d5.png",
    "ChatGPT_Image_21_____2026__.__00_59_06-7a18c472-f249-4575-89fc-4bf418d52250.png",
    "ChatGPT_Image_21_____2026__.__01_03_50-95904bd0-ca9e-46b4-a202-4ddcd430a74a.png",
    "ChatGPT_Image_21_____2026__.__01_13_06-cbc65232-7131-49f0-9822-cbc2d3a29d70.png",
    "ChatGPT_Image_21_____2026__.__01_24_42-7e994f48-a431-4687-8a49-4cdcd151dd4f.png",
    "ChatGPT_Image_21_____2026__.__01_25_47-dd7eb18f-4138-4e75-bcd3-a2a12c880b94.png",
    "ChatGPT_Image_21_____2026__.__01_28_21-5209f455-3b08-4835-a29c-6d06763ae861.png",
    "ChatGPT_Image_23_____2026__.__14_44_11-0dd83edf-4d45-4eec-8991-63ba5f620cd7.png",
    "ChatGPT_Image_21_____2026__.__01_16_50-7692c6ab-daa8-4ff6-8cbc-08574344b364.png",
    "ChatGPT_Image_21_____2026__.__01_18_15-d1782470-b145-49d6-bcef-577f5003a051.png",
]


def process_to_canvas(src_path: Path, size: int = CANVAS, fill_ratio: float = FILL_RATIO) -> Image.Image:
    with src_path.open("rb") as f:
        out = remove(f.read())
    img = Image.open(io.BytesIO(out)).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 12)
    if len(xs) == 0:
        return img

    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    pad = int(max(x1 - x0, y1 - y0) * 0.035)
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(img.width - 1, x1 + pad), min(img.height - 1, y1 + pad)
    cropped = img.crop((x0, y0, x1 + 1, y1 + 1))

    cw, ch = cropped.size
    target = int(size * fill_ratio)
    scale = min(target / cw, target / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox, oy = (size - nw) // 2, (size - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def export_row(sources: list[str], start_index: int) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for offset, filename in enumerate(sources):
        idx = start_index + offset
        src = ASSETS / filename
        if not src.exists():
            raise FileNotFoundError(src)
        result = process_to_canvas(src)
        out_webp = OUT_DIR / f"roll-{idx:02d}.webp"
        out_png = OUT_DIR / f"roll-{idx:02d}.png"
        result.save(out_webp, "WEBP", quality=92, method=6)
        result.save(out_png, "PNG")
        opaque = float((np.array(result)[:, :, 3] > 10).mean())
        print(f"roll-{idx:02d} <- {filename} | opaque={opaque:.3f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--row",
        choices=["top", "top-extra", "bottom", "all"],
        default="top-extra",
    )
    args = parser.parse_args()

    if args.row in ("top", "all"):
        print("=== top row (roll-01..12) ===")
        export_row(TOP_ROW_SOURCES, 1)
    if args.row in ("top-extra", "all"):
        print("=== top row extra (roll-51..54) ===")
        export_row(TOP_ROW_EXTRA_SOURCES, 51)
    if args.row in ("bottom", "all"):
        print("=== bottom row (roll-13..50) ===")
        export_row(BOTTOM_ROW_SOURCES, 13)


if __name__ == "__main__":
    main()
