import numpy as np, cv2, sys
img = cv2.imread('/mnt/user-data/uploads/8da91d5c-image.png')
H, W = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
# 1. 用抠图模型找出整张贴纸（含白边），再往里收一圈，去掉白边和原描边
import onnxruntime as ort
sess = ort.InferenceSession('/home/claude/models/u2net.onnx', providers=['CPUExecutionProvider'])
x = cv2.resize(img, (320, 320)).astype(np.float32)[:, :, ::-1] / 255.0
x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
o = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
o = cv2.resize((o - o.min()) / (o.max() - o.min() + 1e-8), (W, H))
inside = (o > 0.5).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(inside)
inside = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
ff = inside.copy(); cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 2); inside = (ff != 2).astype(np.uint8)  # 填洞
ERODE = int(sys.argv[3]) if len(sys.argv) > 3 else 24
fur = cv2.erode(inside, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * ERODE + 1, 2 * ERODE + 1)))
ys, xs = np.where(fur > 0)
print('fur bbox', xs.min(), ys.min(), xs.max(), ys.max())
cut_y = int(sys.argv[1]) if len(sys.argv) > 1 else 930
# 3. 底部：超过 cut_y 的部分只保留一个椭圆，让下巴下面收成圆弧
cx = (xs.min() + xs.max()) / 2
yy, xx = np.mgrid[0:H, 0:W]
row = np.where(fur[cut_y] > 0)[0]
rx = (row.max() - row.min()) / 2; cx = (row.max() + row.min()) / 2
ry = float(sys.argv[2]) if len(sys.argv) > 2 else 150
ell = (((xx - cx) / rx) ** 2 + ((yy - cut_y) / ry) ** 2) <= 1   # 在 cut_y 处和头一样宽，往下收成圆弧
shape = fur.astype(bool) & ((yy < cut_y) | ell)
# 4. 把一圈尖刺毛修圆润一点
m = cv2.GaussianBlur(shape.astype(np.float32), (0, 0), 7)
m = (m > 0.5).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
# 5. 重新画描边 + 白色贴纸边，背景真透明
def soft(b, s=1.2): return np.clip(cv2.GaussianBlur(b.astype(np.float32), (0, 0), s), 0, 1)
k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
line = cv2.dilate(m, k(6)); border = cv2.dilate(m, k(6 + 18))
fa, la, ba = soft(m), soft(line), soft(border)
out = np.zeros((H, W, 4), np.float32)
outline_col = np.array([28, 30, 62], np.float32)  # BGR 深棕
rgb = img.astype(np.float32) * fa[..., None] + outline_col * (la - fa)[..., None] + 255 * (ba - la)[..., None]
out[..., :3] = rgb; out[..., 3] = ba * 255
ys, xs = np.where(ba > 0.02)
crop = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
h, w = crop.shape[:2]; S = max(h, w) + 40
sq = np.zeros((S, S, 4), np.float32); sq[(S - h) // 2:(S - h) // 2 + h, (S - w) // 2:(S - w) // 2 + w] = crop
cv2.imwrite('head-fixed.png', cv2.resize(sq, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.uint8))
print('done', crop.shape)
