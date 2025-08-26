const { connectDB, disconnectDB } = require('./config/database');
const WebScraper = require('./spider/WebScraper');
const ScrapedData = require('./models/ScrapedData');
require('dotenv').config();

/**
 * 主应用程序类
 */
class SpiderApp {
  constructor() {
    this.scraper = new WebScraper();
  }

  /**
   * 初始化应用程序
   */
  async init() {
    try {
      console.log('正在初始化爬虫应用程序...');
      await connectDB();
      console.log('爬虫应用程序初始化完成');
    } catch (error) {
      console.error('初始化失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 爬取单个URL
   * @param {string} url - 目标URL
   */
  async scrapeUrl(url) {
    try {
      console.log(`开始爬取URL: ${url}`);
      const result = await this.scraper.scrapeUrl(url);
      console.log('爬取完成:', result._id);
      return result;
    } catch (error) {
      console.error('爬取失败:', error.message);
      throw error;
    }
  }

  /**
   * 批量爬取URL列表
   * @param {Array<string>} urls - URL列表
   */
  async scrapeUrls(urls) {
    try {
      console.log(`开始批量爬取 ${urls.length} 个URL`);
      const results = await this.scraper.scrapeUrls(urls);
      console.log('批量爬取完成');
      return results;
    } catch (error) {
      console.error('批量爬取失败:', error.message);
      throw error;
    }
  }

  /**
   * 查看最近爬取的数据
   * @param {number} limit - 限制数量
   */
  async getRecentData(limit = 10) {
    try {
      const data = await ScrapedData.getRecent(limit);
      console.log(`获取到 ${data.length} 条最近数据`);
      return data;
    } catch (error) {
      console.error('获取数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 根据URL查找数据
   * @param {string} url - 目标URL
   */
  async findByUrl(url) {
    try {
      const data = await ScrapedData.findByUrl(url);
      if (data) {
        console.log(`找到URL数据: ${url}`);
      } else {
        console.log(`未找到URL数据: ${url}`);
      }
      return data;
    } catch (error) {
      console.error('查找数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理应用程序资源
   */
  async cleanup() {
    try {
      console.log('正在清理资源...');
      await disconnectDB();
      console.log('资源清理完成');
    } catch (error) {
      console.error('清理资源失败:', error.message);
    }
  }
}

/**
 * 示例使用函数
 */
async function example() {
  const app = new SpiderApp();
  
  try {
    // 初始化应用
    await app.init();
    
    // 示例URL列表（可以根据需要修改）
    const urlsToScrape = [
      'https://example.com',
      'https://httpbin.org/html',
      // 添加更多URL...
    ];
    
    console.log('\n=== 开始示例爬取 ===');
    
    // 爬取单个URL
    if (urlsToScrape.length > 0) {
      console.log('\n--- 爬取单个URL ---');
      await app.scrapeUrl(urlsToScrape[0]);
    }
    
    // 批量爬取（如果有多个URL）
    if (urlsToScrape.length > 1) {
      console.log('\n--- 批量爬取URL ---');
      await app.scrapeUrls(urlsToScrape.slice(1));
    }
    
    // 查看最近爬取的数据
    console.log('\n--- 最近爬取的数据 ---');
    const recentData = await app.getRecentData(5);
    recentData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} - ${item.sourceUrl} (${item.scrapedAt})`);
    });
    
  } catch (error) {
    console.error('示例执行失败:', error.message);
  } finally {
    // 清理资源
    await app.cleanup();
  }
}

/**
 * 命令行参数处理
 */
function handleCommandLine() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n使用方法:');
    console.log('  node index.js example              # 运行示例');
    console.log('  node index.js scrape <url>         # 爬取单个URL');
    console.log('  node index.js recent [limit]       # 查看最近数据');
    console.log('  node index.js find <url>           # 查找URL数据');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'example':
      example();
      break;
      
    case 'scrape':
      if (args[1]) {
        (async () => {
          const app = new SpiderApp();
          try {
            await app.init();
            await app.scrapeUrl(args[1]);
          } finally {
            await app.cleanup();
          }
        })();
      } else {
        console.log('请提供要爬取的URL');
      }
      break;
      
    case 'recent':
      (async () => {
        const app = new SpiderApp();
        try {
          await app.init();
          const limit = parseInt(args[1]) || 10;
          const data = await app.getRecentData(limit);
          data.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title} - ${item.sourceUrl}`);
          });
        } finally {
          await app.cleanup();
        }
      })();
      break;
      
    case 'find':
      if (args[1]) {
        (async () => {
          const app = new SpiderApp();
          try {
            await app.init();
            const data = await app.findByUrl(args[1]);
            if (data) {
              console.log('找到数据:', {
                title: data.title,
                url: data.sourceUrl,
                scrapedAt: data.scrapedAt,
                status: data.status
              });
            }
          } finally {
            await app.cleanup();
          }
        })();
      } else {
        console.log('请提供要查找的URL');
      }
      break;
      
    default:
      console.log('未知命令:', command);
      break;
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 优雅退出处理
process.on('SIGINT', async () => {
  console.log('\n收到退出信号，正在清理资源...');
  await disconnectDB();
  process.exit(0);
});

// 如果直接运行此文件，则处理命令行参数
if (require.main === module) {
  handleCommandLine();
}

// 导出应用类供其他模块使用
module.exports = SpiderApp;