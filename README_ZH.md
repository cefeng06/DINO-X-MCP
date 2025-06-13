# DINO-X MCP

[English](README_EN.md) | **中文**

<p align="center">

DINO-X 官方 MCP 服务器, 基于全球领先的视觉检测模型 DINO-X 和 Grounding DINO 1.6 API，给大模型提供细粒度的目标检测与图像理解能力。

</p>

## 🚀 快速开始

### 1. 环境准备

确保本地已经安装了 [Node.js](https://nodejs.org/)

同时, 选择一个支持 MCP 协议的 AI 助手或客户端，包括但不限于：

- [Cursor](https://www.cursor.com/)
- [WindSurf](https://windsurf.com/)
- [Trae](https://www.trae.ai/)
- [Cherry Studio](https://www.cherry-ai.com/)

### 2. 配置 MCP 服务器

#### 方式一：使用 NPM 安装包 👍

在你的 MCP 客户端的配置文件中加入配置：

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "command": "npx",
      "args": ["-y", "@deepdataspace/dinox-mcp"],
      "env": {
        "DINOX_API_KEY": "you-api-key-here"
      }
    }
  }
}
```

#### 方式二：使用本地项目

首先，克隆本项目代码到本地并编译

```bash
# 下载源码
git clone https://github.com/IDEA-Research/DINO-X-MCP.git
cd DINO-X-MCP

# 安装依赖
pnpm install

# 编译
pnpm run build
```

然后在 MCP 客户端中配置：

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "command": "node",
      "args": ["/path/to/DINO-X-MCP/build/index.js"],
      "env": {
        "DINOX_API_KEY": "you-api-key-here"
      }
    }
  }
}
```

### 3. 获取API密钥

在 [DINO-X 官网](https://cloud.deepdataspace.com/request_api) 注册账号，新用户有免费 API 额度。

获取 API Key 后，把上面配置中的 `you-api-key-here` 替换成真正的密钥。

### 4. 支持的工具

刷新 MCP 配置，就可以在大模型对话中使用以下功能：

| 功能                          | 作用                                                                         | 输入            | 输出                      |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------- | ------------------------------- |
| `全图万物检测`          | 检测并定位图像中所有可识别的物体                                           | 图片链接                | 每个物体的名称 + 2D框 + 详细描述        |
| `指定目标检测`    | 指定一个或多个目标，检测它们的位置和详细描述                                     | 图片链接 + 目标名字      | 所有指定目标的2D框 + 详细描述              |
| `人体姿态检测` | 检测图像中每个人的17个关键点，用于姿态动作分析                           | 图片链接                | 关键点坐标 + 描述                |

## 📝 使用指引

### 支持哪些图片格式？

- 推荐用 `https://` 开头的图片链接
- 或用 `file://` 开头的完整路径
- 常见格式：`jpg、jpeg、png、webp`

### API 使用

可以查看 [DINO-X API 文档](https://cloud.deepdataspace.com/docs)。

## 🛠️ 开发者指引

如果你要修改这个 MCP 服务，可以开启监听模式，代码改动会自动重新编译：

```bash
pnpm run watch
```


遇到问题时，可以用官方调试工具排查：

```bash
pnpm run inspector
```

## 协议

Apache License 2.0