# DQD Nuxt Spider

一个专门用于爬取 Nuxt.js 框架网站的 Node.js 爬虫工具，能够提取 `window.__NUXT__` 数据并保存为 JSON 文件或存储到 MongoDB 数据库。

## 🚀 功能特性

- **专门针对 Nuxt 框架**：专门设计用于爬取使用 Nuxt.js 构建的网站
- **智能数据提取**：自动识别和提取 `window.__NUXT__` 数据
- **函数执行支持**：支持处理函数形式的 NUXT 数据
- **多种保存方式**：支持保存为 JSON 文件或存储到 MongoDB
- **错误处理机制**：完善的错误处理和重试机制
- **调试功能**：自动保存 HTML 页面用于调试分析
- **命令行界面**：简单易用的命令行工具
- **数据结构分析**：自动分析提取数据的结构

## 📦 技术栈

- **Node.js** - 运行环境
- **Axios** - HTTP 请求库
- **Mongoose** - MongoDB 对象建模工具
- **dotenv** - 环境变量管理

## 🛠️ 安装设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd DQD_Node-Spider
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的参数：

```env
# MongoDB 连接字符串
MONGODB_URI=mongodb://localhost:27017/nuxt_spider

# 是否同时保存到数据库（可选）
SAVE_TO_DB=false

# 爬虫配置
REQUEST_DELAY=1000
MAX_RETRIES=3
REQUEST_TIMEOUT=15000

# 日志级别
LOG_LEVEL=info
```

### 4. 启动 MongoDB（如果使用数据库存储）

```bash
# 使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或者启动本地 MongoDB 服务
mongod
```

## 🎯 使用方法

### 命令行使用

#### 查看帮助信息

```bash
node index.js
```

#### 爬取指定网站

```bash
# 爬取懂球帝数据页面
node index.js scrape https://www.dongqiudi.com/data/1

# 指定保存文件名
node index.js scrape https://www.dongqiudi.com/data/1 my-data.json
```

#### 运行示例

```bash
node index.js example
```

#### 查看最近的爬取记录

```bash
# 查看最近 10 条记录
node index.js recent

# 查看最近 20 条记录
node index.js recent 20
```

#### 查找指定 URL 的记录

```bash
node index.js find https://www.dongqiudi.com/data/1
```

### 编程方式使用

```javascript
const NuxtSpiderApp = require('./index');

async function main() {
  const app = new NuxtSpiderApp();
  
  try {
    // 初始化应用
    await app.init();
    
    // 爬取 Nuxt 网站
    const result = await app.scrapeNuxtSite(
      'https://www.dongqiudi.com/data/1',
      'dongqiudi-data.json'
    );
    
    if (result.success) {
      console.log('爬取成功！');
      console.log('数据文件:', result.filePath);
      console.log('数据键:', result.dataKeys);
    }
    
  } catch (error) {
    console.error('爬取失败:', error.message);
  } finally {
    await app.cleanup();
  }
}

main();
```

## 📁 项目结构

```
DQD_Node-Spider/
├── config/
│   └── database.js          # 数据库连接配置
├── models/
│   └── ScrapedData.js       # Nuxt 数据模型
├── spider/
│   └── NuxtScraper.js       # Nuxt 爬虫核心类
├── .env                     # 环境变量配置
├── .env.example             # 环境变量示例
├── index.js                 # 主入口文件
├── package.json             # 项目依赖配置
└── README.md                # 项目说明文档
```

## 🗄️ 数据模型

### ScrapedData 模型字段

```javascript
{
  sourceUrl: String,        // 数据来源 URL
  title: String,           // 页面标题
  content: String,         // Nuxt 数据内容（JSON 字符串）
  dataType: String,        // 数据类型（默认：window.__NUXT__）
  dataKeys: [String],      // 提取的数据键列表
  filePath: String,        // JSON 文件保存路径
  customData: Mixed,       // 自定义数据字段
  scrapedAt: Date,         // 爬取时间
  status: String,          // 处理状态（success/failed/partial）
  errorMessage: String     // 错误信息
}
```

## ⚙️ 配置选项

### 环境变量

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `MONGODB_URI` | MongoDB 连接字符串 | `mongodb://localhost:27017/nuxt_spider` | 否 |
| `SAVE_TO_DB` | 是否保存到数据库 | `false` | 否 |
| `REQUEST_DELAY` | 请求延迟（毫秒） | `1000` | 否 |
| `MAX_RETRIES` | 最大重试次数 | `3` | 否 |
| `REQUEST_TIMEOUT` | 请求超时（毫秒） | `15000` | 否 |
| `LOG_LEVEL` | 日志级别 | `info` | 否 |

### NuxtScraper 配置

```javascript
const scraper = new NuxtScraper({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  timeout: 15000,
  maxRetries: 3,
  delay: 1000
});
```

## 🔧 开发模式

### 启动开发服务器

```bash
npm run dev
```

### 运行测试

```bash
npm test
```

## 📝 使用示例

### 示例 1：爬取懂球帝数据

```bash
node index.js scrape https://www.dongqiudi.com/data/1 dongqiudi.json
```

### 示例 2：批量爬取多个页面

```javascript
const app = new NuxtSpiderApp();

const urls = [
  'https://www.dongqiudi.com/data/1',
  'https://www.dongqiudi.com/data/2',
  'https://www.dongqiudi.com/data/3'
];

for (const url of urls) {
  const result = await app.scrapeNuxtSite(url);
  console.log(`${url}: ${result.success ? '成功' : '失败'}`);
}
```

### 示例 3：自定义数据处理

```javascript
const scraper = new NuxtScraper();

const result = await scraper.scrape('https://example.com');
if (result.success) {
  // 自定义数据处理逻辑
  const processedData = processNuxtData(result.data);
  await saveCustomData(processedData);
}
```

## ⚠️ 注意事项

1. **目标网站限制**：请确保目标网站允许爬取，遵守 robots.txt 规则
2. **请求频率**：合理设置请求延迟，避免对目标服务器造成压力
3. **数据安全**：爬取的数据可能包含敏感信息，请妥善处理
4. **法律合规**：确保爬取行为符合相关法律法规
5. **网站变更**：目标网站结构变更可能影响爬取效果

## 🐛 故障排除

### 常见问题

#### 1. 无法提取 NUXT 数据

**问题**：提示 "未能提取到window.__NUXT__数据"

**解决方案**：
- 检查目标网站是否使用 Nuxt 框架
- 查看调试 HTML 文件确认页面结构
- 尝试不同的 User-Agent

#### 2. 数据库连接失败

**问题**：MongoDB 连接错误

**解决方案**：
- 确保 MongoDB 服务正在运行
- 检查 `MONGODB_URI` 配置
- 验证数据库访问权限

#### 3. 请求超时

**问题**：网络请求超时

**解决方案**：
- 增加 `REQUEST_TIMEOUT` 值
- 检查网络连接
- 使用代理服务器

### 调试模式

启用详细日志：

```bash
LOG_LEVEL=debug node index.js scrape <url>
```

查看调试文件：
- `debug-page.html` - 原始 HTML 页面
- `raw-nuxt-data.txt` - 原始 NUXT 数据

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 搜索已有的 Issues
3. 创建新的 Issue 并提供详细信息

## 📈 更新日志

### v1.0.0 (2025-01-26)

- ✨ 初始版本发布
- 🎯 专门针对 Nuxt 框架的爬虫功能
- 📦 支持 `window.__NUXT__` 数据提取
- 💾 支持 JSON 文件和 MongoDB 存储
- 🛠️ 完整的命令行工具
- 📝 详细的文档和示例

---

**Happy Scraping! 🕷️**