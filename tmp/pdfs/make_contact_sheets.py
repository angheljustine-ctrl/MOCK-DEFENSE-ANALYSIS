from pathlib import Path
import sys
from PIL import Image, ImageDraw

folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"D:\MOCK DEFENSE ANALYSIS\tmp\pdfs\Arialethreads-render")
pages = sorted(folder.glob("page-*.png"))
thumb_size = (700, 990)

for offset in range(0, len(pages), 4):
    batch = pages[offset : offset + 4]
    sheet = Image.new("RGB", (1400, 2052), "#dddddd")
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(batch):
        image = Image.open(path).convert("RGB").resize(thumb_size)
        x = (index % 2) * 700
        y = (index // 2) * 1026
        draw.text((x + 12, y + 8), f"Page {offset + index + 1}", fill="black")
        sheet.paste(image, (x, y + 36))
    first = offset + 1
    last = offset + len(batch)
    sheet.save(folder / f"contact-{first:02d}-{last:02d}.png")
