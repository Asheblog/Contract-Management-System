import { useState, useEffect } from 'react';
import { Select, Tag, Input, Button, Space, Popover, ColorPicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../services/api';
import type { Tag as TagType } from '../types';

interface TagSelectorProps {
    value?: string[];
    onChange?: (tags: string[]) => void;
    mode?: 'edit' | 'view';
}

const defaultColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

export default function TagSelector({ value = [], onChange, mode = 'edit' }: TagSelectorProps) {
    const [tags, setTags] = useState<TagType[]>([]);
    const [loading, setLoading] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#1890ff');
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tags');
            setTags(response.data);
        } catch (error) {
            console.error('Failed to fetch tags', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const response = await api.post('/tags', { name: newTagName, color: newTagColor });
            setTags([...tags, response.data]);
            onChange?.([...value, newTagName]);
            setNewTagName('');
            setPopoverOpen(false);
        } catch (error) {
            console.error('Failed to create tag', error);
        }
    };

    const getTagColor = (tagName: string) => {
        const tag = tags.find(t => t.name === tagName);
        return tag?.color || '#1890ff';
    };

    if (mode === 'view') {
        return (
            <Space wrap>
                {value.map(tagName => (
                    <Tag key={tagName} color={getTagColor(tagName)}>
                        {tagName}
                    </Tag>
                ))}
                {value.length === 0 && <span style={{ color: '#999' }}>无标签</span>}
            </Space>
        );
    }

    const addTagContent = (
        <Space direction="vertical" style={{ width: 200 }}>
            <Input
                placeholder="标签名称"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onPressEnter={handleCreateTag}
            />
            <Space>
                <span>颜色:</span>
                <ColorPicker
                    value={newTagColor}
                    presets={[{ label: '推荐', colors: defaultColors }]}
                    onChange={(color) => setNewTagColor(color.toHexString())}
                    size="small"
                />
            </Space>
            <Button type="primary" size="small" block onClick={handleCreateTag}>
                创建标签
            </Button>
        </Space>
    );

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Select
                mode="multiple"
                placeholder="选择标签"
                value={value}
                onChange={onChange}
                loading={loading}
                style={{ width: '100%' }}
                options={tags.map(tag => ({
                    label: <Tag color={tag.color}>{tag.name}</Tag>,
                    value: tag.name,
                }))}
                dropdownRender={(menu) => (
                    <>
                        {menu}
                        <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
                            <Popover
                                content={addTagContent}
                                title="新建标签"
                                trigger="click"
                                open={popoverOpen}
                                onOpenChange={setPopoverOpen}
                            >
                                <Button size="small" type="dashed" icon={<PlusOutlined />} block>
                                    新建标签
                                </Button>
                            </Popover>
                        </div>
                    </>
                )}
            />
        </Space>
    );
}
