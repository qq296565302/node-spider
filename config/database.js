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
  disconnectDB
};