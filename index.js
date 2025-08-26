const { connectDB, disconnectDB } = require('./config/database');
const NuxtScraper = require('./spider/NuxtScraper');
const ScrapedData = require('./models/ScrapedData');
require('dotenv').config();

/**
 * 主应用程序类 - 专门用于Nuxt框架网站爬取
 */
class NuxtSpiderApp {
  constructor() {
    this.scraper = new NuxtScraper();
  }

  /**
   * 初始化应用程序
   */
  async init() {
    try {
      console.log('正在初始化Nuxt爬虫应用程序...');
      await connectDB();
      console.log('Nuxt爬虫应用程序初始化完成');
    } catch (error) {
      console.error('初始化失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 爬取Nuxt网站数据并保存到JSON文件
   * @param {string} url - 目标URL
   * @param {string} filename - 保存的文件名（可选）
   */
  async scrapeNuxtSite(url, filename) {
    try {
      console.log(`开始爬取Nuxt网站: ${url}`);
      const result = await this.scraper.scrape(url, filename);
      
      if (result.success) {
        console.log('爬取成功，数据已保存到:', result.filePath);
        
        // 可选：同时保存到数据库
        if (process.env.SAVE_TO_DB === 'true') {
          await this.saveToDatabase(url, result);
        }
      }
      
      return result;
    } catch (error) {
      console.error('爬取失败:', error.message);
      throw error;
    }
  }

  /**
   * 将爬取结果保存到数据库
   * @param {string} url - 源URL
   * @param {Object} result - 爬取结果
   */
  async saveToDatabase(url, result) {
    try {
      const scrapedData = new ScrapedData({
        sourceUrl: url,
        title: `Nuxt数据 - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify(result.data || {}),
        customData: {
          dataKeys: result.dataKeys || [],
          filePath: result.filePath,
          extractedAt: result.timestamp
        },
        status: 'success'
      });
      
      await scrapedData.save();
      console.log('数据已保存到数据库');
      return scrapedData;
    } catch (error) {
      console.error('保存到数据库失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取最近的爬取记录
   * @param {number} limit - 限制数量
   */
  async getRecentData(limit = 10) {
    try {
      const data = await ScrapedData.getRecent(limit);
      console.log(`获取到 ${data.length} 条最近的记录`);
      return data;
    } catch (error) {
      console.error('获取数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 根据URL查找爬取记录
   * @param {string} url - 目标URL
   */
  async findByUrl(url) {
    try {
      const data = await ScrapedData.findByUrl(url);
      if (data) {
        console.log(`找到URL ${url} 的爬取记录`);
      } else {
        console.log(`未找到URL ${url} 的爬取记录`);
      }
      return data;
    } catch (error) {
      console.error('查找数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    try {
      await disconnectDB();
      console.log('应用程序已清理完成');
    } catch (error) {
      console.error('清理失败:', error.message);
    }
  }
}

/**
 * 示例使用函数
 */
async function example() {
  const app = new NuxtSpiderApp();
  
  try {
    // 初始化应用
    await app.init();
    
    // 爬取懂球帝数据页面
    console.log('\n=== 开始爬取懂球帝Nuxt数据 ===');
    const result = await app.scrapeNuxtSite(
      'https://www.dongqiudi.com/data/1',
      'dongqiudi-data.json'
    );
    
    if (result.success) {
      console.log('\n✅ 爬取成功！');
      console.log('数据文件:', result.filePath);
      console.log('数据键:', result.dataKeys);
    } else {
      console.log('\n❌ 爬取失败:', result.error);
    }
    
    // 如果启用了数据库保存，查看最近的记录
    if (process.env.SAVE_TO_DB === 'true') {
      console.log('\n=== 最近的爬取记录 ===');
      const recentData = await app.getRecentData(5);
      recentData.forEach((item, index) => {
        console.log(`${index + 1}. ${item.sourceUrl} - ${item.scrapedAt}`);
      });
    }
    
  } catch (error) {
    console.error('示例执行失败:', error.message);
  } finally {
    await app.cleanup();
  }
}

/**
 * 处理命令行参数
 */
function handleCommandLine() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n=== Nuxt爬虫工具使用说明 ===');
    console.log('用法:');
    console.log('  node index.js <command> [options]');
    console.log('\n命令:');
    console.log('  scrape <url> [filename]  - 爬取指定Nuxt网站');
    console.log('  example                  - 运行示例（爬取懂球帝）');
    console.log('  recent [limit]           - 查看最近的爬取记录');
    console.log('  find <url>               - 查找指定URL的记录');
    console.log('\n示例:');
    console.log('  node index.js scrape https://www.dongqiudi.com/data/1');
    console.log('  node index.js scrape https://www.dongqiudi.com/data/1 my-data.json');
    console.log('  node index.js example');
    console.log('  node index.js recent 10');
    console.log('  node index.js find https://www.dongqiudi.com/data/1');
    console.log('\n环境变量:');
    console.log('  SAVE_TO_DB=true          - 同时保存到MongoDB数据库');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'scrape':
      if (args.length < 2) {
        console.error('错误: 请提供要爬取的URL');
        console.log('用法: node index.js scrape <url> [filename]');
        process.exit(1);
      }
      handleScrapeCommand(args[1], args[2]);
      break;
      
    case 'example':
      example();
      break;
      
    case 'recent':
      const limit = args[1] ? parseInt(args[1]) : 10;
      handleRecentCommand(limit);
      break;
      
    case 'find':
      if (args.length < 2) {
        console.error('错误: 请提供要查找的URL');
        console.log('用法: node index.js find <url>');
        process.exit(1);
      }
      handleFindCommand(args[1]);
      break;
      
    default:
      console.error(`未知命令: ${command}`);
      console.log('使用 "node index.js" 查看帮助信息');
      process.exit(1);
  }
}

/**
 * 处理爬取命令
 */
async function handleScrapeCommand(url, filename) {
  const app = new NuxtSpiderApp();
  
  try {
    await app.init();
    const result = await app.scrapeNuxtSite(url, filename);
    
    if (result.success) {
      console.log('\n✅ 爬取成功！');
      console.log('数据文件:', result.filePath);
    } else {
      console.log('\n❌ 爬取失败:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('爬取过程出错:', error.message);
    process.exit(1);
  } finally {
    await app.cleanup();
  }
}

/**
 * 处理查看最近记录命令
 */
async function handleRecentCommand(limit) {
  const app = new NuxtSpiderApp();
  
  try {
    await app.init();
    const data = await app.getRecentData(limit);
    
    if (data.length === 0) {
      console.log('没有找到爬取记录');
    } else {
      console.log(`\n最近 ${data.length} 条爬取记录:`);
      data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.sourceUrl}`);
        console.log(`   时间: ${item.scrapedAt}`);
        console.log(`   状态: ${item.status}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('获取记录失败:', error.message);
    process.exit(1);
  } finally {
    await app.cleanup();
  }
}

/**
 * 处理查找URL记录命令
 */
async function handleFindCommand(url) {
  const app = new NuxtSpiderApp();
  
  try {
    await app.init();
    const data = await app.findByUrl(url);
    
    if (data) {
      console.log('\n找到记录:');
      console.log('URL:', data.sourceUrl);
      console.log('标题:', data.title);
      console.log('爬取时间:', data.scrapedAt);
      console.log('状态:', data.status);
      if (data.customData) {
        console.log('数据键:', data.customData.dataKeys);
        console.log('文件路径:', data.customData.filePath);
      }
    } else {
      console.log('\n未找到该URL的爬取记录');
    }
  } catch (error) {
    console.error('查找记录失败:', error.message);
    process.exit(1);
  } finally {
    await app.cleanup();
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', async () => {
  console.log('\n正在退出...');
  process.exit(0);
});

// 如果直接运行此文件，则处理命令行参数
if (require.main === module) {
  handleCommandLine();
}

module.exports = NuxtSpiderApp;