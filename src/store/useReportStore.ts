import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Report } from '../types';

interface ReportState {
    reports: Report[];
    addReport: (report: Omit<Report, 'id' | 'status' | 'createdAt'>) => void;
    updateReportStatus: (id: string, status: Report['status']) => void;
}

export const useReportStore = create<ReportState>()(
    persist(
        (set) => ({
            reports: [],
            addReport: (report) => set((state) => ({
                reports: [
                    {
                        ...report,
                        id: Math.random().toString(36).substr(2, 9),
                        status: 'pending',
                        createdAt: new Date()
                    },
                    ...state.reports
                ]
            })),
            updateReportStatus: (id, status) => set((state) => ({
                reports: state.reports.map(r => r.id === id ? { ...r, status } : r)
            })),
        }),
        {
            name: 'bite-buddy-reports',
            storage: createJSONStorage(() => ({
                getItem: async (name) => {
                    const str = await AsyncStorage.getItem(name);
                    if (!str) return null;
                    return JSON.parse(str, (key, value) => {
                        if (key === 'createdAt') return new Date(value);
                        return value;
                    });
                },
                setItem: (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
                removeItem: (name) => AsyncStorage.removeItem(name),
            })),
        }
    )
);
