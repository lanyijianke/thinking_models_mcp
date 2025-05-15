# 使用配置文件版启动脚本

## 设置步骤

1. 编辑 `config.json` 文件，根据需要设置配置选项：
   
   ```json
   {
     "verbose_logging": true,
     "enable_local_algorithms": true
   }
   ```

2. 使用命令行启动服务：
   
   ```bash
   npm run start:config
   ```

   或者直接使用：
   
   ```bash
   node start.js
   ```

## 注意事项

- 配置文件中的设置会覆盖环境变量中的相同设置
- 如果配置文件不存在或读取失败，程序会尝试使用环境变量
- 配置文件应确保不被提交到代码仓库中（可添加到 .gitignore）
