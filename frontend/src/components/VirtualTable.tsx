import { useRef, useEffect, useState, useMemo, CSSProperties } from 'react';
import { List } from 'react-window';
import { Spin, Empty } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';

interface VirtualTableProps<T> {
    dataSource: T[];
    columns: ColumnsType<T>;
    rowKey: keyof T | ((record: T) => string | number);
    loading?: boolean;
    height?: number;
    rowHeight?: number;
    onRowClick?: (record: T) => void;
}

export default function VirtualTable<T extends object>({
    dataSource,
    columns,
    rowKey,
    loading = false,
    height = 500,
    rowHeight = 54,
    onRowClick,
}: VirtualTableProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
            const resizeObserver = new ResizeObserver((entries) => {
                setContainerWidth(entries[0].contentRect.width);
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }
    }, []);

    const columnWidths = useMemo(() => {
        const totalDefined = columns.reduce((acc, col) => acc + (col.width as number || 0), 0);
        const flexCount = columns.filter(col => !col.width).length;
        const flexWidth = flexCount > 0 ? (containerWidth - totalDefined) / flexCount : 0;

        return columns.map(col => col.width as number || Math.max(flexWidth, 100));
    }, [columns, containerWidth]);

    const getRowKey = (record: T): string | number => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return record[rowKey] as string | number;
    };

    // Helper to safely get dataIndex value from a column
    const getColumnDataIndex = (col: ColumnsType<T>[number]): keyof T | undefined => {
        if ('dataIndex' in col) {
            return (col as ColumnType<T>).dataIndex as keyof T;
        }
        return undefined;
    };

    if (loading) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (dataSource.length === 0) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无数据" />
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    background: '#fafafa',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                {columns.map((col, index) => (
                    <div
                        key={col.key as string || index}
                        style={{
                            width: columnWidths[index],
                            padding: '12px',
                        }}
                    >
                        {col.title as string}
                    </div>
                ))}
            </div>

            {/* Virtual List */}
            <List
                height={height - 48}
                itemCount={dataSource.length}
                itemSize={rowHeight}
                width="100%"
            >
                {({ index, style }: { index: number; style: CSSProperties }) => {
                    const record = dataSource[index];
                    const recordKey = getRowKey(record);
                    return (
                        <div
                            key={recordKey}
                            style={{
                                ...style,
                                display: 'flex',
                                alignItems: 'center',
                                borderBottom: '1px solid #f0f0f0',
                                cursor: onRowClick ? 'pointer' : 'default',
                            }}
                            onClick={() => onRowClick?.(record)}
                        >
                            {columns.map((col, colIndex) => {
                                const dataIndex = getColumnDataIndex(col);
                                const cellValue = dataIndex ? record[dataIndex] : undefined;
                                return (
                                    <div
                                        key={col.key as string || colIndex}
                                        style={{
                                            width: columnWidths[colIndex],
                                            padding: '8px 12px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {col.render
                                            ? (col.render(cellValue, record, index) as React.ReactNode)
                                            : String(cellValue ?? '')}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }}
            </List>
        </div>
    );
}
