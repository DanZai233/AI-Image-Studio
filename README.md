# LUMINA Atelier

一个可部署到 Vercel 的文艺风 AI 图像工作室，支持：
- 中文 / English 双语切换
- 图像生成 + 聊天 / 识图
- 预设提示词 + 标签商店式 Prompt 组合
- 标签商店分类筛选、搜索、收藏、最近使用
-  环境变量配置的共享模型密码接入
-  用户自定义模型与 API Key（不会持久化到 localStorage）
- 真实工作区、工作区上下文连续创作
- 本地持久化聊天、图片、工作区
- 点击图片灯箱预览
- 引用图片直传图片生成链路（模型支持时）

## 本地运行

1. 安装依赖
   npm install

2. 创建 `.env.local`
   参考 `.env.example`，填入共享模型环境变量

3. 启动开发环境
   npm run dev

4. 生产构建检查
   npm run build

## Vercel 部署

在 Vercel 项目环境变量中添加：

服务端私密变量：
- `SHARED_PROVIDER_PASSWORD`
- `SHARED_PROVIDER_API_KEY`
- `SHARED_PROVIDER_ENDPOINT`
- `SHARED_PROVIDER_CHAT_MODEL`
- `SHARED_PROVIDER_IMAGE_MODEL`

前端公开品牌变量：
- `VITE_APP_NAME`
- `VITE_SHARED_PROVIDER_LABEL`
- `VITE_SHARED_PROVIDER_DESCRIPTION`
- `VITE_SUPPORT_EMAIL`（可选）
- `VITE_IMAGE_REFERENCE_HINT`（可选，用于说明参考图能力和兼容性）

推荐配置示例：
- `SHARED_PROVIDER_PASSWORD`：你提供给站内用户的共享访问密码
- `SHARED_PROVIDER_API_KEY`：你自己的模型 API Key
- `SHARED_PROVIDER_ENDPOINT`：例如 `https://api.openai.com/v1`
- `SHARED_PROVIDER_CHAT_MODEL`：例如 `gpt-4o-mini`
- `SHARED_PROVIDER_IMAGE_MODEL`：例如 `gpt-image-1`
- `VITE_APP_NAME`：前端显示的站点名称
- `VITE_SHARED_PROVIDER_LABEL`：例如 `Studio Shared Model`
- `VITE_SHARED_PROVIDER_DESCRIPTION`：设置页共享模型说明文案
- `VITE_SUPPORT_EMAIL`：联系邮箱，可为空
- `VITE_IMAGE_REFERENCE_HINT`：例如 `Referenced images are forwarded when the upstream image model accepts multimodal prompt content.`

说明：
- 前端不会直接暴露共享 API Key。
- 用户在设置页输入你配置的共享密码后，即可调用服务端代理到你的默认模型。
- 如果用户切换到“使用我自己的模型”，则使用其自行填写的 endpoint / key / model。
- 图像生成接口现在会优先尝试把引用图片作为多模态输入直接透传给上游模型。
- 只有当上游明确不支持参考图这类多模态输入时，系统才会自动退回到“上下文文本引导”模式。
- 为了降低隐私暴露和 prompt 过长风险，回退时只会发送最近一小段工作区摘要，而不是无上限拼接完整历史。
- 很适合部署成“免配置试用 + 高级用户自定义模型”这种双模式体验。

## 结构说明

- `src/components/PromptStore.tsx`：预设提示词与标签商店弹窗
- `src/components/SettingsModal.tsx`：共享模型密码 / 多语言 / 自定义模型设置
- `src/lib/promptLibrary.ts`：预设与标签数据源
- `src/lib/store.tsx`：工作区、聊天、图片、灯箱、本地持久化状态
- `api/chat.js`：聊天流式代理
- `api/generate-image.js`：绘图代理（含参考图透传与回退逻辑）
- `api/provider/unlock.js`：共享密码验证与前端运行时配置
- `api/_shared/provider.js`：服务端环境变量解析

## 我已经直接帮你做的优化

- 更统一的暗色文艺风视觉
- 图像模式下可直接组合 preset + tag + custom suffix
- 标签商店改成不挡输入框的可关闭 modal
- 新增预设 / 标签分类筛选
- 新增预设 / 标签搜索
- 新增收藏与最近使用体验
- 新增精选预设与热门标签捷径
- 支持共享模型密码启用，减少普通用户使用门槛
- 首页改为更像作品工作室的介绍式空状态
- 真实工作区系统，支持切换 / 重命名 / 删除
- 工作区内聊天和图片默认连续作为上下文
- localStorage 持久化工作区、消息与图片
- 图片灯箱预览
- 生成结果会记录当前所用 preset/tag 元数据，后续方便继续扩展“作品回溯”功能
- 引用图片可直接透传给图片生成接口，提升参考图生成能力

## 下一步建议

如果你愿意，我下一轮可以继续直接帮你补：
- 生成历史收藏夹 / 多作品对比
- Prompt 热门榜与专题推荐页
- 不同图片模型适配参数（比例、尺寸、质量、seed）
- 管理员后台：在线编辑预设标签商店内容
- 登录系统 / 使用额度限制 / 访客体验模式
