# DQD Node Spider

一个基于 Node.js 的网页爬虫项目，用于抓取网页数据并保存到 MongoDB 数据库中。

## 功能特性

- 🚀 高效的网页抓取和数据解析
- 📊 自动提取页面标题、内容、链接和图片
- 🗄️ 数据自动保存到 MongoDB 数据库
- 🔄 支持重试机制和错误处理
- 🎭 随机 User-Agent 支持
- ⚡ 并发请求控制
- 📝 详细的日志记录
- 🛠️ 灵活的配置选项

## 技术栈

- **Node.js** - 运行环境
- **Axios** - HTTP 请求库
- **Cheerio** - 服务端 jQuery 实现，用于 HTML 解析
- **Mongoose** - MongoDB 对象建模工具
- **dotenv** - 环境变量管理
- **user-agents** - 随机 User-Agent 生成
- **delay** - 请求延迟控制

## 安装和设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd DQD_Node-Spider
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env` 并根据需要修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# MongoDB数据库连接配置
MONGODB_URI=mongodb://localhost:27017/spider_db

# 爬虫配置
REQUEST_DELAY=1000
MAX_RETRIES=3
TIMEOUT=10000

# 用户代理配置
USE_RANDOM_USER_AGENT=true

# 日志配置
LOG_LEVEL=info

# 并发配置
MAX_CONCURRENT_REQUESTS=5
```

### 4. 启动 MongoDB

确保 MongoDB 服务正在运行。如果使用本地 MongoDB：

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

## 使用方法

### 命令行使用

#### 查看帮助

```bash
node index.js
```

#### 运行示例

```bash
node index.js example
```

#### 爬取单个 URL

```bash
node index.js scrape https://example.com
```

#### 查看最近爬取的数据

```bash
# 查看最近 10 条数据
node index.js recent

# 查看最近 20 条数据
node index.js recent 20
```

#### 查找特定 URL 的数据

```bash
node index.js find https://example.com
```

### 编程方式使用

```javascript
const SpiderApp = require('./index');

async function main() {
  const app = new SpiderApp();
  
  try {
    // 初始化应用
    await app.init();
    
    // 爬取单个 URL
    const result = await app.scrapeUrl('https://example.com');
    console.log('爬取结果:', result);
    
    // 批量爬取
    const urls = [
      'https://example.com',
      'https://httpbin.org/html'
    ];
    const results = await app.scrapeUrls(urls);
    
    // 查看最近数据
    const recentData = await app.getRecentData(5);
    console.log('最近数据:', recentData);
    
  } finally {
    // 清理资源
    await app.cleanup();
  }
}

main().catch(console.error);
```

## 项目结构

```
DQD_Node-Spider/
├── config/
│   └── database.js          # 数据库连接配置
├── models/
│   └── ScrapedData.js       # 数据模型定义
├── spider/
│   └── WebScraper.js        # 爬虫核心逻辑
├── .env                     # 环境变量配置
├── .env.example             # 环境变量模板
├── index.js                 # 主入口文件
├── package.json             # 项目配置和依赖
├── LICENSE                  # 许可证
└── README.md                # 项目说明
```

## 数据模型

爬取的数据会保存到 MongoDB 中，包含以下字段：

- `sourceUrl` - 源 URL
- `title` - 页面标题
- `content` - 页面内容
- `links` - 提取的链接列表
- `images` - 提取的图片列表
- `customData` - 自定义数据字段
- `scrapedAt` - 爬取时间
- `status` - 数据状态（pending/processed/failed）
- `errorMessage` - 错误信息（如果有）

## 配置选项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `MONGODB_URI` | `mongodb://localhost:27017/spider_db` | MongoDB 连接字符串 |
| `REQUEST_DELAY` | `1000` | 请求间隔（毫秒） |
| `MAX_RETRIES` | `3` | 最大重试次数 |
| `TIMEOUT` | `10000` | 请求超时时间（毫秒） |
| `USE_RANDOM_USER_AGENT` | `true` | 是否使用随机 User-Agent |
| `MAX_CONCURRENT_REQUESTS` | `5` | 最大并发请求数 |

## 开发模式

使用 nodemon 进行开发：

```bash
npm run dev
```

## 注意事项

1. **遵守网站的 robots.txt** - 在爬取网站前请检查其 robots.txt 文件
2. **合理设置延迟** - 避免对目标网站造成过大压力
3. **尊重版权** - 确保爬取的内容符合相关法律法规
4. **错误处理** - 程序已包含基本的错误处理，但建议根据具体需求进行调整
5. **数据清理** - 定期清理数据库中的过期或无用数据

## 故障排除

### 常见问题

1. **MongoDB 连接失败**
   - 确保 MongoDB 服务正在运行
   - 检查连接字符串是否正确
   - 确认网络连接正常

2. **爬取失败**
   - 检查目标网站是否可访问
   - 确认网络连接正常
   - 调整超时时间和重试次数

3. **内存使用过高**
   - 减少并发请求数
   - 增加请求延迟
   - 限制内容长度

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 基本的网页爬取功能
- MongoDB 数据存储
- 命令行界面
- 配置文件支持