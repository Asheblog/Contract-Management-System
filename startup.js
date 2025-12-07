#!/usr/bin/env node
/**
 * 合同管理系统 - 一键启动脚本
 * 
 * 功能:
 * 1. 安装前后端依赖
 * 2. 初始化数据库 (Prisma)
 * 3. 并行启动前后端服务
 * 
 * 使用方法: node startup.js
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    console.log(`\n${colors.bright}${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function runCommand(command, cwd, label) {
    logStep(label, `执行: ${command}`);
    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
            shell: true
        });
        log(`✅ ${label} 完成`, 'green');
        return true;
    } catch (error) {
        log(`❌ ${label} 失败: ${error.message}`, 'red');
        return false;
    }
}

function spawnProcess(command, args, cwd, name, color) {
    const proc = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'pipe',
    });

    proc.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.log(`${colors[color]}[${name}]${colors.reset} ${line}`);
        });
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.log(`${colors[color]}[${name}]${colors.reset} ${colors.yellow}${line}${colors.reset}`);
        });
    });

    proc.on('close', (code) => {
        if (code !== 0) {
            log(`${name} 进程退出，代码: ${code}`, 'red');
        }
    });

    return proc;
}

async function main() {
    console.clear();
    log('╔════════════════════════════════════════════╗', 'cyan');
    log('║       合同管理系统 - 一键启动脚本           ║', 'cyan');
    log('╚════════════════════════════════════════════╝', 'cyan');

    // Check directories exist
    if (!fs.existsSync(BACKEND_DIR)) {
        log('❌ 后端目录不存在: ' + BACKEND_DIR, 'red');
        process.exit(1);
    }
    if (!fs.existsSync(FRONTEND_DIR)) {
        log('❌ 前端目录不存在: ' + FRONTEND_DIR, 'red');
        process.exit(1);
    }

    // Step 1: Install backend dependencies
    if (!runCommand('npm install', BACKEND_DIR, '后端依赖安装')) {
        process.exit(1);
    }

    // Step 2: Install frontend dependencies
    if (!runCommand('npm install', FRONTEND_DIR, '前端依赖安装')) {
        process.exit(1);
    }

    // Step 3: Generate Prisma client and push schema
    logStep('数据库', '初始化 Prisma...');
    if (!runCommand('npx prisma generate', BACKEND_DIR, 'Prisma Generate')) {
        process.exit(1);
    }
    if (!runCommand('npx prisma db push', BACKEND_DIR, 'Prisma DB Push')) {
        process.exit(1);
    }

    // Step 4: Run seed script to create default admin
    logStep('数据库', '初始化默认数据...');
    if (!runCommand('npx ts-node prisma/seed.ts', BACKEND_DIR, '初始化默认管理员')) {
        log('⚠️ 初始化默认数据失败，可能已存在', 'yellow');
        // Don't exit, this might fail if admin already exists
    }

    // Step 4: Start services
    log('\n' + '═'.repeat(50), 'cyan');
    logStep('启动', '正在启动前后端服务...');
    log('═'.repeat(50), 'cyan');

    const backendProc = spawnProcess('npm', ['run', 'start:dev'], BACKEND_DIR, 'Backend', 'blue');

    // Wait a bit for backend to start before frontend
    await new Promise(resolve => setTimeout(resolve, 3000));

    const frontendProc = spawnProcess('npm', ['run', 'dev'], FRONTEND_DIR, 'Frontend', 'green');

    log('\n✅ 服务启动成功!', 'green');
    log('', 'reset');
    log('📊 前端地址: http://localhost:3000', 'cyan');
    log('🔧 后端地址: http://localhost:3001', 'cyan');
    log('', 'reset');
    log('按 Ctrl+C 停止所有服务', 'yellow');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        log('\n正在停止服务...', 'yellow');
        backendProc.kill();
        frontendProc.kill();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        backendProc.kill();
        frontendProc.kill();
        process.exit(0);
    });
}

main().catch(err => {
    log('启动失败: ' + err.message, 'red');
    process.exit(1);
});
