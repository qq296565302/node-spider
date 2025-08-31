const NuxtScraper = require('./NuxtScraper');
const { connectDB, disconnectDB, saveToCollection } = require('../config/database');
const { leagues: defaultLeagues } = require('../config/league');

/**
 * 爬取联赛数据的函数
 * @param {Array} leagues - 联赛配置数组（可选，默认使用配置文件中的联赛）
 */
async function spiderLeague(leagues = defaultLeagues) {
    const app = new NuxtScraper();
    try {
        await connectDB();
        console.log('开始爬取联赛数据，共', leagues.length, '个联赛');

        // 使用for...of循环来正确处理异步操作
        for (const league of leagues) {
            const { url, leagueName, filename } = league;
            console.log(`正在爬取 ${leagueName} 数据...`);

            try {
                const result = await app.scrape(url, filename);

                if (!result.success) {
                    console.error(`爬取 ${leagueName} 失败:`, result.error);
                    continue;
                }

                const data = result.data.data[1].standingData.content.rounds[0].content.data;
                console.log(`${leagueName} 获取到 ${data.length} 支球队数据`);
                let tables = [];
                for (const item of data) {
                    tables.push({
                        rank: Number(item.rank) || '-',
                        team_name: item.team_name || '-',
                        team_logo: item.team_logo || '-',
                        team_id: item.team_id,
                        scheme: item.scheme || '-',
                        matches_total: item.matches_total || '-',
                        matches_won: item.matches_won || '-',
                        matches_draw: item.matches_draw || '-',
                        matches_lost: item.matches_lost || '-',
                        goals_pro: item.goals_pro || '-',
                        goals_against: item.goals_against || '-',
                        points: item.points || '-',
                    })
                }
                await saveToCollection('league', {
                    league: leagueName,
                    table: tables,
                }, 'league');
                console.log(`${leagueName} 数据保存完成`);
            } catch (leagueError) {
                console.error(`处理 ${leagueName} 时出错:`, leagueError.message);
            }
        }

    } catch (error) {
        console.error('爬取失败:', error.message);
    } finally {
        await disconnectDB();
    }
}

module.exports = { spiderLeague };