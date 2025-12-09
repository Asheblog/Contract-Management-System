import { useEffect, useState } from 'react';
import { Table, Card, Select, DatePicker, Space, Tag, Button, Typography, Modal } from 'antd';
import { ReloadOutlined, EyeOutlined, ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Text } = Typography;

interface AuditLog {
    id: number;
    action: string;
    details: string;
    user: { id: number; name: string };
    contract?: { id: number; name: string };
    createdAt: string;
}

interface ChangeItem {
    field: string;
    from: string;
    to: string;
}

interface ParsedDetails {
    summary?: string;
    changes?: ChangeItem[];
    fields?: Record<string, string>;
    contractName?: string;
    deletedContract?: Record<string, string>;
}

const actionLabels: Record<string, { label: string; color: string }> = {
    create: { label: '创建', color: 'green' },
    update: { label: '更新', color: 'blue' },
    delete: { label: '删除', color: 'red' },
    process: { label: '处理', color: 'orange' },
};

// 生成简短预览文本
function getPreviewText(details: string): string {
    try {
        const parsed = JSON.parse(details) as ParsedDetails;
        if (parsed.summary) {
            return parsed.summary;
        }
        if (parsed.changes && parsed.changes.length > 0) {
            const count = parsed.changes.length;
            return `修改了 ${count} 项字段`;
        }
        if (parsed.fields) {
            return `新建记录`;
        }
        if (parsed.deletedContract) {
            return `删除记录`;
        }
    } catch {
        // 旧格式
    }
    return details?.slice(0, 30) || '-';
}

// 完整详情弹窗内容
function FullDetails({ details }: { details: string }) {
    let parsed: ParsedDetails | null = null;
    try {
        parsed = JSON.parse(details);
    } catch {
        // 兼容旧格式
    }

    if (!parsed || (!parsed.summary && !parsed.changes && !parsed.fields)) {
        return (
            <Text type="secondary" style={{ fontSize: 13 }}>
                {details || '-'}
            </Text>
        );
    }

    const renderChanges = (changes: ChangeItem[]) => (
        <div style={{ fontSize: 13 }}>
            {changes.map((change, index) => (
                <div key={index} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ minWidth: 80 }}>{change.field}:</Text>
                    <Text type="secondary" delete>{change.from || '(空)'}</Text>
                    <ArrowRightOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                    <Text type="success">{change.to || '(空)'}</Text>
                </div>
            ))}
        </div>
    );

    const renderFields = (fields: Record<string, string>) => (
        <div style={{ fontSize: 13 }}>
            {Object.entries(fields).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 6 }}>
                    <Text type="secondary" style={{ minWidth: 80, display: 'inline-block' }}>{key}:</Text>
                    <Text>{String(value)}</Text>
                </div>
            ))}
        </div>
    );

    const renderDeletedContract = (deletedContract: Record<string, string>) => (
        <div style={{ fontSize: 13 }}>
            {Object.entries(deletedContract).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 6 }}>
                    <Text type="secondary" style={{ minWidth: 80, display: 'inline-block' }}>{key}:</Text>
                    <Text delete type="danger">{String(value)}</Text>
                </div>
            ))}
        </div>
    );

    return (
        <div>
            {parsed.summary && (
                <div style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 14 }}>{parsed.summary}</Text>
                    {parsed.contractName && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                            ({parsed.contractName})
                        </Text>
                    )}
                </div>
            )}
            {parsed.changes && parsed.changes.length > 0 && renderChanges(parsed.changes)}
            {parsed.fields && renderFields(parsed.fields)}
            {parsed.deletedContract && renderDeletedContract(parsed.deletedContract)}
        </div>
    );
}

// 列表中的预览组件
function PreviewDetails({ details, onViewDetails }: { details: string; onViewDetails: () => void }) {
    const preview = getPreviewText(details);
    let hasMoreDetails = false;

    try {
        const parsed = JSON.parse(details) as ParsedDetails;
        hasMoreDetails = !!(
            (parsed.changes && parsed.changes.length > 0) ||
            (parsed.fields && Object.keys(parsed.fields).length > 0) ||
            parsed.deletedContract
        );
    } catch {
        hasMoreDetails = !!(details && details.length > 30);
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12 }}>{preview}</Text>
            {hasMoreDetails && (
                <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={onViewDetails}
                    style={{ padding: 0, height: 'auto', fontSize: 12 }}
                >
                    详情
                </Button>
            )}
        </div>
    );
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [detailModal, setDetailModal] = useState<{ open: boolean; log: AuditLog | null }>({
        open: false,
        log: null,
    });
    const [filters, setFilters] = useState({
        action: '',
        userId: '',
        startDate: '',
        endDate: '',
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (filters.action) params.action = filters.action;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await api.get('/audit-logs', { params });
            setLogs(response.data.data || response.data);
            setTotal(response.data.total || response.data.length);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const columns = [
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            width: 100,
            render: (action: string) => {
                const config = actionLabels[action] || { label: action, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: '操作人',
            dataIndex: ['user', 'name'],
            key: 'user',
            width: 120,
        },
        {
            title: '相关合同',
            dataIndex: ['contract', 'name'],
            key: 'contract',
            width: 200,
            render: (name: string) => name || '-',
        },
        {
            title: '详情',
            dataIndex: 'details',
            key: 'details',
            render: (details: string, record: AuditLog) => (
                <PreviewDetails
                    details={details}
                    onViewDetails={() => setDetailModal({ open: true, log: record })}
                />
            ),
        },
    ];

    return (
        <div>
            <h2>操作日志</h2>

            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Select
                        placeholder="操作类型"
                        style={{ width: 120 }}
                        allowClear
                        value={filters.action || undefined}
                        onChange={(value) => setFilters({ ...filters, action: value || '' })}
                        options={[
                            { label: '创建', value: 'create' },
                            { label: '更新', value: 'update' },
                            { label: '删除', value: 'delete' },
                            { label: '处理', value: 'process' },
                        ]}
                    />
                    <DatePicker.RangePicker
                        onChange={(dates) => {
                            setFilters({
                                ...filters,
                                startDate: dates?.[0]?.format('YYYY-MM-DD') || '',
                                endDate: dates?.[1]?.format('YYYY-MM-DD') || '',
                            });
                        }}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
                        刷新
                    </Button>
                </Space>
            </Card>

            <Table
                dataSource={logs}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: page,
                    total,
                    pageSize: 20,
                    onChange: setPage,
                    showTotal: (total) => `共 ${total} 条`,
                }}
            />

            <Modal
                title="操作详情"
                open={detailModal.open}
                onCancel={() => setDetailModal({ open: false, log: null })}
                footer={null}
                width={600}
            >
                {detailModal.log && (
                    <div>
                        <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                            <Space size="large">
                                <div>
                                    <Text type="secondary">时间：</Text>
                                    <Text>{dayjs(detailModal.log.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">操作：</Text>
                                    <Tag color={actionLabels[detailModal.log.action]?.color || 'default'}>
                                        {actionLabels[detailModal.log.action]?.label || detailModal.log.action}
                                    </Tag>
                                </div>
                                <div>
                                    <Text type="secondary">操作人：</Text>
                                    <Text>{detailModal.log.user?.name || '-'}</Text>
                                </div>
                            </Space>
                            {detailModal.log.contract?.name && (
                                <div style={{ marginTop: 8 }}>
                                    <Text type="secondary">相关合同：</Text>
                                    <Text>{detailModal.log.contract.name}</Text>
                                </div>
                            )}
                        </div>
                        <FullDetails details={detailModal.log.details} />
                    </div>
                )}
            </Modal>
        </div>
    );
}
