import { useEffect, useState } from 'react';
import { Table, Card, Select, DatePicker, Space, Tag, Button } from 'antd';
import { ReloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

interface AuditLog {
    id: number;
    action: string;
    details: string;
    user: { id: number; name: string };
    contract?: { id: number; name: string };
    createdAt: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
    create: { label: '创建', color: 'green' },
    update: { label: '更新', color: 'blue' },
    delete: { label: '删除', color: 'red' },
    process: { label: '处理', color: 'orange' },
};

// 可展开的详情单元格组件
function ExpandableDetails({ details }: { details: string }) {
    const [expanded, setExpanded] = useState(false);
    const MAX_LINES = 3;

    let content: string;

    try {
        const parsed = JSON.parse(details);
        content = JSON.stringify(parsed, null, 2);
    } catch {
        content = details || '';
    }

    const lines = content.split('\n');
    const needsExpand = lines.length > MAX_LINES;
    const displayContent = expanded ? content : lines.slice(0, MAX_LINES).join('\n');

    return (
        <div style={{ maxWidth: 400 }}>
            <pre style={{
                margin: 0,
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflow: 'hidden',
            }}>
                {displayContent}
                {!expanded && needsExpand && '...'}
            </pre>
            {needsExpand && (
                <Button
                    type="link"
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    icon={expanded ? <UpOutlined /> : <DownOutlined />}
                    style={{ padding: 0, height: 'auto', marginTop: 4 }}
                >
                    {expanded ? '收起' : '展开'}
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
            render: (details: string) => <ExpandableDetails details={details} />,
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
