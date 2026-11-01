# 把 GPT 生成的白底表情头像做成和棋盘头像一样的贴纸：抠图、修边、深棕描边 + 白边、透明背景、统一大小
import numpy as np, cv2, sys
import onnxruntime as ort
sess = ort.InferenceSession('/home/claude/models/u2net.onnx', providers=['CPUExecutionProvider'])
def process(src, dst, erode=3):
    img = cv2.copyMakeBorder(cv2.imread(src), 60, 60, 60, 60, cv2.BORDER_CONSTANT, value=(255, 255, 255)); H, W = img.shape[:2]
    x = cv2.resize(img, (320, 320)).astype(np.float32)[:, :, ::-1] / 255.0
    x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
    o = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    o = cv2.resize((o - o.min()) / (o.max() - o.min() + 1e-8), (W, H))
    m = (o > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    m = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    ff = m.copy(); cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 2)  # 填洞; m = (ff != 2).astype(np.uint8)
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    m = cv2.erode(m, k(erode))
    # 去掉胡须尖刺，轮廓圆润
    m = (cv2.GaussianBlur(m.astype(np.float32), (0, 0), 7) > 0.5).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k(9))
    def soft(b, s=1.2): return np.clip(cv2.GaussianBlur(b.astype(np.float32), (0, 0), s), 0, 1)
    line = cv2.dilate(m, k(5)); border = cv2.dilate(m, k(5 + 16))
    fa, la, ba = soft(m), soft(line), soft(border)
    outline = np.array([28, 30, 62], np.float32)
    rgb = img.astype(np.float32) * fa[..., None] + outline * (la - fa)[..., None] + 255 * (ba - la)[..., None]
    out = np.zeros((H, W, 4), np.float32); out[..., :3] = rgb; out[..., 3] = ba * 255
    ys, xs = np.where(ba > 0.02)
    crop = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = crop.shape[:2]; S = max(h, w) + 30
    sq = np.zeros((S, S, 4), np.float32); sq[(S - h) // 2:(S - h) // 2 + h, (S - w) // 2:(S - w) // 2 + w] = crop
    cv2.imwrite(dst, cv2.resize(sq, (600, 600), interpolation=cv2.INTER_AREA).astype(np.uint8))
    print(dst, 'mask bbox', xs.min(), ys.min(), xs.max(), ys.max())
for src, name in zip(sys.argv[1::2], sys.argv[2::2]):
    process(src, f'art/expr/{name}.png')
