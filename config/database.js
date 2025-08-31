const mongoose = require('mongoose');
require('dotenv').config();

/**
 * 连接MongoDB数据库
 * @returns {Promise<void>} 连接结果
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

/**
 * 保存或更新数据到集合
 * @param {string} collectionName - 集合名称
 * @param {Object} data - 要保存的数据
 * @param {string} field - 判断是否存在的字段
 * @returns {Promise<void>} 保存结果
 */
const saveToCollection = async (collectionName, data, field) => {
  try {
    const collection = mongoose.connection.collection(collectionName);
    await collection.updateOne({ [field]: data[field] }, { $set: data }, { upsert: true });
    console.log(`数据已保存到集合 ${collectionName}`);
  } catch (error) {
    console.error(`保存数据到集合 ${collectionName} 时出错:`, error.message);
  }
};

/**
 * 断开数据库连接
 * @returns {Promise<void>} 断开连接结果
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB连接已断开');
  } catch (error) {
    console.error('断开MongoDB连接时出错:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  saveToCollection
};