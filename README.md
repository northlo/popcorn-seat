# 爆米花找座位

一款以猫咪“爆米花”为主角的逻辑填格小游戏（原型 v0.1）。

规则：每行、每列、每个颜色区各放 1 只爆米花，两只不能挨着（斜着也不行）。

- `index.html`：可以直接在浏览器里玩的原型页面（GitHub Pages 发布的就是它）
- `src/template.html`：页面源码模板
- `tools/gen.js`：关卡生成器（保证唯一解、可纯推理解出）
- `tools/verify.js`：用穷举法复查每一关是否唯一解
- `tools/build.js`：把关卡数据塞进模板，生成 `index.html`

重新生成：`node tools/gen.js && node tools/verify.js && node tools/build.js`
