import { useEffect, useState } from 'react';
import { Badge, Dropdown, List, Empty, Tag, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useContractStore } from '../stores/contractStore';
import { Contract } from '../types';

export default function NotificationBell() {
    const navigate = useNavigate();
    const { expiringContracts, fetchExpiringContracts, markProcessed, fields } = useContractStore();
    const [open, setOpen] = useState(false);

    // 辅助函数：从系统字段配置中获取显示名称
    const getFieldLabel = (key: string, defaultLabel: string): string => {
        const field = fields.find(f => f.key === key && f.isSystem);
        return field?.label || defaultLabel;
    };

    useEffect(() => {
        fetchExpiringContracts();
        const interval = setInterval(fetchExpiringContracts, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const handleMarkProcessed = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        await markProcessed(id);
    };

    const getExpireText = (expireDate: string) => {
        const days = dayjs(expireDate).diff(dayjs(), 'day');
        if (days < 0) return { text: `已过期 ${Math.abs(days)} 天`, color: 'red' };
        if (days === 0) return { text: '今天到期', color: 'red' };
        return { text: `${days} 天后到期`, color: days <= 7 ? 'orange' : 'gold' };
    };

    const dropdownContent = (
        <div style={{ width: 350, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                📢 待处理提醒 ({expiringContracts.length})
            </div>
            {expiringContracts.length === 0 ? (
                <Empty description="暂无待处理提醒" style={{ padding: 24 }} />
            ) : (
                <List
                    style={{ maxHeight: 400, overflow: 'auto' }}
                    dataSource={expiringContracts.slice(0, 10)}
                    renderItem={(contract: Contract) => {
                        const expire = getExpireText(contract.expireDate);
                        return (
                            <List.Item
                                style={{ padding: '12px 16px', cursor: 'pointer' }}
                                onClick={() => {
                                    setOpen(false);
                                    navigate('/');
                                }}
                                actions={[
                                    <Button
                                        size="small"
                                        type="link"
                                        onClick={(e) => handleMarkProcessed(contract.id, e)}
                                    >
                                        处理
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={
                                        <span>
                                            {contract.name}
                                            <Tag color={expire.color} style={{ marginLeft: 8 }}>{expire.text}</Tag>
                                        </span>
                                    }
                                    description={`${getFieldLabel('partner', '合作方')}: ${contract.partner}`}
                                />
                            </List.Item>
                        );
                    }}
                />
            )}
            {expiringContracts.length > 10 && (
                <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
                    还有 {expiringContracts.length - 10} 条提醒...
                </div>
            )}
        </div>
    );

    return (
        <Dropdown
            dropdownRender={() => dropdownContent}
            trigger={['click']}
            open={open}
            onOpenChange={setOpen}
            placement="bottomRight"
        >
            <Badge count={expiringContracts.length} size="small" offset={[-2, 2]}>
                <BellOutlined className="notification-bell" style={{ fontSize: 20, color: 'white' }} />
            </Badge>
        </Dropdown>
    );
}
