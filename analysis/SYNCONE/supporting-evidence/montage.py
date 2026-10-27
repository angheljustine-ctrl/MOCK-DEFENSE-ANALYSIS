from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
p=Path(__file__).parent
files=sorted(p.glob('page-*.png'))
for start in range(0,len(files),6):
    group=files[start:start+6]
    out=Image.new('RGB',(1260,940),'#cad2da')
    for i,f in enumerate(group):
        im=Image.open(f);im.thumbnail((402,435))
        x=(i%3)*420+9;y=(i//3)*470+23
        out.paste(im,(x,y));ImageDraw.Draw(out).text((x,y-17),f.stem,fill='black')
    out.save(p/f'montage-{start//6+1}.png')
print(len(files),'pages rendered')
