const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const delay = require('delay');
const ScrapedData = require('../models/ScrapedData');
require('dotenv').config();

/**
 * 网页爬虫类
 */
class WebScraper {
  constructor(options = {}) {
    this.options = {
      delay: parseInt(process.env.REQUEST_DELAY) || 1000,
      maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
      timeout: parseInt(process.env.TIMEOUT) || 10000,
      useRandomUserAgent: process.env.USE_RANDOM_USER_AGENT === 'true',
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 5,
      ...options
    };
    
    this.activeRequests = 0;
    this.requestQueue = [];
  }

  /**
   * 获取随机User-Agent
   * @returns {string} User-Agent字符串
   */
  getRandomUserAgent() {
    if (this.options.useRandomUserAgent) {
      const userAgent = new UserAgent();
      return userAgent.toString();
    }
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * 发送HTTP请求获取网页内容
   * @param {string} url - 目标URL
   * @param {number} retryCount - 重试次数
   * @returns {Promise<string>} 网页HTML内容
   */
  async fetchPage(url, retryCount = 0) {
    try {
      console.log(`正在抓取: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: this.options.timeout,
        maxRedirects: 5
      });

      return response.data;
    } catch (error) {
      console.error(`抓取失败 (${retryCount + 1}/${this.options.maxRetries}): ${url}`, error.message);
      
      if (retryCount < this.options.maxRetries - 1) {
        await delay(this.options.delay * (retryCount + 1)); // 递增延迟
        return this.fetchPage(url, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * 解析HTML内容
   * @param {string} html - HTML内容
   * @param {string} url - 源URL
   * @returns {Object} 解析后的数据
   */
  parseContent(html, url) {
    const $ = cheerio.load(html);
    
    // 提取基本信息
    const title = $('title').text().trim() || $('h1').first().text().trim() || '无标题';
    
    // 提取主要内容（移除脚本和样式）
    $('script, style, nav, header, footer, aside').remove();
    const content = $('body').text().replace(/\s+/g, ' ').trim();
    
    // 提取链接
    const links = [];
    $('a[href]').each((i, elem) => {
      const linkText = $(elem).text().trim();
      const linkUrl = $(elem).attr('href');
      if (linkText && linkUrl) {
        links.push({
          text: linkText,
          url: this.resolveUrl(linkUrl, url)
        });
      }
    });
    
    // 提取图片
    const images = [];
    $('img[src]').each((i, elem) => {
      const alt = $(elem).attr('alt') || '';
      const src = $(elem).attr('src');
      if (src) {
        images.push({
          alt: alt.trim(),
          src: this.resolveUrl(src, url)
        });
      }
    });
    
    return {
      title,
      content: content.substring(0, 10000), // 限制内容长度
      links: links.slice(0, 50), // 限制链接数量
      images: images.slice(0, 20), // 限制图片数量
      sourceUrl: url,
      customData: {
        linkCount: links.length,
        imageCount: images.length,
        contentLength: content.length
      }
    };
  }

  /**
   * 解析相对URL为绝对URL
   * @param {string} relativeUrl - 相对URL
   * @param {string} baseUrl - 基础URL
   * @returns {string} 绝对URL
   */
  resolveUrl(relativeUrl, baseUrl) {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch (error) {
      return relativeUrl;
    }
  }

  /**
   * 保存数据到数据库
   * @param {Object} data - 要保存的数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveData(data) {
    try {
      const scrapedData = new ScrapedData(data);
      const savedData = await scrapedData.save();
      console.log(`数据已保存: ${data.sourceUrl}`);
      return savedData;
    } catch (error) {
      console.error('保存数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 爬取单个URL
   * @param {string} url - 目标URL
   * @returns {Promise<Object>} 爬取结果
   */
  async scrapeUrl(url) {
    try {
      // 检查是否已经爬取过
      const existingData = await ScrapedData.findByUrl(url);
      if (existingData) {
        console.log(`URL已存在，跳过: ${url}`);
        return existingData;
      }

      // 控制并发请求数量
      while (this.activeRequests >= this.options.maxConcurrentRequests) {
        await delay(100);
      }

      this.activeRequests++;
      
      try {
        // 获取网页内容
        const html = await this.fetchPage(url);
        
        // 解析内容
        const parsedData = this.parseContent(html, url);
        
        // 保存到数据库
        const savedData = await this.saveData(parsedData);
        
        // 添加延迟
        await delay(this.options.delay);
        
        return savedData;
      } finally {
        this.activeRequests--;
      }
    } catch (error) {
      console.error(`爬取URL失败: ${url}`, error.message);
      
      // 保存错误信息
      try {
        await this.saveData({
          sourceUrl: url,
          title: '爬取失败',
          content: '',
          links: [],
          images: [],
          status: 'failed',
          errorMessage: error.message
        });
      } catch (saveError) {
        console.error('保存错误信息失败:', saveError.message);
      }
      
      throw error;
    }
  }

  /**
   * 批量爬取多个URL
   * @param {Array<string>} urls - URL列表
   * @returns {Promise<Array>} 爬取结果列表
   */
  async scrapeUrls(urls) {
    console.log(`开始批量爬取 ${urls.length} 个URL`);
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.scrapeUrl(url);
        results.push(result);
      } catch (error) {
        console.error(`批量爬取中的错误: ${url}`, error.message);
        results.push(null);
      }
    }
    
    console.log(`批量爬取完成，成功: ${results.filter(r => r !== null).length}/${urls.length}`);
    return results;
  }
}

module.exports = WebScraper;