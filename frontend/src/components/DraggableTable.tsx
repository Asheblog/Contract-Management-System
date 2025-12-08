import React from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';

interface DraggableTableProps<T> extends TableProps<T> {
    onDragEnd: (activeId: string | number, overId: string | number) => void;
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
}

const DraggableRow = ({ children, ...props }: RowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    return (
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(children, (child) => {
                if ((child as React.ReactElement).key === 'sort') {
                    return React.cloneElement(child as React.ReactElement, {
                        children: (
                            <HolderOutlined
                                style={{ cursor: 'grab', color: '#999' }}
                                {...listeners}
                            />
                        ),
                    });
                }
                return child;
            })}
        </tr>
    );
};

export default function DraggableTable<T extends { id: number | string }>({
    dataSource = [],
    columns = [],
    onDragEnd,
    ...props
}: DraggableTableProps<T>) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onDragEnd(active.id, over.id);
        }
    };

    // Add drag handle column
    const columnsWithDrag = [
        {
            key: 'sort',
            width: 40,
            render: () => <HolderOutlined style={{ cursor: 'grab', color: '#999' }} />,
        },
        ...columns,
    ];

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={dataSource.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <Table
                    {...props}
                    dataSource={dataSource}
                    columns={columnsWithDrag}
                    components={{
                        body: {
                            row: DraggableRow,
                        },
                    }}
                />
            </SortableContext>
        </DndContext>
    );
}
