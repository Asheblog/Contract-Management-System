import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme as antTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StatsDashboardPage from './pages/StatsDashboardPage'
import SettingsPage from './pages/SettingsPage'
import AuditLogPage from './pages/AuditLogPage'
import ProfilePage from './pages/ProfilePage'
import UserManagementPage from './pages/UserManagementPage'
import MainLayout from './components/MainLayout'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { token } = useAuthStore()
    return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AppContent() {
    const { theme } = useThemeStore()

    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 6,
                },
            }}
        >
            <div style={{
                minHeight: '100vh',
                background: theme === 'dark' ? '#141414' : '#f0f2f5',
                transition: 'background 0.3s',
            }}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <MainLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<StatsDashboardPage />} />
                            <Route path="contracts" element={<DashboardPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="logs" element={<AuditLogPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="users" element={<UserManagementPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </div>
        </ConfigProvider>
    )
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppContent />
        </QueryClientProvider>
    )
}

export default App
