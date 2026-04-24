# LUMINA Atelier

一个可部署到 Vercel 的文艺风 AI 图像工作室，支持：
- 中文 / English 双语切换
- 图像生成 + 聊天 / 识图
- 预设提示词 + 标签商店式 Prompt 组合
- 环境变量配置的共享模型密码接入
- 用户自定义模型与 API Key

## 本地运行

1. 安装依赖
   npm install

2. 创建 `.env.local`
   参考 `.env.example`，填入共享模型环境变量

3. 启动开发环境
   npm run dev

## Vercel 部署

在 Vercel 项目环境变量中添加：

- `SHARED_PROVIDER_PASSWORD`
- `SHARED_PROVIDER_API_KEY`
- `SHARED_PROVIDER_ENDPOINT`
- `SHARED_PROVIDER_CHAT_MODEL`
- `SHARED_PROVIDER_IMAGE_MODEL`
- `VITE_APP_NAME`
- `VITE_SHARED_PROVIDER_LABEL`
- `VITE_SHARED_PROVIDER_DESCRIPTION`
- `VITE_SUPPORT_EMAIL`（可选）

说明：
- 前端不会直接暴露共享 API Key。
- 用户在设置页输入你配置的共享密码后，即可调用服务端代理到你的默认模型。
- 如果用户切换到“使用我自己的模型”，则使用其自行填写的 endpoint / key / model。

## 结构说明

- `src/components/PromptStore.tsx`：预设提示词与标签商店
- `src/components/SettingsModal.tsx`：共享模型密码 / 多语言 / 自定义模型设置
- `api/chat.js`：聊天流式代理
- `api/generate-image.js`：绘图代理
- `api/provider/unlock.js`：共享密码验证与前端运行时配置
- `api/_shared/provider.js`：服务端环境变量解析

## 我已经直接帮你做的优化

- 更统一的暗色文艺风视觉
- 图像模式下可直接组合 preset + tag + custom suffix
- 支持共享模型密码启用，减少普通用户使用门槛
- 首页改为更像作品工作室的介绍式空状态
- 生成结果会记录当前所用 preset/tag 元数据，后续方便继续扩展“作品回溯”功能

## 下一步建议

如果你愿意，我下一轮可以继续直接帮你补：
- 生成历史保存 / 收藏夹
- Prompt 标签搜索、分类页、热门榜
- 不同图片模型适配参数（比例、尺寸、质量、seed）
- 管理员后台：在线编辑预设标签商店内容
- 登录系统 / 使用额度限制 / 访客体验模式
