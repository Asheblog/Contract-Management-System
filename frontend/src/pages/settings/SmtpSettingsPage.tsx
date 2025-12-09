import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, message } from 'antd';
import { SmtpSettings } from '../../types';
import api from '../../services/api';

export default function SmtpSettingsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await api.get('/settings/smtp');
            if (response.data) {
                form.setFieldsValue(response.data);
            }
        } catch (error) {
            // Settings not configured yet
        }
    };

    const saveSettings = async (values: SmtpSettings) => {
        setLoading(true);
        try {
            await api.put('/settings/smtp', values);
            message.success('SMTP 设置已保存');
        } catch (error) {
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3>SMTP 邮件配置</h3>
            <Form form={form} layout="vertical" onFinish={saveSettings} style={{ maxWidth: 500 }}>
                <Form.Item name="host" label="SMTP 服务器">
                    <Input placeholder="smtp.example.com" />
                </Form.Item>
                <Form.Item name="port" label="端口">
                    <InputNumber placeholder="587" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="user" label="用户名">
                    <Input placeholder="user@example.com" />
                </Form.Item>
                <Form.Item name="pass" label="密码">
                    <Input.Password placeholder="密码" />
                </Form.Item>
                <Form.Item name="from" label="发件人">
                    <Input placeholder="noreply@example.com" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        保存 SMTP 设置
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
