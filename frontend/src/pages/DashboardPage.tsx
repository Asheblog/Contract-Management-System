import { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Tag, Space, Popconfirm, message, Tooltip, DatePicker, Card, Dropdown, Upload } from 'antd';
import { PlusOutlined, SearchOutlined, CheckCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, UploadOutlined, FilterOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TableRowSelection, SortOrder } from 'antd/es/table/interface';
import { useContractStore } from '../stores/contractStore';
import { Contract } from '../types';
import ContractDrawer from '../components/ContractDrawer';
import ColumnSettings from '../components/ColumnSettings';
import api from '../services/api';

const { RangePicker } = DatePicker;

const statusOptions = [
    { label: '全部', value: '' },
    { label: '进行中', value: 'active' },
    { label: '即将到期', value: 'expiring' },
    { label: '已过期', value: 'expired' },
    { label: '未处理', value: 'unprocessed' },
    { label: '已归档', value: 'archived' },
];

export default function DashboardPage() {
    const { contracts, total, page, loading, fields, fetchContracts, fetchFields, markProcessed, deleteContract } = useContractStore();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['name', 'partner', 'signDate', 'expireDate', 'status']);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
        expireDateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    });
    // 排序状态
    const [sortField, setSortField] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

    useEffect(() => {
        fetchContracts({ status, search, page: 1, sortField, sortOrder });
        fetchFields();
        loadColumnPreferences();
    }, []);

    const loadColumnPreferences = async () => {
        try {
            const response = await api.get('/users/me/preferences');
            if (response.data) {
                setVisibleColumns(response.data);
            }
        } catch (error) {
            // Use default columns
        }
    };

    const handleSearch = () => {
        fetchContracts({ status, search, page: 1, sortField, sortOrder });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        fetchContracts({ status: value, search, page: 1, sortField, sortOrder });
    };

    const handlePageChange = (newPage: number) => {
        fetchContracts({ status, search, page: newPage, sortField, sortOrder });
    };

    // 处理表格排序变化
    const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
        const newSortField = sorter.field as string | undefined;
        const newSortOrder = sorter.order ? (sorter.order === 'ascend' ? 'asc' : 'desc') as 'asc' | 'desc' : undefined;
        setSortField(newSortField);
        setSortOrder(newSortOrder);
        fetchContracts({ status, search, page: 1, sortField: newSortField, sortOrder: newSortOrder });
    };

    const handleView = (contract: Contract) => {
        setSelectedContract(contract);
        setViewMode('view');
        setDrawerOpen(true);
    };

    const handleEdit = (contract: Contract) => {
        setSelectedContract(contract);
        setViewMode('edit');
        setDrawerOpen(true);
    };

    const handleCreate = () => {
        setSelectedContract(null);
        setViewMode('edit');
        setDrawerOpen(true);
    };

    const handleMarkProcessed = async (id: number) => {
        try {
            await markProcessed(id);
            message.success('已标记为处理');
        } catch (error) {
            message.error('操作失败');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteContract(id);
            message.success('删除成功');
        } catch (error) {
            message.error('删除失败');
        }
    };

    // Batch operations
    const handleBatchDelete = async () => {
        try {
            await Promise.all(selectedRowKeys.map(id => api.delete(`/contracts/${id}`)));
            message.success(`成功删除 ${selectedRowKeys.length} 条合同`);
            setSelectedRowKeys([]);
            fetchContracts({ status, search, page, sortField, sortOrder });
        } catch (error) {
            message.error('批量删除失败');
        }
    };

    const handleBatchProcess = async () => {
        try {
            await Promise.all(selectedRowKeys.map(id => api.put(`/contracts/${id}/process`)));
            message.success(`成功处理 ${selectedRowKeys.length} 条合同`);
            setSelectedRowKeys([]);
            fetchContracts({ status, search, page });
        } catch (error) {
            message.error('批量处理失败');
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/contracts/export', {
                responseType: 'blob',
                params: { ids: selectedRowKeys.length > 0 ? selectedRowKeys.join(',') : undefined }
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `contracts_${dayjs().format('YYYYMMDD')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success('导出成功');
        } catch (error) {
            message.error('导出失败');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/contracts/import/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'contract_import_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success('模板下载成功');
        } catch (error) {
            message.error('模板下载失败');
        }
    };

    const handleImport = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/contracts/import', formData);
            message.success(`导入成功，共导入 ${response.data.imported} 条合同`);
            fetchContracts({ status, search, page: 1 });
        } catch (error: any) {
            message.error(error?.response?.data?.message || '导入失败');
        }
        return false;
    };

    const getExpireStatus = (expireDate: string, _isProcessed: boolean) => {
        const days = dayjs(expireDate).diff(dayjs(), 'day');
        if (days < 0) return { color: 'red', text: `已过期 ${Math.abs(days)} 天` };
        if (days <= 7) return { color: 'orange', text: `${days} 天后到期` };
        if (days <= 30) return { color: 'gold', text: `${days} 天后到期` };
        return { color: 'green', text: `${days} 天后到期` };
    };

    const getRowClassName = (record: Contract) => {
        const days = dayjs(record.expireDate).diff(dayjs(), 'day');
        if (days < 0 && !record.isProcessed) return 'contract-row-expired';
        if (days <= 30 && days >= 0) return 'contract-row-warning';
        return '';
    };

    const rowSelection: TableRowSelection<Contract> = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
    };

    // 辅助函数：获取列的排序状态
    const getSortOrder = (field: string): SortOrder | undefined => {
        if (sortField !== field) return undefined;
        return sortOrder === 'asc' ? 'ascend' : sortOrder === 'desc' ? 'descend' : undefined;
    };

    const baseColumns = [
        {
            title: '合同名称',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: getSortOrder('name'),
            render: (text: string, record: Contract) => (
                <a onClick={() => handleView(record)}>{text}</a>
            ),
        },
        {
            title: '合作方',
            dataIndex: 'partner',
            key: 'partner',
            sorter: true,
            sortOrder: getSortOrder('partner'),
        },
        {
            title: '签订日期',
            dataIndex: 'signDate',
            key: 'signDate',
            sorter: true,
            sortOrder: getSortOrder('signDate'),
            render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
        },
        {
            title: '到期日期',
            dataIndex: 'expireDate',
            key: 'expireDate',
            sorter: true,
            sortOrder: getSortOrder('expireDate'),
            render: (date: string, record: Contract) => {
                const status = getExpireStatus(date, record.isProcessed);
                return (
                    <Space>
                        <span>{dayjs(date).format('YYYY-MM-DD')}</span>
                        <Tag color={status.color}>{status.text}</Tag>
                    </Space>
                );
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            sortOrder: getSortOrder('status'),
            render: (status: string, record: Contract) => (
                <Space>
                    <Tag color={status === 'active' ? 'blue' : status === 'archived' ? 'default' : 'red'}>
                        {status === 'active' ? '进行中' : status === 'archived' ? '已归档' : '已作废'}
                    </Tag>
                    {record.isProcessed && <Tag color="green">已处理</Tag>}
                </Space>
            ),
        },
        {
            title: '创建人',
            dataIndex: ['createdBy', 'name'],
            key: 'createdBy',
        },
    ];

    const customColumns = fields
        .filter(f => f.isVisible)
        .map(field => ({
            title: field.label,
            dataIndex: ['customData', field.key],
            key: field.key,
            render: (value: any) => {
                if (field.type === 'date' && value) return dayjs(value).format('YYYY-MM-DD');
                return value ?? '-';
            },
        }));

    const actionColumn = {
        title: '操作',
        key: 'action',
        width: 180,
        fixed: 'right' as const,
        render: (_: any, record: Contract) => (
            <Space>
                <Tooltip title="查看">
                    <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)} />
                </Tooltip>
                <Tooltip title="编辑">
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
                </Tooltip>
                {!record.isProcessed && dayjs(record.expireDate).diff(dayjs(), 'day') <= 30 && (
                    <Tooltip title="标记已处理">
                        <Button
                            icon={<CheckCircleOutlined />}
                            size="small"
                            type="primary"
                            ghost
                            onClick={() => handleMarkProcessed(record.id)}
                        />
                    </Tooltip>
                )}
                <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
                    <Tooltip title="删除">
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Tooltip>
                </Popconfirm>
            </Space>
        ),
    };

    const allColumns = [...baseColumns, ...customColumns, actionColumn];
    const displayColumns = allColumns.filter(
        col => col.key === 'action' || visibleColumns.includes(col.key as string)
    );

    const batchMenuItems = [
        { key: 'process', label: '批量标记已处理', onClick: handleBatchProcess },
        { key: 'delete', label: '批量删除', danger: true, onClick: handleBatchDelete },
    ];

    return (
        <div>
            {/* Header */}
            <div className="dashboard-header">
                <h2>合同列表</h2>
                <Space wrap>
                    {selectedRowKeys.length > 0 && (
                        <Dropdown menu={{ items: batchMenuItems }}>
                            <Button>批量操作 ({selectedRowKeys.length})</Button>
                        </Dropdown>
                    )}
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        导出
                    </Button>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'template',
                                    label: '下载导入模板',
                                    icon: <FileTextOutlined />,
                                    onClick: handleDownloadTemplate,
                                },
                                {
                                    key: 'import',
                                    label: (
                                        <Upload
                                            accept=".xlsx,.xls"
                                            showUploadList={false}
                                            beforeUpload={(file) => {
                                                handleImport(file);
                                                return false;
                                            }}
                                        >
                                            <span>导入数据</span>
                                        </Upload>
                                    ),
                                    icon: <UploadOutlined />,
                                },
                            ],
                        }}
                    >
                        <Button icon={<UploadOutlined />}>导入</Button>
                    </Dropdown>
                    <ColumnSettings
                        availableColumns={[...baseColumns, ...customColumns].map(c => ({ key: c.key as string, title: c.title as string }))}
                        selectedColumns={visibleColumns}
                        onChange={setVisibleColumns}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                        新建合同
                    </Button>
                </Space>
            </div>

            {/* Filter Section */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap style={{ width: '100%' }}>
                    <Input
                        placeholder="搜索合同名称或合作方"
                        prefix={<SearchOutlined />}
                        style={{ width: 250 }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                    />
                    <Select
                        placeholder="状态筛选"
                        style={{ width: 130 }}
                        value={status}
                        onChange={handleStatusChange}
                        options={statusOptions}
                    />
                    <Button
                        icon={<FilterOutlined />}
                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    >
                        高级搜索
                    </Button>
                    <Button type="primary" onClick={handleSearch}>搜索</Button>
                </Space>

                {showAdvancedSearch && (
                    <div className="advanced-search-section">
                        <Space wrap>
                            <div>
                                <span style={{ marginRight: 8 }}>签订日期:</span>
                                <RangePicker
                                    value={advancedFilters.dateRange}
                                    onChange={(dates) => setAdvancedFilters({ ...advancedFilters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
                                />
                            </div>
                            <div>
                                <span style={{ marginRight: 8 }}>到期日期:</span>
                                <RangePicker
                                    value={advancedFilters.expireDateRange}
                                    onChange={(dates) => setAdvancedFilters({ ...advancedFilters, expireDateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
                                />
                            </div>
                        </Space>
                    </div>
                )}
            </Card>

            {/* Table */}
            <Table
                dataSource={contracts}
                columns={displayColumns}
                rowKey="id"
                loading={loading}
                rowClassName={getRowClassName}
                rowSelection={rowSelection}
                scroll={{ x: 1200 }}
                onChange={handleTableChange}
                pagination={{
                    current: page,
                    total,
                    pageSize: 20,
                    onChange: handlePageChange,
                    showTotal: (total) => `共 ${total} 条`,
                    showSizeChanger: false,
                }}
            />

            <ContractDrawer
                open={drawerOpen}
                contract={selectedContract}
                mode={viewMode}
                onClose={() => setDrawerOpen(false)}
                onModeChange={setViewMode}
            />
        </div>
    );
}
