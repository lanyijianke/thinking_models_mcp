import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// 获取当前文件的目录路径（ESM兼容方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取配置文件
function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('读取配置文件失败:', error.message);
  }
  return {};
}

// 主函数
async function main() {
  try {
    // 加载配置
    const config = loadConfig();
    
    // 设置环境变量
    if (config.verbose_logging) {
      process.env.VERBOSE_LOGGING = 'true';
      console.log('已启用详细日志记录');
    }
    
    if (config.enable_local_algorithms) {
      process.env.ENABLE_LOCAL_ALGORITHMS = 'true';
      console.log('已启用本地算法功能');
    }
    
    // 运行 npm start 命令
    console.log('正在启动服务器...');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      // 创建子进程并捕获错误
    const child = spawn(npm, ['start'], { 
      stdio: 'inherit',
      env: process.env,
      shell: true // 添加shell选项以提高兼容性
    });
    
    // 监听错误
    child.on('error', (err) => {
      console.error('启动子进程时出错:', err);
    });
    
    // 监听进程结束
    child.on('close', (code) => {
      console.log(`子进程退出，退出码 ${code}`);
    });
  } catch (error) {
    console.error('执行过程中出现错误:', error);
  }
}

main().catch(error => {
  console.error('启动程序时发生错误:', error);
  process.exit(1);
});
