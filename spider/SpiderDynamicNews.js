const NuxtScraper = require('./NuxtScraper');
const { connectDB, disconnectDB, saveToCollection } = require('../config/database');

/**
 * * 爬取动态新闻
 */

async function spiderDynamicNews(url) {
    const app = new NuxtScraper();
    try {
        await connectDB();
        console.log('开始爬取动态新闻数据...');
        const result = await app.scrape(url, 'dynamicNews.json');
        return result.data.data[0].newData.title
    } catch {

    } finally {
        await disconnectDB();
    }
}

module.exports = {
    spiderDynamicNews
}