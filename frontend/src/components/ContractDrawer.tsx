import { useEffect, useState } from 'react';
import { Drawer, Form, Input, DatePicker, Select, Button, Space, Descriptions, Upload, List, message, Popconfirm, Divider, Timeline, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Contract, Attachment, AuditLog } from '../types';
import { useContractStore } from '../stores/contractStore';
import api from '../services/api';

interface Props {
    open: boolean;
    contract: Contract | null;
    mode: 'view' | 'edit';
    onClose: () => void;
    onModeChange: (mode: 'view' | 'edit') => void;
}

export default function ContractDrawer({ open, contract, mode, onClose, onModeChange }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const { fields, createContract, updateContract } = useContractStore();

    useEffect(() => {
        if (open && contract) {
            loadContractDetails();
        } else if (open && !contract) {
            form.resetFields();
            setAttachments([]);
            setLogs([]);
        }
    }, [open, contract]);

    const loadContractDetails = async () => {
        if (!contract) return;
        try {
            const response = await api.get(`/contracts/${contract.id}`);
            const data = response.data;
            form.setFieldsValue({
                name: data.name,
                partner: data.partner,
                signDate: dayjs(data.signDate),
                expireDate: dayjs(data.expireDate),
                status: data.status,
                ...Object.fromEntries(
                    Object.entries(data.customData || {}).map(([k, v]) => {
                        const field = fields.find(f => f.key === k);
                        if (field?.type === 'date' && v) return [k, dayjs(v as string)];
                        return [k, v];
                    })
                ),
            });
            setAttachments(data.attachments || []);
            setLogs(data.logs || []);
        } catch (error) {
            message.error('加载合同详情失败');
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const customData: Record<string, any> = {};
            fields.forEach(field => {
                if (values[field.key] !== undefined) {
                    customData[field.key] = field.type === 'date' && values[field.key]
                        ? values[field.key].format('YYYY-MM-DD')
                        : values[field.key];
                }
            });

            const payload = {
                name: values.name,
                partner: values.partner,
                signDate: values.signDate.format('YYYY-MM-DD'),
                expireDate: values.expireDate.format('YYYY-MM-DD'),
                status: values.status || 'active',
                customData,
            };

            if (contract) {
                await updateContract(contract.id, payload);
                message.success('合同更新成功');
            } else {
                await createContract(payload);
                message.success('合同创建成功');
            }
            onClose();
        } catch (error: any) {
            message.error(error.message || '操作失败');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        if (!contract) {
            message.warning('请先保存合同');
            return false;
        }
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/attachments/upload/${contract.id}`, formData);
            message.success('附件上传成功');
            loadContractDetails();
        } catch (error) {
            message.error('上传失败');
        }
        return false;
    };

    const handleDownload = async (attachment: Attachment) => {
        try {
            const response = await api.get(`/attachments/${attachment.id}/download`, {
                responseType: 'blob',
            });
            // 从 Content-Disposition 头获取文件名
            const contentDisposition = response.headers['content-disposition'];
            let fileName = attachment.fileName;
            if (contentDisposition) {
                // 优先从 filename* (RFC 5987) 中解码
                const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
                if (filenameStarMatch) {
                    fileName = decodeURIComponent(filenameStarMatch[1]);
                } else {
                    const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
                    if (filenameMatch) {
                        fileName = decodeURIComponent(filenameMatch[1]);
                    }
                }
            }
            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            message.error('下载失败');
        }
    };

    const handleDeleteAttachment = async (id: number) => {
        try {
            await api.delete(`/attachments/${id}`);
            message.success('删除成功');
            loadContractDetails();
        } catch (error) {
            message.error('删除失败');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const renderView = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button icon={<EditOutlined />} onClick={() => onModeChange('edit')}>编辑</Button>
            </div>
            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="合同名称">{contract?.name}</Descriptions.Item>
                <Descriptions.Item label="合作方">{contract?.partner}</Descriptions.Item>
                <Descriptions.Item label="签订日期">{dayjs(contract?.signDate).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="到期日期">{dayjs(contract?.expireDate).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="状态">
                    <Tag color={contract?.status === 'active' ? 'blue' : 'default'}>
                        {contract?.status === 'active' ? '进行中' : contract?.status === 'archived' ? '已归档' : '已作废'}
                    </Tag>
                    {contract?.isProcessed && <Tag color="green">已处理</Tag>}
                </Descriptions.Item>
                {fields.map(field => (
                    <Descriptions.Item key={field.key} label={field.label}>
                        {field.type === 'date' && contract?.customData[field.key]
                            ? dayjs(contract.customData[field.key]).format('YYYY-MM-DD')
                            : contract?.customData[field.key] ?? '-'}
                    </Descriptions.Item>
                ))}
            </Descriptions>

            <Divider orientation="left">附件</Divider>
            <List
                dataSource={attachments}
                locale={{ emptyText: '暂无附件' }}
                renderItem={item => (
                    <div className="attachment-item">
                        <span>{item.fileName} ({formatFileSize(item.size)})</span>
                        <Space>
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(item)}>下载</Button>
                        </Space>
                    </div>
                )}
            />

            <Divider orientation="left">操作日志</Divider>
            <Timeline
                items={logs.map(log => ({
                    children: (
                        <div className="audit-log-item">
                            <div><strong>{log.user.name}</strong> {log.action === 'create' ? '创建' : log.action === 'update' ? '更新' : log.action === 'process' ? '处理' : '删除'}</div>
                            <div style={{ color: '#999', fontSize: 12 }}>{dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                        </div>
                    ),
                }))}
            />
        </>
    );

    const renderEdit = () => (
        <Form form={form} layout="vertical">
            <div className="contract-form-section">
                <h4>基本信息</h4>
                <Form.Item name="name" label="合同名称" rules={[{ required: true, message: '请输入合同名称' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="partner" label="合作方" rules={[{ required: true, message: '请输入合作方' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="signDate" label="签订日期" rules={[{ required: true, message: '请选择签订日期' }]}>
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="expireDate" label="到期日期" rules={[{ required: true, message: '请选择到期日期' }]}>
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="status" label="状态" initialValue="active">
                    <Select options={[
                        { label: '进行中', value: 'active' },
                        { label: '已归档', value: 'archived' },
                        { label: '已作废', value: 'void' },
                    ]} />
                </Form.Item>
            </div>

            {fields.length > 0 && (
                <div className="contract-form-section">
                    <h4>扩展字段</h4>
                    {fields.filter(f => f.isVisible).map(field => (
                        <Form.Item key={field.key} name={field.key} label={field.label}>
                            {field.type === 'date' ? (
                                <DatePicker style={{ width: '100%' }} />
                            ) : field.type === 'number' ? (
                                <Input type="number" />
                            ) : (
                                <Input />
                            )}
                        </Form.Item>
                    ))}
                </div>
            )}

            {contract && (
                <div className="contract-form-section">
                    <h4>附件管理</h4>
                    <Upload beforeUpload={handleUpload} showUploadList={false}>
                        <Button icon={<UploadOutlined />}>上传附件</Button>
                    </Upload>
                    <List
                        style={{ marginTop: 12 }}
                        dataSource={attachments}
                        locale={{ emptyText: '暂无附件' }}
                        renderItem={item => (
                            <div className="attachment-item">
                                <span>{item.fileName} ({formatFileSize(item.size)})</span>
                                <Space>
                                    <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(item)} />
                                    <Popconfirm title="确定删除？" onConfirm={() => handleDeleteAttachment(item.id)}>
                                        <Button size="small" icon={<DeleteOutlined />} danger />
                                    </Popconfirm>
                                </Space>
                            </div>
                        )}
                    />
                </div>
            )}

            <Space style={{ marginTop: 24 }}>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                    {contract ? '保存' : '创建'}
                </Button>
                {contract && (
                    <Button onClick={() => onModeChange('view')}>取消</Button>
                )}
            </Space>
        </Form>
    );

    return (
        <Drawer
            title={contract ? (mode === 'view' ? '合同详情' : '编辑合同') : '新建合同'}
            open={open}
            onClose={onClose}
            width={600}
            className="contract-drawer"
        >
            {mode === 'view' && contract ? renderView() : renderEdit()}
        </Drawer>
    );
}
