const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * 专门用于爬取Nuxt框架网站的测试脚本
 * 提取window.__NUXT__数据并保存为JSON文件
 */
class NuxtScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * 获取网页HTML内容
   * @param {string} url - 目标URL
   * @returns {Promise<string>} HTML内容
   */
  async fetchPage(url) {
    try {
      console.log(`正在获取页面: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      console.log(`页面获取成功，状态码: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error('获取页面失败:', error.message);
      throw error;
    }
  }

  /**
   * 从HTML中提取window.__NUXT__数据
   * @param {string} html - HTML内容
   * @returns {Object|null} 提取的NUXT数据
   */
  async extractNuxtData(html) {
    try {
      console.log('正在提取window.__NUXT__数据...');
      console.log('HTML长度:', html.length);
      
      // 先保存HTML到文件以便调试
      this.saveHtmlForDebug(html);
      
      // 查找window.__NUXT__的脚本标签 - 支持函数形式
      const nuxtRegex = /window\.__NUXT__\s*=\s*([\s\S]*?);?\s*<\/script>/i;
      const match = html.match(nuxtRegex);
      
      if (!match) {
        console.log('未找到window.__NUXT__数据，尝试其他模式...');
        
        // 尝试更宽松的匹配模式
        const alternativeRegex = /__NUXT__\s*=\s*([\s\S]*?);/i;
        const altMatch = html.match(alternativeRegex);
        
        if (!altMatch) {
          // 尝试查找任何包含NUXT的脚本
          const nuxtScriptRegex = /<script[^>]*>[\s\S]*?NUXT[\s\S]*?<\/script>/gi;
          const nuxtScripts = html.match(nuxtScriptRegex);
          
          if (nuxtScripts) {
            console.log(`找到 ${nuxtScripts.length} 个包含NUXT的脚本标签`);
            nuxtScripts.forEach((script, index) => {
              console.log(`脚本 ${index + 1} 片段:`, script.substring(0, 200) + '...');
            });
          }
          
          // 尝试查找任何JSON数据
          const jsonRegex = /({[\s\S]*?"[^"]*"[\s\S]*?})/g;
          const jsonMatches = html.match(jsonRegex);
          
          if (jsonMatches) {
            console.log(`找到 ${jsonMatches.length} 个可能的JSON数据块`);
            // 尝试解析前几个JSON块
            for (let i = 0; i < Math.min(3, jsonMatches.length); i++) {
              try {
                const parsed = JSON.parse(jsonMatches[i]);
                if (parsed && typeof parsed === 'object') {
                  console.log(`JSON块 ${i + 1} 解析成功，包含键:`, Object.keys(parsed).slice(0, 5));
                  if (Object.keys(parsed).some(key => key.toLowerCase().includes('data') || key.toLowerCase().includes('state'))) {
                    console.log('发现可能的数据块，尝试使用此数据');
                    return parsed;
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
          
          console.log('未找到任何NUXT数据');
          return null;
        }
        
        console.log('找到替代模式的NUXT数据');
        return await this.parseNuxtData(altMatch[1]);
      }
      
      console.log('找到window.__NUXT__数据');
      return await this.parseNuxtData(match[1]);
      
    } catch (error) {
      console.error('提取NUXT数据时出错:', error.message);
      return null;
    }
  }

  /**
   * 保存HTML到文件用于调试
   * @param {string} html - HTML内容
   */
  async saveHtmlForDebug(html) {
    try {
      const debugPath = path.join(__dirname, 'debug-page.html');
      await fs.writeFile(debugPath, html, 'utf8');
      console.log(`调试HTML已保存到: ${debugPath}`);
    } catch (error) {
      console.log('保存调试HTML失败:', error.message);
    }
  }

  /**
   * 解析NUXT数据字符串为JSON对象
   * @param {string} dataString - NUXT数据字符串
   * @returns {Object|null} 解析后的数据对象
   */
  async parseNuxtData(dataString) {
    try {
      // 清理数据字符串
      let cleanData = dataString.trim();
      
      // 移除末尾的分号（如果有）
      if (cleanData.endsWith(';')) {
        cleanData = cleanData.slice(0, -1);
      }
      
      console.log('原始NUXT数据片段:', cleanData.substring(0, 300) + '...');
      
      // 检查是否是函数形式
      if (cleanData.startsWith('(function(')) {
        console.log('检测到函数形式的NUXT数据，尝试执行...');
        
        try {
          // 创建一个安全的执行环境
          const result = this.executeFunctionString(cleanData);
          if (result) {
            console.log('函数执行成功，返回数据');
            return result;
          }
        } catch (funcError) {
          console.log('函数执行失败，尝试其他方法:', funcError.message);
        }
        
        // 如果函数执行失败，尝试提取函数内的返回值
        const returnMatch = cleanData.match(/return\s+({[\s\S]*?})\s*\}\)\([^)]*\)/);
        if (returnMatch) {
          console.log('尝试提取函数返回值...');
          try {
            const returnData = JSON.parse(returnMatch[1]);
            console.log('函数返回值解析成功');
            return returnData;
          } catch (returnError) {
            console.log('函数返回值解析失败:', returnError.message);
          }
        }
      }
      
      // 尝试直接解析为JSON
      try {
        const parsedData = JSON.parse(cleanData);
        console.log('直接JSON解析成功');
        return parsedData;
      } catch (jsonError) {
        console.log('直接JSON解析失败:', jsonError.message);
      }
      
      // 如果都失败了，保存原始数据供分析
      await this.saveRawData(cleanData);
      
      return null;
    } catch (error) {
      console.error('解析NUXT数据时出错:', error.message);
      console.log('原始数据片段:', dataString.substring(0, 200) + '...');
      return null;
    }
  }

  /**
   * 执行函数字符串
   * @param {string} functionString - 函数字符串
   * @returns {Object|null} 执行结果
   */
  executeFunctionString(functionString) {
    try {
      // 这是一个简化的方法，实际情况可能需要更复杂的处理
      // 注意：eval是危险的，这里仅用于测试
      console.log('警告：使用eval执行函数，仅用于测试目的');
      const result = eval(`(${functionString})`);
      return result;
    } catch (error) {
      console.log('函数执行失败:', error.message);
      return null;
    }
  }

  /**
   * 保存原始数据供分析
   * @param {string} rawData - 原始数据
   */
  async saveRawData(rawData) {
    try {
      const rawPath = path.join(__dirname, 'raw-nuxt-data.txt');
      await fs.writeFile(rawPath, rawData, 'utf8');
      console.log(`原始NUXT数据已保存到: ${rawPath}`);
    } catch (error) {
      console.log('保存原始数据失败:', error.message);
    }
  }

  /**
   * 保存数据到JSON文件
   * @param {Object} data - 要保存的数据
   * @param {string} filename - 文件名
   * @returns {Promise<string>} 保存的文件路径
   */
  async saveToJson(data, filename = 'nuxt-data.json') {
    try {
      const filePath = path.join(__dirname, filename);
      
      // 创建包含元数据的完整数据对象
      const fullData = {
        extractedAt: new Date().toISOString(),
        sourceUrl: 'https://www.dongqiudi.com/data/1',
        dataType: 'window.__NUXT__',
        data: data
      };
      
      // 格式化JSON并保存
      const jsonString = JSON.stringify(fullData, null, 2);
      await fs.writeFile(filePath, jsonString, 'utf8');
      
      console.log(`数据已保存到: ${filePath}`);
      console.log(`文件大小: ${(jsonString.length / 1024).toFixed(2)} KB`);
      
      return filePath;
    } catch (error) {
      console.error('保存文件失败:', error.message);
      throw error;
    }
  }

  /**
   * 分析NUXT数据结构
   * @param {Object} data - NUXT数据对象
   */
  analyzeData(data) {
    if (!data) {
      console.log('没有数据可分析');
      return;
    }
    
    console.log('\n=== NUXT数据结构分析 ===');
    console.log('数据类型:', typeof data);
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log('顶级键数量:', keys.length);
      console.log('顶级键列表:', keys.slice(0, 10)); // 只显示前10个键
      
      // 分析每个顶级键的数据类型
      keys.slice(0, 5).forEach(key => {
        const value = data[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const size = Array.isArray(value) ? value.length : 
                    typeof value === 'object' && value !== null ? Object.keys(value).length : 
                    typeof value === 'string' ? value.length : 'N/A';
        
        console.log(`  ${key}: ${type} (size: ${size})`);
      });
    }
    
    console.log('========================\n');
  }

  /**
   * 主要的爬取方法
   * @param {string} url - 目标URL
   * @param {string} filename - 保存的文件名
   * @returns {Promise<Object>} 爬取结果
   */
  async scrape(url, filename = 'dongqiudi-nuxt-data.json') {
    try {
      console.log('开始爬取Nuxt网站数据...');
      
      // 获取页面HTML
      const html = await this.fetchPage(url);
      
      // 提取NUXT数据
      const nuxtData = await this.extractNuxtData(html);
      
      if (!nuxtData) {
        throw new Error('未能提取到window.__NUXT__数据');
      }
      
      // 分析数据结构
      this.analyzeData(nuxtData);
      
      // 保存到JSON文件
      const filePath = await this.saveToJson(nuxtData, filename);
      
      console.log('爬取完成！');
      
      return {
        success: true,
        dataExtracted: true,
        filePath: filePath,
        dataKeys: Object.keys(nuxtData || {}),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('爬取失败:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * 主函数 - 执行爬取任务
 */
async function main() {
  const scraper = new NuxtScraper();
  const targetUrl = 'https://www.dongqiudi.com/data/1';
  
  console.log('=== 懂球帝Nuxt数据爬取测试 ===');
  console.log(`目标URL: ${targetUrl}`);
  console.log('开始时间:', new Date().toLocaleString());
  console.log('================================\n');
  
  const result = await scraper.scrape(targetUrl);
  
  console.log('\n=== 爬取结果 ===');
  console.log(JSON.stringify(result, null, 2));
  console.log('================\n');
  
  if (result.success) {
    console.log('✅ 爬取成功！数据已保存到JSON文件中。');
  } else {
    console.log('❌ 爬取失败，请检查错误信息。');
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = NuxtScraper;