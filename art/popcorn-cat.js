// 爆米花卡通形象：三种画风 × 六种表情，全部用 SVG 画，游戏里可以直接用
// 特征（来自照片）：圆脸长毛、额头白色火焰状条纹、头顶深色斑、琥珀色大眼、粉鼻子、白下巴白胸、小而折的耳朵、眼皮微垂的“认真脸”
(function (root) {
  const C = {
    fur: '#C99A5E', furDark: '#8A6038', stripe: '#6E4B30', crown: '#3B2A20',
    white: '#FFFFFF', whiteShade: '#EFE6DC', pink: '#F2A3AF', earIn: '#F3C1BF',
    iris: '#D6AC3A', irisRing: '#94731F', pupil: '#2A1C14', line: '#5B3E2A',
    mouth: '#7A3B3B', tongue: '#F28B9B', blush: '#F7A3B0', tear: '#8CCBF2'
  };

  // 毛绒头型：一圈小波浪
  function fluffyHead(cx, cy, rx, ry, bumps, amp) {
    let d = '';
    for (let k = 0; k <= bumps; k++) {
      const a = Math.PI * 2 * k / bumps - Math.PI / 2;
      const am = Math.PI * 2 * (k - 0.5) / bumps - Math.PI / 2;
      const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      const qx = cx + Math.cos(am) * (rx + amp), qy = cy + Math.sin(am) * (ry + amp);
      d += k === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + ' Z';
  }

  const HEAD_SMOOTH = 'M60 24 C86 24 103 39 105 58 L112 65 L104 69 L109 77 L100 79 C95 95 80 104 60 104 C40 104 25 95 20 79 L11 77 L16 69 L8 65 L15 58 C17 39 34 24 60 24 Z';
  const MUZZLE = 'M60 54 C53 54 51 63 45 70 C35 74 33 88 43 94 C51 100 69 100 77 94 C87 88 85 74 75 70 C69 63 67 54 60 54 Z';
  const BLAZE = 'M60 31 C57.5 39 55.5 47 54.5 57 L65.5 57 C64.5 47 62.5 39 60 31 Z';

  function ears(style, ol) {
    // 小折耳：外耳 + 内耳 + 折下来的耳尖
    const one = `<path d="M23 48 Q21 30 35 25 Q45 29 49 36 Z" fill="${C.fur}" ${ol}/>
      <path d="M28.5 43 Q28 32 35.5 29.5 Q41 32 43 36 Z" fill="${C.earIn}"/>
      <path d="M35 25 Q28.5 29 27 37.5 Q35.5 33 45.5 31.5 Q41 26.5 35 25 Z" fill="${C.furDark}" ${ol ? ol.replace('2.6', '1.8') : ''}/>`;
    return `<g>${one}</g><g transform="translate(120 0) scale(-1 1)">${one}</g>`;
  }

  function eye(x, expr, side) {
    const y = 63;
    const outerX = side === 'L' ? x - 11 : x + 11, innerX = side === 'L' ? x + 11 : x - 11;
    if (expr === 'happy') return `<path d="M${x - 7} ${y + 2} Q${x} ${y - 7} ${x + 7} ${y + 2}" fill="none" stroke="${C.pupil}" stroke-width="3.2" stroke-linecap="round"/>`;
    if (expr === 'sleep') return `<path d="M${x - 7} ${y - 1} Q${x} ${y + 6} ${x + 7} ${y - 1}" fill="none" stroke="${C.pupil}" stroke-width="3" stroke-linecap="round"/>`;
    const r = expr === 'surprised' ? 9.5 : 8.8;
    const pr = expr === 'surprised' ? [3, 3.4] : [4.8, 5.8];
    let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.iris}" stroke="${C.irisRing}" stroke-width="1.6"/>
      <ellipse cx="${x}" cy="${y + 0.6}" rx="${pr[0]}" ry="${pr[1]}" fill="${C.pupil}"/>
      <circle cx="${x - 3}" cy="${y - 3.4}" r="${expr === 'sad' ? 3 : 2.4}" fill="#fff"/>
      <circle cx="${x + 2.6}" cy="${y + 2.6}" r="1.1" fill="#fff" opacity=".9"/>`;
    // 眼皮：外眼角稍微往下垂，就是爆米花那种“认真脸”
    if (expr === 'normal' || expr === 'sad') {
      s += `<path d="M${outerX} ${y - 12} L${innerX} ${y - 12} L${innerX} ${y - 7.5} Q${x} ${y - 7.6} ${outerX} ${y - 4.2} Z" fill="${C.fur}"/>
        <path d="M${innerX - (side === 'L' ? 1.5 : -1.5)} ${y - 7.6} Q${x} ${y - 7.6} ${outerX + (side === 'L' ? 1.5 : -1.5)} ${y - 4.6}" fill="none" stroke="${C.line}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    if (expr === 'smug') {
      s += `<path d="M${x - 11} ${y - 12} L${x + 11} ${y - 12} L${x + 11} ${y + 0.5} L${x - 11} ${y + 0.5} Z" fill="${C.fur}"/>
        <path d="M${x - 9} ${y + 0.5} L${x + 9} ${y + 0.5}" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>`;
    }
    return s;
  }

  function mouth(expr) {
    if (expr === 'happy') return `<path d="M53 83.5 Q60 95 67 83.5 Z" fill="${C.mouth}"/><path d="M56 88 Q60 93.5 64 88 Q60 86.5 56 88 Z" fill="${C.tongue}"/>`;
    if (expr === 'sad') return `<path d="M54.5 87 Q60 82 65.5 87" fill="none" stroke="${C.line}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (expr === 'surprised') return `<ellipse cx="60" cy="86" rx="3.2" ry="3.8" fill="${C.mouth}"/>`;
    if (expr === 'smug') return `<path d="M55 84 Q61 88 66.5 82" fill="none" stroke="${C.line}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (expr === 'sleep') return `<path d="M57 84.5 Q60 86 63 84.5" fill="none" stroke="${C.line}" stroke-width="1.6" stroke-linecap="round"/>`;
    // 平常：小小的 ω，露一点点舌尖（照片里经常这样）
    return `<path d="M54 82.5 Q57 86 60 82.5 Q63 86 66 82.5" fill="none" stroke="${C.line}" stroke-width="1.7" stroke-linecap="round"/><path d="M58.6 84.3 Q60 86.6 61.4 84.3 Z" fill="${C.tongue}"/>`;
  }

  function extras(expr) {
    let s = '';
    if (expr === 'happy') s += `<ellipse cx="33" cy="77" rx="6" ry="3.6" fill="${C.blush}" opacity=".55"/><ellipse cx="87" cy="77" rx="6" ry="3.6" fill="${C.blush}" opacity=".55"/>`;
    if (expr === 'sad') s += `<path d="M34 51 L47.5 46.5" stroke="${C.furDark}" stroke-width="2.6" stroke-linecap="round"/><path d="M86 51 L72.5 46.5" stroke="${C.furDark}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M38 72 Q35.5 77 38 79 Q40.5 77 38 72 Z" fill="${C.tear}"/>`;
    if (expr === 'surprised') s += `<path d="M35 49 Q41 44.5 48 47" fill="none" stroke="${C.furDark}" stroke-width="2.4" stroke-linecap="round"/><path d="M85 49 Q79 44.5 72 47" fill="none" stroke="${C.furDark}" stroke-width="2.4" stroke-linecap="round"/>`;
    if (expr === 'sleep') s += `<text x="92" y="30" font-family="-apple-system, sans-serif" font-weight="800" font-size="15" fill="#9CC8FF">z</text><text x="102" y="18" font-family="-apple-system, sans-serif" font-weight="800" font-size="11" fill="#9CC8FF">z</text>`;
    return s;
  }

  function cat(style, expr) {
    const ol = style === 'A' ? `stroke="${C.line}" stroke-width="2.6" stroke-linejoin="round"` : '';
    const head = style === 'C' ? fluffyHead(60, 66, 45, 38, 26, 4.5) : HEAD_SMOOTH;
    const stripes = `<g stroke="${C.stripe}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".75">
        <path d="M48.5 33 Q50.5 39 49.5 46"/><path d="M42 36 Q45 41 44 47"/>
        <path d="M71.5 33 Q69.5 39 70.5 46"/><path d="M78 36 Q75 41 76 47"/></g>`;
    const chest = style === 'C' ? `<path d="${fluffyHead(60, 112, 26, 14, 14, 3)}" fill="${C.white}"/>` : '';
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      ${ears(style, ol)}
      ${chest}
      <path d="${head}" fill="${C.fur}" ${ol}/>
      ${style !== 'B' ? `<path d="M22 70 C26 88 42 98 60 99 C78 98 94 88 98 70 C92 84 78 92 60 92 C42 92 28 84 22 70 Z" fill="${C.furDark}" opacity=".18"/>` : ''}
      <ellipse cx="60" cy="29" rx="7.5" ry="4.5" fill="${C.crown}" opacity=".85"/>
      ${stripes}
      <path d="${BLAZE}" fill="${C.white}"/>
      <path d="${MUZZLE}" fill="${C.white}"/>
      ${style === 'A' ? '' : `<path d="M47 90 C52 96 68 96 73 90 C68 93.5 52 93.5 47 90 Z" fill="${C.whiteShade}"/>`}
      ${eye(43, expr, 'L')}${eye(77, expr, 'R')}
      <path d="M55.5 75.5 Q60 73.5 64.5 75.5 Q62.5 80.2 60 80.6 Q57.5 80.2 55.5 75.5 Z" fill="${C.pink}"/>
      ${mouth(expr)}
      <g stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity=".95">
        <path d="M40 81 L13 76"/><path d="M40 84.5 L12 86"/><path d="M41 88 L16 95"/>
        <path d="M80 81 L107 76"/><path d="M80 84.5 L108 86"/><path d="M79 88 L104 95"/></g>
      ${extras(expr)}
    </svg>`;
  }

  root.PopcornCat = { cat, colors: C };
})(typeof window !== 'undefined' ? window : globalThis);
