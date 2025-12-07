import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Switch, Grid } from 'antd';
import { FileTextOutlined, SettingOutlined, UserOutlined, LogoutOutlined, SunOutlined, MoonOutlined, HistoryOutlined, DashboardOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import NotificationBell from './NotificationBell';

const { Header, Content } = Layout;
const { useBreakpoint } = Grid;

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: isMobile ? '' : '数据概览',
        },
        {
            key: '/contracts',
            icon: <FileTextOutlined />,
            label: isMobile ? '' : '合同管理',
        },
        ...(user?.role === 'admin' ? [
            {
                key: '/logs',
                icon: <HistoryOutlined />,
                label: isMobile ? '' : '操作日志',
            },
            {
                key: '/users',
                icon: <TeamOutlined />,
                label: isMobile ? '' : '用户管理',
            },
            {
                key: '/settings',
                icon: <SettingOutlined />,
                label: isMobile ? '' : '系统设置',
            },
        ] : []),
    ];

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: '个人中心',
                onClick: () => navigate('/profile'),
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
                onClick: () => {
                    logout();
                    navigate('/login');
                },
            },
        ],
    };

    const getAvatarUrl = () => {
        if (user?.avatar) {
            return user.avatar.startsWith('http') ? user.avatar : `${api.defaults.baseURL}${user.avatar}`;
        }
        return undefined;
    };

    const headerBg = theme === 'dark'
        ? 'linear-gradient(135deg, #1f1f1f 0%, #141414 100%)'
        : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{
                background: headerBg,
                padding: isMobile ? '0 12px' : '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                {/* Logo + Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 32 }}>
                    <div style={{
                        color: 'white',
                        fontSize: isMobile ? 16 : 20,
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <span style={{ fontSize: isMobile ? 20 : 24 }}>📋</span>
                        {!isMobile && <span>合同管理系统</span>}
                    </div>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={({ key }) => navigate(key)}
                        style={{
                            background: 'transparent',
                            borderBottom: 'none',
                            minWidth: isMobile ? 100 : 300,
                        }}
                    />
                </div>

                {/* Right side: theme toggle + notifications + user */}
                <Space size={isMobile ? 12 : 20}>
                    {/* Theme Toggle */}
                    <Switch
                        checkedChildren={<MoonOutlined />}
                        unCheckedChildren={<SunOutlined />}
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                        style={{ backgroundColor: theme === 'dark' ? '#177ddc' : '#faad14' }}
                    />

                    <NotificationBell />

                    <Dropdown menu={userMenu} placement="bottomRight">
                        <Space style={{ cursor: 'pointer', color: 'white' }}>
                            <Avatar
                                src={getAvatarUrl()}
                                icon={<UserOutlined />}
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                size={isMobile ? 'small' : 'default'}
                            />
                            {!isMobile && (
                                <span style={{
                                    fontWeight: 500,
                                    maxWidth: 100,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {user?.name}
                                </span>
                            )}
                        </Space>
                    </Dropdown>
                </Space>
            </Header>
            <Content style={{
                margin: isMobile ? 12 : 24,
                padding: isMobile ? 16 : 24,
                background: theme === 'dark' ? '#1f1f1f' : '#fff',
                borderRadius: 8,
                minHeight: 'calc(100vh - 64px - 48px)',
                transition: 'background 0.3s',
            }}>
                <Outlet />
            </Content>
        </Layout>
    );
}
