declare module 'react-window' {
    import { ComponentType, CSSProperties, ReactNode } from 'react';

    export interface ListChildComponentProps {
        index: number;
        style: CSSProperties;
        data?: any;
    }

    export interface ListProps {
        children: ComponentType<ListChildComponentProps> | ((props: ListChildComponentProps) => ReactNode);
        height: number;
        itemCount: number;
        itemSize: number | ((index: number) => number);
        width: number | string;
        className?: string;
        direction?: 'ltr' | 'rtl';
        initialScrollOffset?: number;
        itemData?: any;
        itemKey?: (index: number, data: any) => string | number;
        layout?: 'horizontal' | 'vertical';
        onItemsRendered?: (props: {
            overscanStartIndex: number;
            overscanStopIndex: number;
            visibleStartIndex: number;
            visibleStopIndex: number;
        }) => void;
        onScroll?: (props: {
            scrollDirection: 'forward' | 'backward';
            scrollOffset: number;
            scrollUpdateWasRequested: boolean;
        }) => void;
        outerRef?: React.Ref<any>;
        innerRef?: React.Ref<any>;
        overscanCount?: number;
        style?: CSSProperties;
    }

    export interface GridChildComponentProps {
        columnIndex: number;
        rowIndex: number;
        style: CSSProperties;
        data?: any;
    }

    export interface GridProps {
        children: ComponentType<GridChildComponentProps> | ((props: GridChildComponentProps) => ReactNode);
        columnCount: number;
        columnWidth: number | ((index: number) => number);
        height: number;
        rowCount: number;
        rowHeight: number | ((index: number) => number);
        width: number;
        className?: string;
        direction?: 'ltr' | 'rtl';
        initialScrollLeft?: number;
        initialScrollTop?: number;
        itemData?: any;
        itemKey?: (params: { columnIndex: number; rowIndex: number; data: any }) => string | number;
        onItemsRendered?: (props: {
            overscanColumnStartIndex: number;
            overscanColumnStopIndex: number;
            overscanRowStartIndex: number;
            overscanRowStopIndex: number;
            visibleColumnStartIndex: number;
            visibleColumnStopIndex: number;
            visibleRowStartIndex: number;
            visibleRowStopIndex: number;
        }) => void;
        onScroll?: (props: {
            horizontalScrollDirection: 'forward' | 'backward';
            scrollLeft: number;
            scrollTop: number;
            scrollUpdateWasRequested: boolean;
            verticalScrollDirection: 'forward' | 'backward';
        }) => void;
        outerRef?: React.Ref<any>;
        innerRef?: React.Ref<any>;
        overscanColumnCount?: number;
        overscanRowCount?: number;
        style?: CSSProperties;
    }

    export const List: ComponentType<ListProps>;
    export const Grid: ComponentType<GridProps>;
    export function getScrollbarSize(recalculate?: boolean): number;
}
