import json
from PIL import Image, ImageDraw, ImageFont
T='/home/claude/popcorn-wx/images/'
tiles=[Image.open(f'{T}tile_{k}.png').convert('RGBA') for k in range(12)]
PASTEL=['#EDE3D3','#D6E6F2','#E5DAF0','#D9EBD9','#F5E1C3','#F3D7DD','#D2E7E4','#E3E1DC','#F2EBC2','#DCE0EE']
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',20)
L=[l for l in json.load(open('../levels-v3.json')) if l.get('sp')]
TAG={'num':'纪念关','same':'同形关','pic':'图案关'}
def board(l,cs=26,gap=2):
    n=l['n']; reg=list(map(int,l['reg'].split(','))); col=l['colors']; S=n*cs+(n-1)*gap+10
    im=Image.new('RGBA',(S,S),(255,255,255,255)); d=ImageDraw.Draw(im)
    xy=lambda i:(5+(i%n)*(cs+gap),5+(i//n)*(cs+gap))
    for i,g in enumerate(reg):
        x,y=xy(i); k=col[g]
        if k<12: im.alpha_composite(tiles[k].resize((cs,cs),Image.LANCZOS),(x,y))
        else: d.rounded_rectangle((x,y,x+cs,y+cs),radius=4,fill=PASTEL[k-12])
    for i,g in enumerate(reg):
        x,y=xy(i)
        if i%n<n-1 and reg[i+1]!=g: d.line((x+cs+gap/2,y-1,x+cs+gap/2,y+cs+1),fill=(90,70,60),width=2)
        if i//n<n-1 and reg[i+n]!=g: d.line((x-1,y+cs+gap/2,x+cs+1,y+cs+gap/2),fill=(90,70,60),width=2)
    return im
cards=[]
for l in sorted(L,key=lambda l:l['id']):
    b=board(l); card=Image.new('RGBA',(330,b.height+40),(246,242,238,255)); card.alpha_composite(b,((330-b.width)//2,36))
    ImageDraw.Draw(card).text((10,6),f"第{l['id']}关 {TAG[l['sp']['t']]}·{l['sp']['name']}",fill=(59,48,43),font=font); cards.append(card)
cols=5; ch=max(c.height for c in cards)
out=Image.new('RGB',(cols*340+10,((len(cards)+cols-1)//cols)*(ch+10)+10),(255,255,255))
for j,c in enumerate(cards): out.paste(c,(10+(j%cols)*340,10+(j//cols)*(ch+10)),c)
out.save('/mnt/user-data/outputs/special-levels-all.png'); print(out.size)
