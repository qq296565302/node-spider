const NuxtScraper = require('./NuxtScraper');
const { connectDB, disconnectDB, saveToCollection } = require('../config/database');

/**
 * 爬取团队数据的函数
 * @param {string} url - 目标URL
 * @param {string} leagueName - 联赛名称
 * @param {string} filename - 保存的文件名
 */
async function spiderLeague(url, leagueName, filename) {
    const app = new NuxtScraper();
    try {
        await connectDB();
        const result = await app.scrape(url, filename);
        const data = result.data.data[1].standingData.content.rounds[0].content.data;
        for (const item of data) {
            await saveToCollection('teams', {
                rank: Number(item.rank) || '-',
                team_name: item.team_name || '-',
                team_logo: item.team_logo || '-',
                team_id: item.team_id,
                scheme: item.scheme || '-',
                league: leagueName,
                matches_total: item.matches_total || '-',
                matches_won: item.matches_won || '-',
                matches_draw: item.matches_draw || '-',
                matches_lost: item.matches_lost || '-',
                goals_pro: item.goals_pro || '-',
                goals_against: item.goals_against || '-',
                points: item.points || '-',
            }, 'team_id');
        }
    } catch (error) {
        console.error('爬取失败:', error.message);
    } finally {
        await disconnectDB();
    }
}

module.exports = { spiderLeague };