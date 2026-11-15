import json, numpy as np, cv2
from shapely.geometry import LineString, Polygon
L=json.load(open('lines_px.json'))
# região da vista frontal do meio (px da imagem original)
center = Polygon([(250,258),(490,258),(490,500),(250,500)])
# faixa das asas dessa vista, que passa por trás das vistas de cima
wing_band = Polygon([(112,412),(625,412),(625,452),(112,452)])
# corpos das vistas de cima (onde NÃO apagar nada)
top_left  = Polygon([(170,290),(240,290),(240,470),(170,470)])
top_right = Polygon([(500,290),(570,290),(570,470),(500,470)])
# asas das vistas de cima (começam em y~465): proteger
wings_l = Polygon([(115,462),(240,462),(352,532),(352,600),(115,600)])
wings_r = Polygon([(625,462),(500,462),(388,532),(388,600),(625,600)])
protect = top_left.union(top_right).union(wings_l).union(wings_r)
sel=[]
for i,l in enumerate(L):
    ls=LineString(l)
    inside_c = ls.intersection(center).length/ max(ls.length,1e-6)
    inside_w = ls.intersection(wing_band).length/ max(ls.length,1e-6)
    inside_p = ls.intersection(protect).length/ max(ls.length,1e-6)
    a=np.array(l); bw=np.ptp(a[:,0]); bh=np.ptp(a[:,1])
    horiz = bh < 0.35*max(bw,1e-6) or ls.length < 8
    tips = Polygon([(110,416),(132,416),(132,442),(110,442)]).union(Polygon([(604,416),(628,416),(628,442),(604,442)]))
    if ls.intersection(tips).length/max(ls.length,1e-6) > 0.7: sel.append(i); continue
    if (inside_c>0.8 or (inside_w>0.8 and horiz)) and inside_p<0.3:
        sel.append(i)
json.dump(sel,open('mid_sel.json','w'))
S=3
img=np.full((560*S,736*S,3),255,np.uint8)
for i,l in enumerate(L):
    p=((np.array(l)-[0,100])*S).astype(np.int32)
    cv2.polylines(img,[p],False,(0,0,230) if i in set(sel) else (0,0,0),2 if i in set(sel) else 1,cv2.LINE_AA)
cv2.imwrite('sel.png',img[int(300*S):int(420*S), int(100*S):int(640*S)])
print(len(sel))
