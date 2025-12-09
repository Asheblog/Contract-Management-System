import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { Pie, Line } from '@ant-design/charts';
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useThemeStore } from '../stores/themeStore';

interface DashboardStats {
    totalContracts: number;
    activeContracts: number;
    expiringContracts: number;
    expiredContracts: number;
    processedContracts: number;
    statusDistribution: { type: string; value: number }[];
    expiryTrend: { month: string; count: number }[];
}

export default function DashboardCharts() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useThemeStore();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/contracts/stats');
            setStats(response.data);
        } catch (error) {
            // Generate mock data if API not available
            setStats({
                totalContracts: 0,
                activeContracts: 0,
                expiringContracts: 0,
                expiredContracts: 0,
                processedContracts: 0,
                statusDistribution: [
                    { type: '进行中', value: 0 },
                    { type: '即将到期', value: 0 },
                    { type: '已过期', value: 0 },
                    { type: '已归档', value: 0 },
                ],
                expiryTrend: [],
            });
        } finally {
            setLoading(false);
        }
    };

    const pieConfig = {
        data: stats?.statusDistribution || [],
        angleField: 'value',
        colorField: 'type',
        radius: 0.8,
        innerRadius: 0.6,
        label: {
            type: 'inner',
            offset: '-50%',
            content: '{value}',
            style: {
                textAlign: 'center',
                fontSize: 14,
            },
        },
        legend: {
            position: 'bottom' as const,
        },
        tooltip: {
            title: () => '',
            items: [
                (datum: { type: string; value: number }) => ({
                    name: datum.type,
                    value: datum.value,
                }),
            ],
        },
        theme: theme === 'dark' ? 'dark' : 'light',
    };

    const lineConfig = {
        data: stats?.expiryTrend || [],
        xField: 'month',
        yField: 'count',
        smooth: true,
        point: { size: 4, shape: 'circle' },
        color: '#1890ff',
        theme: theme === 'dark' ? 'dark' : 'light',
    };

    return (
        <div style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="总合同数"
                            value={stats?.totalContracts || 0}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="进行中"
                            value={stats?.activeContracts || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="即将到期"
                            value={stats?.expiringContracts || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="已过期未处理"
                            value={stats?.expiredContracts || 0}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={12}>
                    <Card title="合同状态分布" loading={loading}>
                        {stats && stats.statusDistribution.length > 0 && (
                            <Pie {...pieConfig} height={250} />
                        )}
                        {(!stats || stats.statusDistribution.every(s => s.value === 0)) && (
                            <div className="empty-state-text">暂无数据</div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="到期趋势 (近6个月)" loading={loading}>
                        {stats && stats.expiryTrend.length > 0 && (
                            <Line {...lineConfig} height={250} />
                        )}
                        {(!stats || stats.expiryTrend.length === 0) && (
                            <div className="empty-state-text">暂无数据</div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
