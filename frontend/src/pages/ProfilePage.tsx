import { useState } from 'react';
import { Form, Input, Button, Card, Avatar, Upload, message, Space, Typography } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, MailOutlined, CrownOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const { Title, Text } = Typography;

export default function ProfilePage() {
    const { user, setAuth, token } = useAuthStore();
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const handleUpdateProfile = async (values: { name: string }) => {
        setLoading(true);
        try {
            const response = await api.put('/users/me', values);
            setAuth(token!, { ...user!, ...response.data });
            message.success('个人信息更新成功');
        } catch (error: any) {
            message.error(error.response?.data?.message || '更新失败');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('两次输入的密码不一致');
            return;
        }
        setLoading(true);
        try {
            await api.put('/users/me/password', {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            message.success('密码修改成功');
            passwordForm.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || '密码修改失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        setAvatarLoading(true);
        try {
            const response = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAuth(token!, { ...user!, avatar: response.data.avatar });
            message.success('头像更新成功');
        } catch (error: any) {
            message.error(error.response?.data?.message || '头像上传失败');
        } finally {
            setAvatarLoading(false);
        }
        return false; // 阻止默认上传
    };

    const getAvatarUrl = () => {
        if (user?.avatar) {
            return user.avatar.startsWith('http') ? user.avatar : `${api.defaults.baseURL}${user.avatar}`;
        }
        return undefined;
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Title level={2}>👤 个人中心</Title>

            <Card style={{ marginBottom: 24 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Avatar
                        size={100}
                        src={getAvatarUrl()}
                        icon={<UserOutlined />}
                        style={{ marginBottom: 16 }}
                    />
                    <div>
                        <Upload
                            showUploadList={false}
                            beforeUpload={handleAvatarUpload}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />} loading={avatarLoading}>
                                更换头像
                            </Button>
                        </Upload>
                    </div>
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                        <MailOutlined style={{ marginRight: 8 }} />
                        <Text type="secondary">邮箱：</Text>
                        <Text>{user?.email}</Text>
                    </div>
                    <div>
                        <CrownOutlined style={{ marginRight: 8 }} />
                        <Text type="secondary">角色：</Text>
                        <Text>{user?.role === 'admin' ? '管理员' : '普通用户'}</Text>
                    </div>
                </Space>
            </Card>

            <Card title="修改个人信息" style={{ marginBottom: 24 }}>
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    initialValues={{ name: user?.name }}
                >
                    <Form.Item
                        name="name"
                        label="用户名"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            保存修改
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card title="修改密码">
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                >
                    <Form.Item
                        name="oldPassword"
                        label="当前密码"
                        rules={[{ required: true, message: '请输入当前密码' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="新密码"
                        rules={[
                            { required: true, message: '请输入新密码' },
                            { min: 6, message: '密码至少6个字符' },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="确认新密码"
                        rules={[
                            { required: true, message: '请确认新密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            修改密码
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
