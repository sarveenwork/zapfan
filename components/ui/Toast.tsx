'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setIsVisible(true);
        
        // Auto-close after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(toast.id), 300); // Wait for fade out
        }, 5000);

        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
    };

    const getStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    backgroundColor: '#4CAF50',
                    borderColor: '#45a049',
                };
            case 'error':
                return {
                    backgroundColor: '#FF4C4C',
                    borderColor: '#e63946',
                };
            case 'info':
                return {
                    backgroundColor: '#FF6F3C',
                    borderColor: '#FF8F5C',
                };
            default:
                return {
                    backgroundColor: '#777777',
                    borderColor: '#666666',
                };
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const styles = getStyles();

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] max-w-md border transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={styles}
        >
            <div className="flex-shrink-0">
                {getIcon()}
            </div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={handleClose}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                style={{ cursor: 'pointer' }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
}
