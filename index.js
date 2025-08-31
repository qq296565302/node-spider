const { connectDB, disconnectDB } = require('./config/database');
const NuxtScraper = require('./spider/NuxtScraper');
const { spiderLeague } = require('./spider/SpiderLeague');
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
    console.log('  team <url> <leagueName> <filename>  - 爬取球队数据');
    console.log('\n示例:');
    console.log('  node index.js team https://www.dongqiudi.com/data/1 英超 Premier');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'league':
      if (args.length < 2) {
        console.error('错误: 请提供要爬取的URL');
        console.log('用法: node index.js league <url> <leagueName> <filename>');
        process.exit(1);
      }
      spiderLeague(args[1], args[2], args[3]);
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
