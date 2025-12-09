import { GithubOutlined, UserOutlined, CodeOutlined, DatabaseOutlined, CloudServerOutlined, DesktopOutlined } from '@ant-design/icons';
import { Space, Typography, Tooltip, Grid, Divider } from 'antd';
import { useThemeStore } from '../stores/themeStore';

const { Text, Link } = Typography;
const { useBreakpoint } = Grid;

const techStack = [
    { icon: <DesktopOutlined />, label: 'React 18', color: '#61dafb' },
    { icon: <CodeOutlined />, label: 'TypeScript', color: '#3178c6' },
    { icon: <CloudServerOutlined />, label: 'NestJS', color: '#e0234e' },
    { icon: <DatabaseOutlined />, label: 'Prisma + SQLite', color: '#2d3748' },
];

export default function Footer() {
    const { theme } = useThemeStore();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const currentYear = new Date().getFullYear();

    const isDark = theme === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)';
    const linkColor = isDark ? '#177ddc' : '#1890ff';
    const bgColor = isDark ? '#141414' : '#fafafa';
    const borderColor = isDark ? '#303030' : '#f0f0f0';

    return (
        <footer
            style={{
                padding: isMobile ? '16px 12px' : '20px 24px',
                background: bgColor,
                borderTop: `1px solid ${borderColor}`,
                marginTop: 'auto',
            }}
        >
            {/* 技术架构 */}
            <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? 12 : 16
            }}>
                <Text style={{
                    color: textColor,
                    fontSize: isMobile ? 12 : 13,
                    display: 'block',
                    marginBottom: 8
                }}>
                    技术架构
                </Text>
                <Space
                    size={isMobile ? 8 : 16}
                    wrap
                    style={{ justifyContent: 'center' }}
                >
                    {techStack.map((tech, index) => (
                        <Tooltip key={index} title={tech.label}>
                            <Space
                                size={4}
                                style={{
                                    color: tech.color,
                                    fontSize: isMobile ? 11 : 12,
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                                }}
                            >
                                {tech.icon}
                                {!isMobile && <span>{tech.label}</span>}
                            </Space>
                        </Tooltip>
                    ))}
                </Space>
            </div>

            <Divider style={{ margin: isMobile ? '12px 0' : '16px 0', borderColor }} />

            {/* 版权信息 */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isMobile ? 8 : 24,
                textAlign: 'center'
            }}>
                <Text style={{ color: textColor, fontSize: isMobile ? 11 : 12 }}>
                    © {currentYear} 合同管理系统 (Contract Management System)
                </Text>

                <Space size={16}>
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
                </Space>
            </div>

            {/* MIT License */}
            <div style={{
                textAlign: 'center',
                marginTop: isMobile ? 8 : 12
            }}>
                <Text style={{
                    color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                    fontSize: isMobile ? 10 : 11
                }}>
                    Released under the MIT License
                </Text>
            </div>
        </footer>
    );
}
