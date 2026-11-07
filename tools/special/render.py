import json, sys, glob
from PIL import Image, ImageDraw, ImageFont
T='/home/claude/popcorn-wx/images/'
tiles=[Image.open(f'{T}tile_{k}.png').convert('RGBA') for k in range(12)]
STRONG=[5,0,1,4,10,2]; PALE=[7,9,11,3,6,8,2,10,4,1,0,5]
def colors(lv):
    n,F,reg=lv['n'],lv['F'],lv['reg']
    col={}; used=set()
    for g in range(F): c=STRONG[g%len(STRONG)]; col[g]=c; used.add(c)
    for g in range(F,n):
        c=next(k for k in PALE if k not in used); col[g]=c; used.add(c)
    return col
def board(lv, cs=40, gap=3):
    n=lv['n']; col=colors(lv); S=n*cs+(n-1)*gap+12
    im=Image.new('RGBA',(S,S),(255,255,255,255))
    for i,g in enumerate(lv['reg']):
        r,c=divmod(i,n); x=6+c*(cs+gap); y=6+r*(cs+gap)
        im.alpha_composite(tiles[col[g]].resize((cs,cs),Image.LANCZOS),(x,y))
    return im
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22) if glob.glob('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc') else None
items=json.loads(sys.argv[1])   # [[file, index, title], ...]
ims=[]
for f,k,title in items:
    lv=json.load(open(f))[k]; b=board(lv)
    W=max(b.width,300); card=Image.new('RGBA',(W+20,b.height+56),(246,242,238,255))
    card.alpha_composite(b,((W+20-b.width)//2,46))
    d=ImageDraw.Draw(card); d.text((12,10),f"{title}  {lv['n']}×{lv['n']}  难度分{lv['score']}",fill=(59,48,43),font=font)
    ims.append(card)
cols=3; cw=max(i.width for i in ims); ch=max(i.height for i in ims)
out=Image.new('RGB',(cols*cw+(cols+1)*16,((len(ims)+cols-1)//cols)*ch+(len(ims)//cols+1)*16+16),(255,255,255))
for j,im in enumerate(ims): out.paste(im,(16+(j%cols)*(cw+16),16+(j//cols)*(ch+16)),im)
out.save(sys.argv[2]); print(out.size)
