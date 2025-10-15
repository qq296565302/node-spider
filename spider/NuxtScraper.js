const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');
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
      Logger.progress(`正在获取页面: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000,
        maxRedirects: 5
      });

      Logger.success(`页面获取成功，状态码: ${response.status}`);
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
      Logger.info('正在提取window.__NUXT__数据...');
      Logger.data('HTML长度', `${html.length} 字符`);

      // 先保存HTML到文件以便调试
      this.saveHtmlForDebug(html);

      // 查找window.__NUXT__的脚本标签 - 支持函数形式
      const nuxtRegex = /window\.__NUXT__\s*=\s*([\s\S]*?);?\s*<\/script>/i;
      const match = html.match(nuxtRegex);

      if (!match) {
        Logger.warn('未找到window.__NUXT__数据，尝试其他模式...');

        // 尝试更宽松的匹配模式
        const alternativeRegex = /__NUXT__\s*=\s*([\s\S]*?);/i;
        const altMatch = html.match(alternativeRegex);

        if (!altMatch) {
          // 尝试查找任何包含NUXT的脚本
          const nuxtScriptRegex = /<script[^>]*>[\s\S]*?NUXT[\s\S]*?<\/script>/gi;
          const nuxtScripts = html.match(nuxtScriptRegex);

          if (nuxtScripts) {
            Logger.info(`找到 ${nuxtScripts.length} 个包含NUXT的脚本标签`);
            nuxtScripts.forEach((script, index) => {
              Logger.debug(`脚本 ${index + 1} 片段:`, script.substring(0, 200) + '...');
            });
          }

          // 尝试查找任何JSON数据
          const jsonRegex = /({[\s\S]*?"[^"]*"[\s\S]*?})/g;
          const jsonMatches = html.match(jsonRegex);

          if (jsonMatches) {
            Logger.info(`找到 ${jsonMatches.length} 个可能的JSON数据块`);
            // 尝试解析前几个JSON块
            for (let i = 0; i < Math.min(3, jsonMatches.length); i++) {
              try {
                const parsed = JSON.parse(jsonMatches[i]);
                if (parsed && typeof parsed === 'object') {
                  Logger.debug(`JSON块 ${i + 1} 解析成功，包含键:`, Object.keys(parsed).slice(0, 5));
                  if (Object.keys(parsed).some(key => key.toLowerCase().includes('data') || key.toLowerCase().includes('state'))) {
                    Logger.success('发现可能的数据块，尝试使用此数据');
                    return parsed;
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }

          Logger.error('未找到任何NUXT数据');
          return null;
        }

        Logger.success('找到替代模式的NUXT数据');
        return await this.parseNuxtData(altMatch[1]);
      }

      Logger.success('找到window.__NUXT__数据');
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
      Logger.info(`调试HTML已保存到: ${debugPath}`);
    } catch (error) {
      Logger.error('保存调试HTML失败:', error.message);
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

      Logger.debug('原始NUXT数据片段:', cleanData.substring(0, 300) + '...');

      // 检查是否是函数形式
      if (cleanData.startsWith('(function(')) {
        Logger.info('检测到函数形式的NUXT数据，尝试执行...');

        try {
          // 创建一个安全的执行环境
          const result = this.executeFunctionString(cleanData);
          if (result) {
            Logger.success('函数执行成功，返回数据');
            return result;
          }
        } catch (funcError) {
          Logger.warn('函数执行失败，尝试其他方法:', funcError.message);
        }

        // 如果函数执行失败，尝试提取函数内的返回值
        const returnMatch = cleanData.match(/return\s+({[\s\S]*?})\s*\}\)\([^)]*\)/);
        if (returnMatch) {
          Logger.info('尝试提取函数返回值...');
          try {
            const returnData = JSON.parse(returnMatch[1]);
            Logger.success('函数返回值解析成功');
            return returnData;
          } catch (returnError) {
            Logger.warn('函数返回值解析失败:', returnError.message);
          }
        }
      }

      // 尝试直接解析为JSON
      try {
        const parsedData = JSON.parse(cleanData);
        Logger.success('直接JSON解析成功');
        return parsedData;
      } catch (jsonError) {
        Logger.warn('直接JSON解析失败:', jsonError.message);
      }

      // 如果都失败了，保存原始数据供分析
      await this.saveRawData(cleanData);

      return null;
    } catch (error) {
      Logger.error('解析NUXT数据时出错:', error.message);
      Logger.debug('原始数据片段:', dataString.substring(0, 200) + '...');
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
      Logger.warn('警告：使用eval执行函数，仅用于测试目的');
      const result = eval(`(${functionString})`);
      return result;
    } catch (error) {
      Logger.error('函数执行失败:', error.message);
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
      Logger.info(`原始NUXT数据已保存到: ${rawPath}`);
    } catch (error) {
      Logger.error('保存原始数据失败:', error.message);
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

      Logger.success(`数据已保存到: ${filePath}`);
      Logger.info(`文件大小: ${(jsonString.length / 1024).toFixed(2)} KB`);

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
      Logger.warn('没有数据可分析');
      return;
    }

    Logger.info('\n=== NUXT数据结构分析 ===');
    Logger.data('数据类型:', typeof data);

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      Logger.data('顶级键数量:', keys.length);
      Logger.data('顶级键列表:', keys.slice(0, 10)); // 只显示前10个键

      // 分析每个顶级键的数据类型
      keys.slice(0, 5).forEach(key => {
        const value = data[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const size = Array.isArray(value) ? value.length :
          typeof value === 'object' && value !== null ? Object.keys(value).length :
            typeof value === 'string' ? value.length : 'N/A';

        Logger.data(`  ${key}: ${type} (size: ${size})`);
      });
    }

    Logger.info('========================\n');
  }

  /**
   * 主要的爬取方法
   * @param {string} url - 目标URL
   * @param {string} filename - 保存的文件名
   * @returns {Promise<Object>} 爬取结果
   */
  async scrape(url, filename) {
    try {
      Logger.info('开始爬取Nuxt网站数据...');

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
      let filePath = '';
      if (filename) {
        filePath = await this.saveToJson(nuxtData, filename);
      }

      Logger.success('爬取完成！');

      return {
        success: true,
        dataExtracted: true,
        filePath: filePath || false,
        data: nuxtData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      Logger.error('爬取失败:', error.message);

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = NuxtScraper;