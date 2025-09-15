const { connectDB, disconnectDB } = require('./config/database');
const NuxtScraper = require('./spider/NuxtScraper');
const { spiderLeague } = require('./spider/SpiderLeague');
const { spiderDynamicNews } = require('./spider/SpiderDynamicNews');
const { leagues } = require('./config/league');
const { createServer } = require('./server');
require('dotenv').config();

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
    console.log('  league                              - 爬取联赛数据');
    console.log('  dynamicNews <url>                   - 爬取动态新闻');
    console.log('  server [port]                       - 启动HTTP服务器');
    console.log('\n示例:');
    console.log('  node index.js league');
    console.log('  node index.js dynamicNews https://example.com');
    console.log('  node index.js server 3000');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'league':
      spiderLeague(leagues);
      break;
    case 'dynamicNews':
      spiderDynamicNews(args[1]);
      break;
    case 'server':
      const port = args[1] ? parseInt(args[1]) : 3000;
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error('无效的端口号，请使用1-65535之间的数字');
        process.exit(1);
      }
      createServer(port);
      break;
    default:
      console.error(`未知命令: ${command}`);
      console.log('使用 "node index.js" 查看帮助信息');
      process.exit(1);
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
