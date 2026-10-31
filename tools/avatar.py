import numpy as np, cv2, json
SRC = '/mnt/user-data/uploads/{}-image.jpg'
import onnxruntime as ort
sess = ort.InferenceSession('/home/claude/models/u2net.onnx', providers=['CPUExecutionProvider'])
def mask_of(img):
    h, w = img.shape[:2]
    x = cv2.resize(img, (320, 320)).astype(np.float32)[:, :, ::-1] / 255.0
    x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
    o = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    o = (o - o.min()) / (o.max() - o.min() + 1e-8)
    return cv2.resize(o, (w, h))

def boost(img, sat=1.18, val=1.05):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * sat, 0, 255); hsv[..., 2] = np.clip(hsv[..., 2] * val + 8, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

def soften(img, strength):
    if strength == 0: return boost(img)
    x = cv2.edgePreservingFilter(img, flags=1, sigma_s=30 + 30 * strength, sigma_r=0.18 + 0.12 * strength)
    x = cv2.detailEnhance(x, sigma_s=6, sigma_r=0.1)
    return boost(x)

_full = {}
def full_mask(name, img):
    # 在整张照片上抠图（模型要看到整只猫），再按需要裁
    if name not in _full:
        s = 1024 / max(img.shape[:2])
        small = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        _full[name] = cv2.resize(mask_of(small), (img.shape[1], img.shape[0]))
    return _full[name]

def avatar(name, box, size=320, strength=1, bg=(250, 246, 240), ring=10):
    img = cv2.imread(SRC.format(name))
    fm = full_mask(name, img)
    x0, y0, x1, y1 = box
    crop = cv2.resize(img[y0:y1, x0:x1], (size, size), interpolation=cv2.INTER_AREA)
    m = cv2.resize(fm[y0:y1, x0:x1], (size, size))
    m = np.clip((cv2.GaussianBlur(m, (5, 5), 0) - 0.3) / 0.35, 0, 1)
    art = soften(crop, strength)
    comp = art.astype(np.float32) * m[..., None] + np.array(bg, np.float32) * (1 - m[..., None])
    # 圆形：外圈白边 + 抗锯齿
    S = size + ring * 2
    canvas = np.full((S, S, 3), 255, np.float32)
    canvas[ring:ring + size, ring:ring + size] = comp
    yy, xx = np.mgrid[0:S, 0:S]
    d = np.sqrt((xx - S / 2 + .5) ** 2 + (yy - S / 2 + .5) ** 2)
    alpha = np.clip(S / 2 - d, 0, 1)
    inner = np.clip(S / 2 - ring - d, 0, 1)[..., None]
    canvas = canvas * inner + 255 * (1 - inner)
    return np.dstack([canvas, alpha * 255]).astype(np.uint8)

def sticker(name, box, width=600, strength=1, border=14):
    img = cv2.imread(SRC.format(name))
    x0, y0, x1, y1 = box
    crop = img[y0:y1, x0:x1]
    crop = cv2.resize(crop, (width, int(width * crop.shape[0] / crop.shape[1])), interpolation=cv2.INTER_AREA)
    m = mask_of(crop)
    m = np.clip((cv2.GaussianBlur(m, (5, 5), 0) - 0.3) / 0.35, 0, 1)
    art = soften(crop, strength)
    pad = border * 2
    art = cv2.copyMakeBorder(art, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(255, 255, 255))
    m = cv2.copyMakeBorder(m, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (border * 2 + 1, border * 2 + 1))
    outer = cv2.GaussianBlur(cv2.dilate((m > 0.5).astype(np.uint8) * 255, k), (7, 7), 0).astype(np.float32) / 255
    rgb = art.astype(np.float32) * m[..., None] + 255 * (1 - m[..., None])
    a = np.maximum(outer, m)
    out = np.dstack([rgb, a * 255]).astype(np.uint8)
    ys, xs = np.where(a > 0.05)
    return out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

SET = {
  'serious':  ('1b721d47', (575, 260, 1575, 1260)),   # 认真脸：棋盘默认
  'soft':     ('e18e77dd', (350, 380, 1250, 1280)),   # 软萌/委屈
  'sit':      ('122cf817', (685, 90, 1445, 850)),     # 抬头看你
  'tongue':   ('f8129fa8', (260, 800, 1120, 1660)),   # 露舌尖
  'sleepy':   ('39f062e2', (240, 530, 1340, 1630)),   # 困
  'wow':      ('3362d8fa', (340, 420, 1240, 1320)),   # 吃惊大眼
}
if __name__ == '__main__':
    import sys
    strength = float(sys.argv[1]) if len(sys.argv) > 1 else 1
    for k, (n, b) in SET.items():
        cv2.imwrite(f'av-{k}.png', avatar(n, b, strength=strength))
    cv2.imwrite('st-belly.png', sticker('805ad72a', (0, 40, 2016, 1330), strength=strength))
    cv2.imwrite('st-sit.png', sticker('122cf817', (560, 60, 1560, 1512), width=420, strength=strength))
