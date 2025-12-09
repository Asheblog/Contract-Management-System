import { GithubOutlined, UserOutlined } from '@ant-design/icons';
import { Space, Typography, Grid } from 'antd';
import { useThemeStore } from '../stores/themeStore';

const { Text, Link } = Typography;
const { useBreakpoint } = Grid;

export default function Footer() {
    const { theme } = useThemeStore();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const currentYear = new Date().getFullYear();

    const isDark = theme === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';
    const linkColor = isDark ? '#177ddc' : '#1890ff';
    const bgColor = isDark ? '#141414' : '#fafafa';
    const borderColor = isDark ? '#303030' : '#f0f0f0';

    return (
        <footer
            style={{
                padding: isMobile ? '12px' : '12px 24px',
                background: bgColor,
                borderTop: `1px solid ${borderColor}`,
                textAlign: 'center',
            }}
        >
            <Space size={isMobile ? 8 : 16} wrap style={{ justifyContent: 'center' }}>
                <Text style={{ color: textColor, fontSize: isMobile ? 11 : 12 }}>
                    © {currentYear} 合同管理系统
                </Text>
                <Link
                    href="https://github.com/Asheblog/Contract-Management-System"
                    target="_blank"
                    style={{ color: linkColor, fontSize: isMobile ? 11 : 12 }}
                >
                    <Space size={4}>
                        <GithubOutlined />
                        <span>GitHub</span>
                    </Space>
                </Link>
                <Link
                    href="https://github.com/Asheblog"
                    target="_blank"
                    style={{ color: linkColor, fontSize: isMobile ? 11 : 12 }}
                >
                    <Space size={4}>
                        <UserOutlined />
                        <span>Asheblog</span>
                    </Space>
                </Link>
                <Text style={{ color: textColor, fontSize: isMobile ? 10 : 11 }}>
                    MIT License
                </Text>
            </Space>
        </footer>
    );
}
