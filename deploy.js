#!/usr/bin/env node

/**
 * 天机思维模型 MCP 用户手册 GitHub Pages 部署脚本
 * 
 * 此脚本帮助用户将用户手册部署到 GitHub Pages。
 * 根据用户选择，可以使用主分支的docs目录或单独的gh-pages分支。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 确认当前目录是否为项目根目录
if (!fs.existsSync(path.join(process.cwd(), 'user-manual'))) {
  console.error('错误: 请在项目根目录运行此脚本。未找到 user-manual 目录。');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('天机思维模型 MCP 用户手册部署工具');
console.log('='.repeat(60));
console.log('\n此脚本将帮助您将用户手册部署到 GitHub Pages。\n');

rl.question('请选择部署方法:\n1. 使用主分支的docs目录\n2. 使用gh-pages分支\n\n请输入选项 (1/2): ', (answer) => {
  if (answer === '1') {
    deployToDocs();
  } else if (answer === '2') {
    deployToGhPages();
  } else {
    console.log('无效选项。请选择1或2。');
    rl.close();
    process.exit(1);
  }
});

/**
 * 使用主分支的docs目录部署
 */
function deployToDocs() {
  try {
    console.log('\n开始使用主分支的docs目录部署...\n');
    
    // 1. 检查是否已经存在docs目录，如果存在则询问是否覆盖
    if (fs.existsSync(path.join(process.cwd(), 'docs'))) {
      rl.question('\n警告: docs目录已存在。继续操作将覆盖现有内容。是否继续? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          copyUserManualToDocs();
        } else {
          console.log('操作已取消。');
          rl.close();
        }
      });
    } else {
      copyUserManualToDocs();
    }
  } catch (error) {
    console.error('部署过程中出错:', error);
    rl.close();
  }
}

/**
 * 将user-manual目录复制到docs
 */
function copyUserManualToDocs() {
  try {
    // 1. 如果存在docs目录，删除它
    if (fs.existsSync(path.join(process.cwd(), 'docs'))) {
      console.log('- 移除现有的docs目录');
      fs.rmSync(path.join(process.cwd(), 'docs'), { recursive: true, force: true });
    }
    
    // 2. 创建新的docs目录
    console.log('- 创建新的docs目录');
    fs.mkdirSync(path.join(process.cwd(), 'docs'));
    
    // 3. 复制user-manual的内容到docs
    console.log('- 复制用户手册内容到docs目录');
    copyFolderSync(
      path.join(process.cwd(), 'user-manual'),
      path.join(process.cwd(), 'docs')
    );
    
    // 4. 提示用户配置GitHub Pages
    console.log('\n✅ 部署文件已准备好!\n');
    console.log('请按照以下步骤在GitHub上配置Pages:');
    console.log('1. 提交并推送更改到GitHub: git add docs && git commit -m "Deploy user manual to GitHub Pages" && git push');
    console.log('2. 在GitHub中打开您的仓库设置');
    console.log('3. 滚动到"GitHub Pages"部分');
    console.log('4. 在"Source"下拉菜单中选择"main branch /docs folder"');
    console.log('5. 点击"Save"按钮');
    console.log('\n几分钟后，您的用户手册将发布在 https://<your-github-username>.github.io/thinking_models_mcp/');
    
    rl.close();
  } catch (error) {
    console.error('复制过程中出错:', error);
    rl.close();
  }
}

/**
 * 使用gh-pages分支部署
 */
function deployToGhPages() {
  try {
    console.log('\n开始使用gh-pages分支部署...\n');
    
    // 1. 检查是否已安装gh-pages包
    let ghPagesInstalled = false;
    try {
      require.resolve('gh-pages');
      ghPagesInstalled = true;
      console.log('- 已检测到gh-pages包');
    } catch (e) {
      console.log('- 未检测到gh-pages包，需要安装');
    }
    
    if (!ghPagesInstalled) {
      // 检查是否有package.json
      if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
        rl.question('未检测到package.json。是否要初始化一个新的npm项目? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            console.log('- 初始化新的npm项目');
            execSync('npm init -y', { stdio: 'inherit' });
            installGhPagesAndDeploy();
          } else {
            console.log('在没有package.json的情况下无法继续。操作已取消。');
            rl.close();
          }
        });
      } else {
        installGhPagesAndDeploy();
      }
    } else {
      updatePackageJsonAndDeploy();
    }
  } catch (error) {
    console.error('部署过程中出错:', error);
    rl.close();
  }
}

/**
 * 安装gh-pages并部署
 */
function installGhPagesAndDeploy() {
  try {
    console.log('- 正在安装gh-pages包');
    execSync('npm install --save-dev gh-pages', { stdio: 'inherit' });
    console.log('- gh-pages安装完成');
    updatePackageJsonAndDeploy();
  } catch (error) {
    console.error('安装gh-pages时出错:', error);
    rl.close();
  }
}

/**
 * 更新package.json并部署
 */
function updatePackageJsonAndDeploy() {
  try {
    // 1. 读取并更新package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 2. 添加部署脚本
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts.deploy = 'gh-pages -d user-manual';
    
    // 3. 写入更新后的package.json
    console.log('- 更新package.json添加部署脚本');
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    
    // 4. 运行部署命令
    console.log('- 正在部署用户手册到gh-pages分支');
    execSync('npm run deploy', { stdio: 'inherit' });
    
    // 5. 提示用户配置GitHub Pages
    console.log('\n✅ 部署完成!\n');
    console.log('请按照以下步骤在GitHub上配置Pages:');
    console.log('1. 在GitHub仓库设置中，找到"Pages"部分');
    console.log('2. 在"Source"下拉菜单中选择"Deploy from a branch"');
    console.log('3. 在"Branch"下拉菜单中选择"gh-pages", 并选择"/ (root)"');
    console.log('4. 点击"Save"按钮');
    console.log('\n几分钟后，您的用户手册将发布在 https://<your-github-username>.github.io/thinking_models_mcp/');
    
    rl.close();
  } catch (error) {
    console.error('更新package.json或部署时出错:', error);
    rl.close();
  }
}

/**
 * 递归复制文件夹
 */
function copyFolderSync(source, target) {
  // 创建目标文件夹
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  // 读取源文件夹内容
  const files = fs.readdirSync(source);

  // 复制每个文件/文件夹
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    // 判断是文件还是文件夹
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // 递归复制子文件夹
      copyFolderSync(sourcePath, targetPath);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}
