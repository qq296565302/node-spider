> 爬取懂球帝联赛数据，目标地址`https://www.dongqiudi.com/data/{leagueID}`，可以获取联赛球队信息，包括名称、积分等。

### 字段说明

> 字段名称 | 类型 | 描述
> --- | --- | ---
> `leagueID` | 字符串 | 联赛ID
> `name` | 字符串 | 联赛名称
> `teams` | 数组 | 球队列表
> `teams.name` | 字符串 | 球队名称
> `teams.points` | 数字 | 球队积分