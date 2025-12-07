import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Avatar, Tag, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { User } from '../types';

const { Title } = Typography;

interface UserListItem extends User {
    createdAt: string;
}

export default function UserManagementPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // 弹窗状态
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error: any) {
            message.error(error.response?.data?.message || '加载用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (values: any) => {
        try {
            await api.post('/users', values);
            message.success('用户创建成功');
            setCreateModalOpen(false);
            createForm.resetFields();
            loadUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || '创建失败');
        }
    };

    const handleEdit = async (values: any) => {
        if (!editingUser) return;
        try {
            await api.put(`/users/${editingUser.id}`, values);
            message.success('用户信息更新成功');
            setEditModalOpen(false);
            loadUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || '更新失败');
        }
    };

    const handleResetPassword = async (values: { newPassword: string }) => {
        if (!editingUser) return;
        try {
            await api.post(`/users/${editingUser.id}/reset-password`, values);
            message.success('密码重置成功');
            setPasswordModalOpen(false);
            passwordForm.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || '重置失败');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/users/${id}`);
            message.success('用户删除成功');
            loadUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || '删除失败');
        }
    };

    const openEditModal = (user: UserListItem) => {
        setEditingUser(user);
        editForm.setFieldsValue({ email: user.email, name: user.name, role: user.role });
        setEditModalOpen(true);
    };

    const openPasswordModal = (user: UserListItem) => {
        setEditingUser(user);
        passwordForm.resetFields();
        setPasswordModalOpen(true);
    };

    const getAvatarUrl = (avatar?: string) => {
        if (avatar) {
            return avatar.startsWith('http') ? avatar : `${api.defaults.baseURL}${avatar}`;
        }
        return undefined;
    };

    // 过滤用户列表
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const columns = [
        {
            title: '头像',
            dataIndex: 'avatar',
            key: 'avatar',
            width: 70,
            render: (avatar: string) => (
                <Avatar src={getAvatarUrl(avatar)} icon={<UserOutlined />} />
            ),
        },
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (role: string) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>
                    {role === 'admin' ? '管理员' : '用户'}
                </Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_: any, record: UserListItem) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                    >
                        编辑
                    </Button>
                    <Button
                        size="small"
                        icon={<KeyOutlined />}
                        onClick={() => openPasswordModal(record)}
                    >
                        重置密码
                    </Button>
                    {record.id !== currentUser?.id && (
                        <Popconfirm
                            title="确定删除该用户？"
                            onConfirm={() => handleDelete(record.id)}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    // 非管理员无权访问
    if (currentUser?.role !== 'admin') {
        return (
            <Card>
                <p>仅管理员可访问此页面</p>
            </Card>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>👥 用户管理</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                    添加用户
                </Button>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Space>
                    <Input
                        placeholder="搜索姓名或邮箱"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 200 }}
                        allowClear
                    />
                    <Select
                        value={roleFilter}
                        onChange={setRoleFilter}
                        style={{ width: 120 }}
                        options={[
                            { label: '全部角色', value: 'all' },
                            { label: '管理员', value: 'admin' },
                            { label: '普通用户', value: 'user' },
                        ]}
                    />
                </Space>
            </Card>

            <Table
                dataSource={filteredUsers}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            {/* 创建用户弹窗 */}
            <Modal
                title="添加用户"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={() => createForm.submit()}
                okText="创建"
                cancelText="取消"
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreate}>
                    <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                    >
                        <Input placeholder="user@example.com" />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="姓名"
                        rules={[{ required: true, message: '请输入姓名' }]}
                    >
                        <Input placeholder="用户姓名" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="密码"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { min: 6, message: '密码至少6个字符' },
                        ]}
                    >
                        <Input.Password placeholder="初始密码" />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="角色"
                        rules={[{ required: true, message: '请选择角色' }]}
                        initialValue="user"
                    >
                        <Select
                            options={[
                                { label: '普通用户', value: 'user' },
                                { label: '管理员', value: 'admin' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑用户弹窗 */}
            <Modal
                title="编辑用户"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={() => editForm.submit()}
                okText="保存"
                cancelText="取消"
            >
                <Form form={editForm} layout="vertical" onFinish={handleEdit}>
                    <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                    >
                        <Input placeholder="user@example.com" />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="姓名"
                        rules={[{ required: true, message: '请输入姓名' }]}
                    >
                        <Input placeholder="用户姓名" />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="角色"
                        rules={[{ required: true, message: '请选择角色' }]}
                    >
                        <Select
                            options={[
                                { label: '普通用户', value: 'user' },
                                { label: '管理员', value: 'admin' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 重置密码弹窗 */}
            <Modal
                title={`重置密码 - ${editingUser?.name}`}
                open={passwordModalOpen}
                onCancel={() => setPasswordModalOpen(false)}
                onOk={() => passwordForm.submit()}
                okText="重置"
                cancelText="取消"
            >
                <Form form={passwordForm} layout="vertical" onFinish={handleResetPassword}>
                    <Form.Item
                        name="newPassword"
                        label="新密码"
                        rules={[
                            { required: true, message: '请输入新密码' },
                            { min: 6, message: '密码至少6个字符' },
                        ]}
                    >
                        <Input.Password placeholder="请输入新密码" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="确认密码"
                        rules={[
                            { required: true, message: '请确认密码' },
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
                        <Input.Password placeholder="请再次输入新密码" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
