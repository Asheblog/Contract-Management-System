import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, message } from 'antd';
import api from '../../services/api';

export default function ReminderSettingsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await api.get('/settings/reminder');
            if (response.data) {
                form.setFieldsValue({
                    ...response.data,
                    reminderDays: response.data.reminderDays?.join(', '),
                });
            }
        } catch (error) {
            // Settings not configured yet
        }
    };

    const saveSettings = async (values: any) => {
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

    return (
        <div>
            <h3>提醒规则配置</h3>
            <Form form={form} layout="vertical" onFinish={saveSettings} style={{ maxWidth: 500 }}>
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
    );
}
