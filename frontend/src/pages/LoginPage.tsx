import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    const onLogin = async (values: { email: string; password: string }) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', values);
            setAuth(response.data.access_token, response.data.user);
            message.success('登录成功');
            navigate('/');
        } catch (error: any) {
            message.error(error.response?.data?.message || '登录失败');
        } finally {
            setLoading(false);
        }
    };

    const onRegister = async (values: { email: string; password: string; name: string }) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/register', values);
            setAuth(response.data.access_token, response.data.user);
            message.success('注册成功');
            navigate('/');
        } catch (error: any) {
            message.error(error.response?.data?.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">📋 合同管理系统</h1>
                <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
                    <Tabs.TabPane tab="登录" key="login">
                        <Form onFinish={onLogin} layout="vertical">
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: '请输入邮箱' },
                                    { type: 'email', message: '请输入有效的邮箱' },
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: '请输入密码' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                                    登录
                                </Button>
                            </Form.Item>
                        </Form>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="注册" key="register">
                        <Form onFinish={onRegister} layout="vertical">
                            <Form.Item
                                name="name"
                                rules={[{ required: true, message: '请输入姓名' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="姓名" size="large" />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: '请输入邮箱' },
                                    { type: 'email', message: '请输入有效的邮箱' },
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: '请输入密码' },
                                    { min: 6, message: '密码至少6位' },
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                                    注册
                                </Button>
                            </Form.Item>
                        </Form>
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </div>
    );
}
