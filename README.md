# rocohelper-web

洛克王国·世界孵蛋查询的纯前端静态站点。

## 项目结构

- `index.html`：页面入口
- `styles.css`：页面样式
- `script.js`：查询逻辑
- `data/eggs.csv`：孵蛋数据源，后续可直接替换或编辑

## 本地预览

这是一个静态站点，建议用任意本地静态服务器启动，例如：

```bash
python3 -m http.server 4173
```

然后访问 `http://localhost:4173`

## 数据说明

`data/eggs.csv` 使用以下表头：

```csv
min_height,max_height,min_weight,max_weight,name
```

- 高度数据单位为 `m`
- 页面输入的尺寸单位为 `cm`
- 页面会自动将输入的 `cm` 转换为 `m` 后参与匹配
- 重量单位为 `kg`

## Cloudflare 部署

推荐直接部署到 Cloudflare Pages：

1. 将仓库推送到 GitHub
2. 在 Cloudflare Pages 中连接该仓库
3. 选择该项目后，构建设置保持为空
4. `Build command` 留空
5. `Build output directory` 填 `/`
6. 保存并部署

因为这是零依赖静态站点，所以不需要构建步骤。
