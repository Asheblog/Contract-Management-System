import { useState, useEffect } from 'react';
import { Table, Button, Space, Switch, Modal, Form, Input, Select, Popconfirm, Tag, Divider, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { ContractField } from '../../types';
import api from '../../services/api';

const { Text } = Typography;

export default function FieldSettingsPage() {
    const [fields, setFields] = useState<ContractField[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<ContractField | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        try {
            const response = await api.get('/contract-fields');
            setFields(response.data);
        } catch (error) {
            message.error('加载字段失败');
        }
    };

    const handleAddField = () => {
        setEditingField(null);
        form.resetFields();
        setModalOpen(true);
    };

    const handleEditField = (field: ContractField) => {
        setEditingField(field);
        form.setFieldsValue(field);
        setModalOpen(true);
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
            const values = await form.validateFields();
            if (editingField) {
                await api.put(`/contract-fields/${editingField.id}`, values);
                message.success('更新成功');
            } else {
                await api.post('/contract-fields', values);
                message.success('添加成功');
            }
            setModalOpen(false);
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

    const columns = [
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

    const systemFields = fields.filter(f => f.isSystem);
    const customFields = fields.filter(f => !f.isSystem);

    return (
        <div>
            <h3>字段管理</h3>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                管理合同列表中显示的字段，可修改显示名称和控制是否显示。系统字段不可删除。
            </Text>

            <Divider orientation="left">系统默认字段</Divider>
            <Table
                dataSource={systemFields}
                columns={columns}
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
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: '暂无自定义字段' }}
            />

            <Modal
                title={editingField ? (editingField.isSystem ? '编辑系统字段' : '编辑字段') : '添加字段'}
                open={modalOpen}
                onOk={handleSaveField}
                onCancel={() => setModalOpen(false)}
            >
                <Form form={form} layout="vertical">
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
