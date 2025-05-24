# 天机思维模型 MCP 用户手册网站

这个目录包含了天机思维模型 MCP 服务器的用户手册网站，提供中英双语支持。

## 目录结构

```
user-manual/
├── index.html              # 中文首页
├── getting-started.html    # 中文快速入门
├── api.html                # 中文API文档
├── models.html             # 中文思维模型库
├── search.html             # 中文搜索页面
├── css/                    # 样式文件
│   └── style.css
├── en/                     # 英文版本
│   ├── index.html          # 英文首页
│   ├── getting-started.html # 英文快速入门
│   ├── api.html            # 英文API文档
│   ├── models.html         # 英文思维模型库
│   └── search.html         # 英文搜索页面
```

## 使用自动部署脚本

我们提供了一个自动部署脚本，可以简化GitHub Pages的部署过程：

```bash
# 在项目根目录下运行
node deploy.js
```

此脚本会引导您完成部署过程，支持两种部署方式：
1. 使用主分支的docs目录
2. 使用gh-pages分支

## 如何使用GitHub Pages发布用户手册

### 方法一：使用主分支的docs目录

1. 将整个`user-manual`目录重命名为`docs`（如果还没有这样做）
2. 确保`docs`目录位于您项目的根目录下
3. 在GitHub中打开您的仓库设置
4. 滚动到"GitHub Pages"部分
5. 在"Source"下拉菜单中选择"main branch /docs folder"
6. 点击"Save"按钮

几分钟后，您的用户手册将发布在`https://<your-github-username>.github.io/thinking_models_mcp/`

### 方法二：使用gh-pages分支

1. 安装gh-pages包（如果您使用npm管理项目）：
   ```
   npm install --save-dev gh-pages
   ```

2. 在package.json中添加部署脚本：
   ```json
   "scripts": {
     "deploy": "gh-pages -d user-manual"
   }
   ```

3. 运行部署命令：
   ```
   npm run deploy
   ```

4. 在GitHub仓库设置中，将GitHub Pages的源设置为"gh-pages branch"

几分钟后，您的用户手册将被发布。

## 本地预览

要在本地预览这个网站，只需在浏览器中打开任何HTML文件，或者使用简单的HTTP服务器：

使用Node.js的http-server（需要先安装）：
```
npx http-server user-manual
```

使用Python的内置HTTP服务器：
```
# Python 3
python -m http.server --directory user-manual

# Python 2
python -m SimpleHTTPServer
```

然后访问`http://localhost:8000`或命令行中显示的URL。

## 网站功能

### 多语言支持
- 完整的中英文切换功能
- 保持一致的用户界面和内容结构

### 交互式演示
- 思维模型推荐工具
- 第一原理思维工具演示

### 搜索功能
- 全站搜索支持
- 按类别过滤结果（API文档、模型、指南等）
- 显示搜索结果相关性评分

## 更新网站

要更新网站内容，只需编辑相应的HTML、CSS或JavaScript文件，然后按照上述发布方法重新部署即可。

## 注意事项

- 所有的路径引用应使用相对路径，以确保在GitHub Pages上正常工作
- 确保所有链接在中英文版本之间正确对应
- 图片和其他资源应放在适当的子目录中

## 自定义域名（可选）

如果您想使用自定义域名而不是默认的GitHub Pages域名：

1. 在DNS提供商处添加CNAME记录，指向`<your-github-username>.github.io`
2. 在`user-manual`（或`docs`）目录中创建一个名为`CNAME`的文件（无扩展名）
3. 在CNAME文件中写入您的自定义域名（例如`docs.thinking-models.com`）
4. 在GitHub仓库设置的GitHub Pages部分填写您的自定义域名

GitHub会自动为您的网站配置SSL证书，通常需要24小时左右生效。
