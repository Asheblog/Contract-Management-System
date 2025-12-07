import { useRef, useEffect, useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, Spin, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';

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

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const record = dataSource[index];
        return (
            <div
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: onRowClick ? 'pointer' : 'default',
                }}
                onClick={() => onRowClick?.(record)}
            >
                {columns.map((col, colIndex) => (
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
                            ? col.render(record[col.dataIndex as keyof T], record, index)
                            : String(record[col.dataIndex as keyof T] ?? '')}
                    </div>
                ))}
            </div>
        );
    };

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
                {Row}
            </List>
        </div>
    );
}
