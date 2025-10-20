const { spiderLeague } = require('./spider/SpiderLeague');
const { createServer } = require('./server');
const Logger = require('./utils/logger');
require('dotenv').config();

/**
 * 处理命令行参数
 */
function handleCommandLine() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 显示美化的帮助信息
    Logger.banner('Nuxt爬虫工具', 'v1.0.0');

    Logger.separator('使用说明', 'cyan');
    Logger.info('用法: node index.js <command> [options]');

    Logger.separator('可用命令', 'blue');
    Logger.info('league', '爬取联赛数据');
    Logger.info('dynamicNews <url>', '爬取动态新闻');
    Logger.info('server [port]', '启动HTTP服务器 (默认端口: 3000)');

    Logger.separator('使用示例', 'green');
    Logger.info('📌 node index.js league');
    Logger.info('📌 node index.js dynamicNews https://example.com');
    Logger.info('📌 node index.js server 3000');

    Logger.separator('', 'gray');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'league':
      // 调用爬取联赛数据的函数
      spiderLeague();
      break;
    case 'dynamicNews':
      spiderDynamicNews(args[1]);
      break;
    case 'server':
      const port = args[1] ? parseInt(args[1]) : 3000;
      if (isNaN(port) || port < 1 || port > 65535) {
        Logger.error('无效的端口号，请使用1-65535之间的数字');
        process.exit(1);
      }
      createServer(port);
      break;
    default:
      Logger.error(`未知命令: ${command}`);
      Logger.info('使用 "node index.js" 查看帮助信息');
      process.exit(1);
  }
}


// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  Logger.error('未捕获的异常:', error);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', async () => {
  Logger.warn('\n正在退出...');
  process.exit(0);
});

// 如果直接运行此文件，则处理命令行参数
if (require.main === module) {
  handleCommandLine();
}
