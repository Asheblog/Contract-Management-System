import { useState } from 'react';
import { Button, Popover, Checkbox, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import api from '../services/api';

interface Props {
    availableColumns: { key: string; title: string }[];
    selectedColumns: string[];
    onChange: (columns: string[]) => void;
}

export default function ColumnSettings({ availableColumns, selectedColumns, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChange = (key: string, checked: boolean) => {
        const newColumns = checked
            ? [...selectedColumns, key]
            : selectedColumns.filter(k => k !== key);
        onChange(newColumns);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/users/me/preferences', { columns: selectedColumns });
            message.success('列配置已保存');
            setOpen(false);
        } catch (error) {
            message.error('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const content = (
        <div style={{ width: 200 }}>
            <div style={{ marginBottom: 12 }}>
                {availableColumns.map(col => (
                    <div key={col.key} style={{ padding: '4px 0' }}>
                        <Checkbox
                            checked={selectedColumns.includes(col.key)}
                            onChange={e => handleChange(col.key, e.target.checked)}
                        >
                            {col.title}
                        </Checkbox>
                    </div>
                ))}
            </div>
            <Button type="primary" size="small" block onClick={handleSave} loading={saving}>
                保存配置
            </Button>
        </div>
    );

    return (
        <Popover
            content={content}
            title="自定义列显示"
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomRight"
        >
            <Button icon={<SettingOutlined />}>列设置</Button>
        </Popover>
    );
}
