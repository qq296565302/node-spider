const http = require('http');
const url = require('url');
const { connectDB, disconnectDB } = require('./config/database');
const { spiderLeague } = require('./spider/SpiderLeague');
const { spiderDynamicNews } = require('./spider/SpiderDynamicNews');
const { leagues } = require('./config/league');
require('dotenv').config();

/**
 * 解析请求体数据
 * @param {http.IncomingMessage} req - HTTP请求对象
 * @returns {Promise<Object>} 解析后的JSON数据
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * 发送JSON响应
 * @param {http.ServerResponse} res - HTTP响应对象
 * @param {number} statusCode - HTTP状态码
 * @param {Object} data - 响应数据
 */
function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * 处理CORS预检请求
 * @param {http.ServerResponse} res - HTTP响应对象
 */
function handleCors(res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end();
}


/**
 * 爬取动态新闻API
 * @param {http.IncomingMessage} req - HTTP请求对象
 * @param {http.ServerResponse} res - HTTP响应对象
 */
async function handleDynamicNewsSpider(req, res) {
  try {
    // 解析URL查询参数
    const parsedUrl = url.parse(req.url, true);
    const { articleId } = parsedUrl.query;
    if (!articleId) {
      return sendJsonResponse(res, 400, {
        success: false,
        message: '缺少必要参数: articleId（可通过GET查询参数传递）',
        timestamp: new Date().toISOString()
      });
    }
    const newsUrl = `https://www.dongqiudi.com/articles/${articleId}`;
    console.log('开始爬取动态新闻:', newsUrl);
    const result = await spiderDynamicNews(newsUrl);

    sendJsonResponse(res, 200, {
      success: true,
      message: '动态新闻爬取完成',
      url: newsUrl,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('爬取动态新闻失败:', error.message);
    sendJsonResponse(res, 500, {
      success: false,
      message: '爬取动态新闻失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 爬取联赛数据API
 * @param {http.IncomingMessage} req - HTTP请求对象
 * @param {http.ServerResponse} res - HTTP响应对象
 */
async function handleLeagueSpider(req, res) {
  try {
    // 解析URL查询参数
    const parsedUrl = url.parse(req.url, true);
    const queryParams = parsedUrl.query;
    // 解析请求体参数
    const body = await parseRequestBody(req);
    console.log('请求体数据:', body);
    console.log('查询参数:', queryParams);

    // 优先使用请求体中的参数，如果没有则使用查询参数
    const leagueIds = body.leagueIds || queryParams.leagueIds;

    let targetLeagues = leagues; // 默认使用所有联赛

    // 如果指定了联赛ID，则过滤联赛
    if (leagueIds) {
      const ids = Array.isArray(leagueIds) ? leagueIds : leagueIds.split(',');
      targetLeagues = leagues.filter(league => {
        // 从URL中提取联赛ID进行匹配
        const urlMatch = league.url.match(/\/data\/(\d+)/);
        const leagueId = urlMatch ? urlMatch[1] : null;
        return ids.includes(leagueId);
      });

      if (targetLeagues.length === 0) {
        return sendJsonResponse(res, 400, {
          success: false,
          message: '未找到指定的联赛ID',
          availableLeagues: leagues.map(l => {
            const urlMatch = l.url.match(/\/data\/(\d+)/);
            return {
              id: urlMatch ? urlMatch[1] : null,
              name: l.leagueName,
              url: l.url
            };
          }),
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`开始爬取联赛数据，共 ${targetLeagues.length} 个联赛`);
    await spiderLeague(targetLeagues);

    sendJsonResponse(res, 200, {
      success: true,
      message: '联赛数据爬取完成',
      leaguesCount: targetLeagues.length,
      leagues: targetLeagues.map(l => l.leagueName),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('爬取联赛数据失败:', error.message);
    sendJsonResponse(res, 500, {
      success: false,
      message: '爬取联赛数据失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 获取系统状态API
 * @param {http.IncomingMessage} req - HTTP请求对象
 * @param {http.ServerResponse} res - HTTP响应对象
 */
function handleStatus(req, res) {
  sendJsonResponse(res, 200, {
    success: true,
    message: 'Nuxt爬虫服务运行正常',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    availableEndpoints: [
      'GET /status - 获取服务状态',
      'GET/POST /api/spider/league - 爬取联赛数据',
      'GET /api/spider/article - 爬取动态新闻'
    ]
  });
}

/**
 * 处理404错误
 * @param {http.ServerResponse} res - HTTP响应对象
 */
function handle404(res) {
  sendJsonResponse(res, 404, {
    success: false,
    message: '接口不存在',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /status',
      'GET/POST /api/spider/league',
      'GET/POST /api/spider/news'
    ]
  });
}

/**
 * 获取本机IP地址
 * @returns {string} 本机IP地址
 */
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // 跳过内部地址和非IPv4地址
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

/**
 * 创建HTTP服务器
 * @param {number} port - 服务器端口
 * @returns {http.Server} HTTP服务器实例
 */
function createServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname } = parsedUrl;
    const method = req.method;

    console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

    // 处理CORS预检请求
    if (method === 'OPTIONS') {
      return handleCors(res);
    }

    // 路由处理
    try {
      switch (true) {
        case pathname === '/status' && method === 'GET':
          handleStatus(req, res);
          break;

        case pathname === '/api/spider/league' && (method === 'POST' || method === 'GET'):
          await handleLeagueSpider(req, res);
          break;

        case pathname === '/api/spider/article' && method === 'GET':
          await handleDynamicNewsSpider(req, res);
          break;

        default:
          handle404(res);
          break;
      }
    } catch (error) {
      console.error('服务器内部错误:', error);
      sendJsonResponse(res, 500, {
        success: false,
        message: '服务器内部错误',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 服务器错误处理
  server.on('error', (error) => {
    console.error('服务器错误:', error);
  });

  // 启动服务器，监听所有网络接口
  server.listen(port, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`\n=== Nuxt爬虫HTTP服务已启动 ===`);
    console.log(`本地访问: http://localhost:${port}`);
    console.log(`局域网访问: http://${localIP}:${port}`);
    console.log(`状态检查: http://${localIP}:${port}/status`);
    console.log(`\n可用接口:`);
    console.log(`  GET  /status                - 获取服务状态`);
    console.log(`  GET/POST /api/spider/league - 爬取联赛数据`);
    console.log(`  GET/POST /api/spider/news   - 爬取动态新闻`);
    console.log(`\n按 Ctrl+C 停止服务\n`);
  });

  return server;
}

// 优雅退出处理
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  try {
    await disconnectDB();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接时出错:', error.message);
  }
  process.exit(0);
});

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

module.exports = { createServer };

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer(port);
}