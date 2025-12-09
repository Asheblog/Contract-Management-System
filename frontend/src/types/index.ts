export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'user';
    avatar?: string;
    viewPreferences?: string[];
    createdAt?: string;
}

export interface Tag {
    id: number;
    name: string;
    color: string;
}

export interface Contract {
    id: number;
    name: string;
    partner: string;
    signDate: string;
    expireDate: string;
    status: 'active' | 'archived' | 'void';
    isProcessed: boolean;
    customData: Record<string, any>;
    tags: string[]; // Array of tag names
    sortOrder: number;
    createdBy: {
        id: number;
        name: string;
        email: string;
    };
    attachments: Attachment[];
    logs?: AuditLog[];
    createdAt: string;
    updatedAt: string;
}

export interface Attachment {
    id: number;
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export interface AuditLog {
    id: number;
    action: string;
    details: string;
    user: {
        id: number;
        name: string;
    };
    createdAt: string;
}

export interface ContractField {
    id: number;
    key: string;
    label: string;
    type: 'text' | 'number' | 'date';
    isVisible: boolean;
    isSystem: boolean;
    order: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface SmtpSettings {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}

export interface ReminderSettings {
    emailEnabled: boolean;
    reminderDays: number[];
    repeatReminder: boolean;
    repeatIntervalDays: number;
}

