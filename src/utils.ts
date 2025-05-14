/**
 * 日志工具函数
 * @param args 要记录的参数
 */
export function log(...args: any[]) {
  console.error(new Date().toISOString(), ...args);
}
