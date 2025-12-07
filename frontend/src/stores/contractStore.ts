import { create } from 'zustand';
import api from '../services/api';
import { Contract, ContractField, PaginatedResponse } from '../types';

interface ContractState {
    contracts: Contract[];
    total: number;
    page: number;
    loading: boolean;
    fields: ContractField[];
    expiringContracts: Contract[];

    fetchContracts: (params?: { status?: string; search?: string; page?: number; sortField?: string; sortOrder?: 'asc' | 'desc' }) => Promise<void>;
    fetchContract: (id: number) => Promise<Contract>;
    createContract: (data: any) => Promise<Contract>;
    updateContract: (id: number, data: any) => Promise<Contract>;
    deleteContract: (id: number) => Promise<void>;
    markProcessed: (id: number) => Promise<void>;
    fetchFields: () => Promise<void>;
    fetchExpiringContracts: () => Promise<void>;
}

export const useContractStore = create<ContractState>((set, get) => ({
    contracts: [],
    total: 0,
    page: 1,
    loading: false,
    fields: [],
    expiringContracts: [],

    fetchContracts: async (params = {}) => {
        set({ loading: true });
        try {
            const response = await api.get<PaginatedResponse<Contract>>('/contracts', { params });
            set({
                contracts: response.data.data,
                total: response.data.total,
                page: response.data.page,
                loading: false,
            });
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    fetchContract: async (id: number) => {
        const response = await api.get<Contract>(`/contracts/${id}`);
        return response.data;
    },

    createContract: async (data: any) => {
        const response = await api.post<Contract>('/contracts', data);
        await get().fetchContracts({ page: get().page });
        return response.data;
    },

    updateContract: async (id: number, data: any) => {
        const response = await api.put<Contract>(`/contracts/${id}`, data);
        await get().fetchContracts({ page: get().page });
        return response.data;
    },

    deleteContract: async (id: number) => {
        await api.delete(`/contracts/${id}`);
        await get().fetchContracts({ page: get().page });
    },

    markProcessed: async (id: number) => {
        await api.put(`/contracts/${id}/process`);
        await get().fetchContracts({ page: get().page });
        await get().fetchExpiringContracts();
    },

    fetchFields: async () => {
        const response = await api.get<ContractField[]>('/contract-fields');
        set({ fields: response.data });
    },

    fetchExpiringContracts: async () => {
        const response = await api.get<Contract[]>('/contracts/expiring', { params: { days: 30 } });
        set({ expiringContracts: response.data });
    },
}));
