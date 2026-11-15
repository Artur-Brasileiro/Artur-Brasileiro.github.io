import vpype as vp, numpy as np, cv2, sys
src, out, ppm = sys.argv[1], sys.argv[2], float(sys.argv[3])
doc = vp.read_multilayer_svg(src, 0.1)
MM = 96/25.4
w,h = doc.page_size
img = np.full((int(h/MM*ppm), int(w/MM*ppm), 3), 255, np.uint8)
pen = max(1, int(round(0.5*ppm)))
for lc in doc.layers.values():
    for line in lc:
        p = np.c_[line.real, line.imag]/MM*ppm
        cv2.polylines(img, [p.round().astype(np.int32)], False, (40,30,25), pen, cv2.LINE_AA)
cv2.imwrite(out, img)
