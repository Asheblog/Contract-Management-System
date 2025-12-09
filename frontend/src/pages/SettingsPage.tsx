import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Switch, Button, Card, message, Space, Table, Modal, Select, Popconfirm, Tag, Divider, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { SmtpSettings, ContractField } from '../types';
import api from '../services/api';

const { Text } = Typography;

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [smtpForm] = Form.useForm();
    const [reminderForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fields, setFields] = useState<ContractField[]>([]);
    const [fieldModalOpen, setFieldModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<ContractField | null>(null);
    const [fieldForm] = Form.useForm();

    useEffect(() => {
        loadSettings();
        loadFields();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await api.get('/settings');
            if (response.data.smtp) {
                smtpForm.setFieldsValue(response.data.smtp);
            }
            if (response.data.reminder) {
                reminderForm.setFieldsValue({
                    ...response.data.reminder,
                    reminderDays: response.data.reminder.reminderDays?.join(', '),
                });
            }
        } catch (error) {
            // Settings not configured yet
        }
    };

    const loadFields = async () => {
        try {
            const response = await api.get('/contract-fields');
            setFields(response.data);
        } catch (error) {
            message.error('加载字段失败');
        }
    };

    const saveSmtpSettings = async (values: SmtpSettings) => {
        setLoading(true);
        try {
            await api.put('/settings/smtp', values);
            message.success('SMTP 设置已保存');
        } catch (error) {
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    const saveReminderSettings = async (values: any) => {
        setLoading(true);
        try {
            const reminderDays = values.reminderDays
                ?.split(',')
                .map((d: string) => parseInt(d.trim()))
                .filter((d: number) => !isNaN(d)) || [30, 7, 1];

            await api.put('/settings/reminder', {
                emailEnabled: values.emailEnabled,
                reminderDays,
                repeatReminder: values.repeatReminder,
                repeatIntervalDays: values.repeatIntervalDays || 1,
            });
            message.success('提醒设置已保存');
        } catch (error) {
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAddField = () => {
        setEditingField(null);
        fieldForm.resetFields();
        setFieldModalOpen(true);
    };

    const handleEditField = (field: ContractField) => {
        setEditingField(field);
        fieldForm.setFieldsValue(field);
        setFieldModalOpen(true);
    };

    const handleDeleteField = async (id: number) => {
        try {
            await api.delete(`/contract-fields/${id}`);
            message.success('删除成功');
            loadFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || '删除失败');
        }
    };

    const handleSaveField = async () => {
        try {
            const values = await fieldForm.validateFields();
            if (editingField) {
                await api.put(`/contract-fields/${editingField.id}`, values);
                message.success('更新成功');
            } else {
                await api.post('/contract-fields', values);
                message.success('添加成功');
            }
            setFieldModalOpen(false);
            loadFields();
        } catch (error) {
            message.error('操作失败');
        }
    };

    const toggleFieldVisibility = async (field: ContractField) => {
        try {
            await api.put(`/contract-fields/${field.id}`, { isVisible: !field.isVisible });
            loadFields();
        } catch (error) {
            message.error('操作失败');
        }
    };

    const fieldColumns = [
        {
            title: '字段名',
            dataIndex: 'key',
            key: 'key',
            render: (key: string, record: ContractField) => (
                <Space>
                    <span>{key}</span>
                    {record.isSystem && <Tag icon={<LockOutlined />} color="blue">系统</Tag>}
                </Space>
            )
        },
        { title: '显示名称', dataIndex: 'label', key: 'label' },
        {
            title: '类型', dataIndex: 'type', key: 'type', render: (type: string) =>
                type === 'text' ? '文本' : type === 'number' ? '数字' : '日期'
        },
        {
            title: '显示',
            dataIndex: 'isVisible',
            key: 'isVisible',
            render: (visible: boolean, record: ContractField) => (
                <Switch checked={visible} onChange={() => toggleFieldVisibility(record)} />
            )
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: ContractField) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEditField(record)} />
                    {!record.isSystem && (
                        <Popconfirm title="确定删除？" onConfirm={() => handleDeleteField(record.id)}>
                            <Button icon={<DeleteOutlined />} size="small" danger />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    // 分离系统字段和自定义字段
    const systemFields = fields.filter(f => f.isSystem);
    const customFields = fields.filter(f => !f.isSystem);

    if (user?.role !== 'admin') {
        return (
            <Card>
                <p>仅管理员可访问设置页面</p>
            </Card>
        );
    }

    return (
        <div>
            <h2>系统设置</h2>

            <div className="settings-section">
                <h3>📧 SMTP 邮件配置</h3>
                <Form form={smtpForm} layout="vertical" onFinish={saveSmtpSettings} style={{ maxWidth: 500 }}>
                    <Form.Item name="host" label="SMTP 服务器">
                        <Input placeholder="smtp.example.com" />
                    </Form.Item>
                    <Form.Item name="port" label="端口">
                        <InputNumber placeholder="587" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="user" label="用户名">
                        <Input placeholder="user@example.com" />
                    </Form.Item>
                    <Form.Item name="pass" label="密码">
                        <Input.Password placeholder="密码" />
                    </Form.Item>
                    <Form.Item name="from" label="发件人">
                        <Input placeholder="noreply@example.com" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            保存 SMTP 设置
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            <div className="settings-section">
                <h3>🔔 提醒规则配置</h3>
                <Form form={reminderForm} layout="vertical" onFinish={saveReminderSettings} style={{ maxWidth: 500 }}>
                    <Form.Item name="emailEnabled" label="开启邮件提醒" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="reminderDays" label="提前提醒天数" extra="多个天数用逗号分隔，如：30, 7, 1">
                        <Input placeholder="30, 7, 1" />
                    </Form.Item>
                    <Form.Item name="repeatReminder" label="过期后重复提醒" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="repeatIntervalDays" label="重复提醒间隔（天）">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            保存提醒设置
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            <div className="settings-section">
                <h3>📋 字段管理</h3>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    管理合同列表中显示的字段，可修改显示名称和控制是否显示。系统字段不可删除。
                </Text>

                <Divider orientation="left">系统默认字段</Divider>
                <Table
                    dataSource={systemFields}
                    columns={fieldColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                />

                <Divider orientation="left">
                    <Space>
                        自定义字段
                        <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleAddField}>
                            添加字段
                        </Button>
                    </Space>
                </Divider>
                <Table
                    dataSource={customFields}
                    columns={fieldColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: '暂无自定义字段' }}
                />
            </div>

            <Modal
                title={editingField ? (editingField.isSystem ? '编辑系统字段' : '编辑字段') : '添加字段'}
                open={fieldModalOpen}
                onOk={handleSaveField}
                onCancel={() => setFieldModalOpen(false)}
            >
                <Form form={fieldForm} layout="vertical">
                    <Form.Item name="key" label="字段名" rules={[{ required: true, message: '请输入字段名' }]}>
                        <Input placeholder="如：amount" disabled={!!editingField} />
                    </Form.Item>
                    <Form.Item name="label" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
                        <Input placeholder="如：合同金额" />
                    </Form.Item>
                    <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                        <Select
                            disabled={editingField?.isSystem}
                            options={[
                                { label: '文本', value: 'text' },
                                { label: '数字', value: 'number' },
                                { label: '日期', value: 'date' },
                            ]}
                        />
                    </Form.Item>
                    {editingField?.isSystem && (
                        <Text type="secondary">系统字段仅可修改显示名称</Text>
                    )}
                </Form>
            </Modal>
        </div>
    );
}
