const chalk = require('chalk');

/**
 * 美化的日志工具类
 * 提供带颜色和样式的控制台输出
 */
class Logger {
  /**
   * 获取当前时间戳
   * @returns {string} 格式化的时间戳
   */
  static getTimestamp() {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * 创建带边框的消息
   * @param {string} message - 消息内容
   * @param {string} color - 颜色
   * @returns {string} 带边框的消息
   */
  static createBox(message, color = 'cyan') {
    const length = message.length + 4;
    const border = '═'.repeat(length);
    const top = `╔${border}╗`;
    const middle = `║  ${message}  ║`;
    const bottom = `╚${border}╝`;
    
    const colorFunc = chalk[color] || chalk.cyan;
    return colorFunc(`${top}\n${middle}\n${bottom}`);
  }

  /**
   * 信息日志 - 蓝色
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static info(message, ...args) {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.blue.bold('ℹ INFO');
    console.log(`${timestamp} ${prefix} ${chalk.blue(message)}`, ...args);
  }

  /**
   * 成功日志 - 绿色
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static success(message, ...args) {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.green.bold('✓ SUCCESS');
    console.log(`${timestamp} ${prefix} ${chalk.green(message)}`, ...args);
  }

  /**
   * 警告日志 - 黄色
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static warn(message, ...args) {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.yellow.bold('⚠ WARN');
    console.log(`${timestamp} ${prefix} ${chalk.yellow(message)}`, ...args);
  }

  /**
   * 错误日志 - 红色
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static error(message, ...args) {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.red.bold('✗ ERROR');
    console.log(`${timestamp} ${prefix} ${chalk.red(message)}`, ...args);
  }

  /**
   * 调试日志 - 紫色
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static debug(message, ...args) {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.magenta.bold('🐛 DEBUG');
    console.log(`${timestamp} ${prefix} ${chalk.magenta(message)}`, ...args);
  }

  /**
   * 进度日志 - 青色
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static progress(message, ...args) {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.cyan.bold('⚡ PROGRESS');
    console.log(`${timestamp} ${prefix} ${chalk.cyan(message)}`, ...args);
  }

  /**
   * 数据日志 - 带格式化的数据显示
   * @param {string} label - 数据标签
   * @param {any} data - 数据内容
   */
  static data(label, data) {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.blue.bold('📊 DATA');
    console.log(`${timestamp} ${prefix} ${chalk.blue.bold(label)}:`);
    
    if (typeof data === 'object') {
      console.log(chalk.gray('┌─ 数据详情 ─┐'));
      console.log(JSON.stringify(data, null, 2));
      console.log(chalk.gray('└─────────────┘'));
    } else {
      console.log(`  ${chalk.cyan(data)}`);
    }
  }

  /**
   * 分隔线
   * @param {string} title - 分隔线标题
   * @param {string} color - 颜色
   */
  static separator(title = '', color = 'gray') {
    const line = '─'.repeat(50);
    const colorFunc = chalk[color] || chalk.gray;
    if (title) {
      const titleFormatted = ` ${title} `;
      const totalLength = 50;
      const sideLength = Math.floor((totalLength - titleFormatted.length) / 2);
      const leftSide = '─'.repeat(sideLength);
      const rightSide = '─'.repeat(totalLength - sideLength - titleFormatted.length);
      console.log(colorFunc(`${leftSide}${titleFormatted}${rightSide}`));
    } else {
      console.log(colorFunc(line));
    }
  }

  /**
   * 启动横幅
   * @param {string} appName - 应用名称
   * @param {string} version - 版本号
   */
  static banner(appName, version = '') {
    console.log(this.createBox(`🚀 ${appName} ${version}`, 'cyan'));
  }

  /**
   * 表格形式显示数据
   * @param {Array} data - 表格数据
   * @param {Array} headers - 表头
   */
  static table(data, headers = []) {
    if (headers.length > 0) {
      console.log(chalk.blue.bold('┌─ 数据表格 ─┐'));
      console.table(data);
      console.log(chalk.blue.bold('└─────────────┘'));
    } else {
      console.table(data);
    }
  }
}

module.exports = Logger;