'use client';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'danger',
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const confirmButtonStyle =
        confirmColor === 'danger'
            ? {
                  backgroundColor: '#FF4C4C',
                  color: '#ffffff',
              }
            : {
                  backgroundColor: '#FF6F3C',
                  color: '#ffffff',
              };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold" style={{ color: '#333333' }}>
                        {title}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <p className="text-sm" style={{ color: '#777777' }}>
                        {message}
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md transition-colors disabled:opacity-50"
                        style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-md transition-colors disabled:opacity-50 text-white font-medium"
                        style={{
                            ...confirmButtonStyle,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                if (confirmColor === 'danger') {
                                    e.currentTarget.style.backgroundColor = '#CC0000';
                                } else {
                                    e.currentTarget.style.backgroundColor = '#FF8F5C';
                                }
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                if (confirmColor === 'danger') {
                                    e.currentTarget.style.backgroundColor = '#FF4C4C';
                                } else {
                                    e.currentTarget.style.backgroundColor = '#FF6F3C';
                                }
                            }
                        }}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
