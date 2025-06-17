# DINO-X MCP

**English** | [中文](README_ZH.md)

<p align="center">

Enables large language models to perform fine-grained object detection and image understanding, powered by DINO-X and Grounding DINO 1.6 API.

</p>

## 💡 Why DINO-X MCP?

Although multimodal models can understand and describe images, they often lack precise localization and high-quality structured outputs for visual content.

With DINO-X MCP, you can:

🧠 Achieve fine-grained image understanding — both full-scene recognition and targeted detection based on natural language.

🎯 Accurately obtain object count, position, and attributes, enabling tasks such as visual question answering.

🧩 Integrate with other MCP Servers to build multi-step visual workflows.

🛠️ Build natural language-driven visual agents for real-world automation scenarios.

## 🎬 Use Case
| 🎯 Scenario | 📝 Input | ✨ Output |
|---------|---------|---------|
| **Detection & Localization** | **💬 Prompt:**<br>`Detect the fire areas`<br>`in the forest and visualize`<br>`with Canvas`<br><br>**🖼️ Input Image:**<br><img src="/assets/examples/1-1.jpg" style="width: 200px" /> | <img src="/assets/examples/1-2.png" style="width: 400px" /> |
| **Object Counting** | **💬 Prompt:**<br>`Please analyze this`<br>`warehouse image, detect`<br>`all the cardboard boxes,`<br>`count the total number`<br><br>**🖼️ Input Image:**<br><img src="/assets/examples/2-1.jpeg" style="width: 200px" /> | <img src="/assets/examples/2-2.png" style="width: 400px" /> |
| **Feature Detection** | **💬 Prompt:**<br>`Find all red cars`<br>`in the image`<br><br>**🖼️ Input Image:**<br><img src="/assets/examples/4-1.jpg" style="width: 200px" /> | <img src="/assets/examples/4-3.png" style="width: 400px" /> |
| **Attribute Reasoning** | **💬 Prompt:**<br>`Find the tallest person`<br>`in the image, describe`<br>`their clothing`<br><br>**🖼️ Input Image:**<br><img src="/assets/examples/5-1.jpg" style="width: 200px" /> | <img src="/assets/examples/5-3.png" style="width: 400px" /> |
| **Full Scene Detection** | **💬 Prompt:**<br>`Find the fruit with`<br>`the highest vitamin C`<br>`content in the image`<br><br>**🖼️ Input Image:**<br><img src="/assets/examples/6-1.png" style="width: 200px" /> | <img src="/assets/examples/6-3.png" style="width: 400px" /><br><br>*Answer: Kiwi fruit (93mg/100g)* |
| **Pose Analysis** | **💬 Prompt:**<br>`Please analyze what`<br>`yoga pose this is`<br><br>**🖼️ Input Image:**<br><img src="/assets/examples/3-1.jpg" style="width: 200px" /> | <img src="/assets/examples/3-3.png" style="width: 400px" /> |


## 🚀 Quick Start

### 1. Prerequisites

Make sure you have Node.js installed. If you don't have Node.js, download it from [nodejs.org](https://nodejs.org/).

Also, choose an AI assistants and applications that support the MCP Client, including but not limited to:

- [Cursor](https://www.cursor.com/)
- [WindSurf](https://windsurf.com/)
- [Trae](https://www.trae.ai/)
- [Cherry Studio](https://www.cherry-ai.com/)

### 2. Configure MCP Sever

You can use DINO-X MCP server in two ways:

#### Option A: Using NPM Package 👍

Add the following configuration in your MCP client:

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "command": "npx",
      "args": ["-y", "@deepdataspace/dinox-mcp"],
      "env": {
        "DINOX_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Option B: Using Local Project

First, clone and build the project:

```bash
# Clone the project
git clone https://github.com/IDEA-Research/DINO-X-MCP.git
cd DINO-X-MCP

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

Then configure your MCP client:

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "command": "node",
      "args": ["/path/to/DINO-X-MCP/build/index.js"],
      "env": {
        "DINOX_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 3. Get API Key

Get your API key from [DINO-X Platform](https://cloud.deepdataspace.com/request_api) (A free quota is available for new users).

Replace `your-api-key-here` in the configuration above with your actual API key.

### 4. Available Tools

Restart your MCP client, and you should be able to use the following tools:

| Method Name                   | Description                                                                   | Input               | Output                          |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------- | -------------------------------- |
| `detect-all-objects`          | Detects and localizes all recognizable objects in an image.                   | Image               | Category names + bounding boxes + captions |
| `object-detection-by-text`    | Detects and localizes objects in an image based on a natural language prompt. | Image + Text prompt | Bounding boxes + object captions |
| `detect-human-pose-keypoints` | Detects 17 human body keypoints per person in an image for pose estimation.   | Image               | Keypoint coordinates and captions  |


## 📝 Usage

### Supported Image Formats

- Remote URLs starting with `https://` 👍
- Local file paths (starting with `file://`)
- Common image formats: `jpg, jpeg, png, webp`

### API Docs

Please refer to [DINO-X Platform](https://cloud.deepdataspace.com/docs) for API usage limits and pricing information.


## 🛠️ Development

### Watch Mode

During development, you can use watch mode for automatic rebuilding:

```bash
pnpm run watch
```

### Debugging

Use MCP Inspector to debug the server:

```bash
pnpm run inspector
```

## License

Apache License 2.0
