import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

// 从环境变量读取默认管理员配置，支持自定义
const DEFAULT_ADMIN = {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
    name: process.env.DEFAULT_ADMIN_NAME || '系统管理员',
    role: 'admin',
};

async function main() {
    console.log('🌱 开始数据库初始化...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
        where: { role: 'admin' },
    });

    if (existingAdmin) {
        console.log('✅ 管理员账号已存在，跳过创建');
        return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    const admin = await prisma.user.create({
        data: {
            email: DEFAULT_ADMIN.email,
            password: hashedPassword,
            name: DEFAULT_ADMIN.name,
            role: DEFAULT_ADMIN.role,
        },
    });

    console.log('✅ 默认管理员账号已创建:');
    console.log(`   📧 邮箱: ${DEFAULT_ADMIN.email}`);
    console.log(`   🔑 密码: ${DEFAULT_ADMIN.password}`);
    console.log('');
    console.log('⚠️  请首次登录后立即修改默认密码！');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ 数据库初始化失败:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
