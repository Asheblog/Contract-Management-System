import { useEffect, useState } from 'react';
import { Table, Card, Select, DatePicker, Space, Tag, Button, Typography } from 'antd';
import { ReloadOutlined, DownOutlined, UpOutlined, ArrowRightOutlined } from '@ant-design/icons';
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

// 格式化详情显示组件
function FormattedDetails({ details }: { details: string }) {
    const [expanded, setExpanded] = useState(false);

    let parsed: ParsedDetails | null = null;
    try {
        parsed = JSON.parse(details);
    } catch {
        // 兼容旧格式
    }

    // 如果无法解析或是旧格式，显示原始内容
    if (!parsed || (!parsed.summary && !parsed.changes && !parsed.fields)) {
        return (
            <Text type="secondary" style={{ fontSize: 12 }}>
                {details || '-'}
            </Text>
        );
    }

    // 渲染变更列表
    const renderChanges = (changes: ChangeItem[]) => {
        const displayChanges = expanded ? changes : changes.slice(0, 3);
        return (
            <div style={{ fontSize: 12 }}>
                {displayChanges.map((change, index) => (
                    <div key={index} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <Text strong>{change.field}:</Text>
                        <Text type="secondary" delete style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {change.from}
                        </Text>
                        <ArrowRightOutlined style={{ fontSize: 10, color: '#1890ff' }} />
                        <Text type="success" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {change.to}
                        </Text>
                    </div>
                ))}
                {changes.length > 3 && (
                    <Button
                        type="link"
                        size="small"
                        onClick={() => setExpanded(!expanded)}
                        icon={expanded ? <UpOutlined /> : <DownOutlined />}
                        style={{ padding: 0, height: 'auto' }}
                    >
                        {expanded ? '收起' : `还有 ${changes.length - 3} 项变更`}
                    </Button>
                )}
            </div>
        );
    };

    // 渲染创建时的字段列表
    const renderFields = (fields: Record<string, string>) => {
        const entries = Object.entries(fields);
        const displayEntries = expanded ? entries : entries.slice(0, 3);
        return (
            <div style={{ fontSize: 12 }}>
                {displayEntries.map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 2 }}>
                        <Text type="secondary">{key}:</Text> <Text>{String(value)}</Text>
                    </div>
                ))}
                {entries.length > 3 && (
                    <Button
                        type="link"
                        size="small"
                        onClick={() => setExpanded(!expanded)}
                        icon={expanded ? <UpOutlined /> : <DownOutlined />}
                        style={{ padding: 0, height: 'auto' }}
                    >
                        {expanded ? '收起' : `还有 ${entries.length - 3} 项`}
                    </Button>
                )}
            </div>
        );
    };

    // 渲染删除的合同信息
    const renderDeletedContract = (deletedContract: Record<string, string>) => (
        <div style={{ fontSize: 12 }}>
            {Object.entries(deletedContract).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 2 }}>
                    <Text type="secondary">{key}:</Text> <Text delete type="danger">{String(value)}</Text>
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ maxWidth: 350 }}>
            {parsed.summary && (
                <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{parsed.summary}</Text>
                    {parsed.contractName && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
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

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
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
            render: (details: string) => <FormattedDetails details={details} />,
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
        </div>
    );
}
