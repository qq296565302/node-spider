const mongoose = require('mongoose');

/**
 * 爬取数据的Schema定义
 */
const scrapedDataSchema = new mongoose.Schema({
  // 数据来源URL
  sourceUrl: {
    type: String,
    required: true,
    index: true
  },
  
  // 页面标题
  title: {
    type: String,
    required: true
  },
  
  // 页面内容
  content: {
    type: String,
    required: true
  },
  
  // 提取的链接
  links: [{
    text: String,
    url: String
  }],
  
  // 提取的图片
  images: [{
    alt: String,
    src: String
  }],
  
  // 自定义数据字段（可根据具体需求调整）
  customData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 爬取时间
  scrapedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // 数据状态
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  
  // 错误信息（如果有）
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // 自动添加createdAt和updatedAt字段
  collection: 'scraped_data' // 指定集合名称
});

// 创建复合索引
scrapedDataSchema.index({ sourceUrl: 1, scrapedAt: -1 });

/**
 * 根据URL查找数据
 * @param {string} url - 要查找的URL
 * @returns {Promise<Object|null>} 查找结果
 */
scrapedDataSchema.statics.findByUrl = function(url) {
  return this.findOne({ sourceUrl: url }).sort({ scrapedAt: -1 });
};

/**
 * 获取最近爬取的数据
 * @param {number} limit - 限制数量
 * @returns {Promise<Array>} 数据列表
 */
scrapedDataSchema.statics.getRecent = function(limit = 10) {
  return this.find()
    .sort({ scrapedAt: -1 })
    .limit(limit)
    .select('sourceUrl title scrapedAt status');
};

module.exports = mongoose.model('ScrapedData', scrapedDataSchema);