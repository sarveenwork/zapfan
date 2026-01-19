'use client';

import { useEffect, useState } from 'react';
import { getAllItems, createItem, updateItem, deleteItem } from '@/app/actions/items';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface Item {
    id: string;
    name: string;
    price: number;
    is_active: boolean;
}

export default function ItemsPage() {
    const { showSuccess, showError } = useToast();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadItems();
    }, []);

    async function loadItems() {
        setLoading(true);
        const result = await getAllItems();
        if (result.success && result.data) {
            setItems(result.data);
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = editingItem
            ? await updateItem(formData)
            : await createItem(formData);

        if (result.success) {
            setShowModal(false);
            setEditingItem(null);
            showSuccess(editingItem ? 'Item updated successfully' : 'Item created successfully');
            loadItems();
        } else {
            showError(result.error || `Failed to ${editingItem ? 'update' : 'create'} item`);
        }
    }

    function handleDeleteClick(itemId: string) {
        setItemToDelete(itemId);
        setShowDeleteConfirm(true);
    }

    async function handleDeleteConfirm() {
        if (!itemToDelete) return;

        setShowDeleteConfirm(false);
        const formData = new FormData();
        formData.append('id', itemToDelete);
        const result = await deleteItem(formData);

        if (result.success) {
            showSuccess('Item deleted successfully');
            loadItems();
        } else {
            showError(result.error || 'Failed to delete item');
        }
        setItemToDelete(null);
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold" style={{ color: '#333333' }}>Items</h1>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setShowModal(true);
                        }}
                        className="text-white px-4 py-2 rounded-md transition-colors"
                        style={{ backgroundColor: '#FF6F3C', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF8F5C'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6F3C'}
                    >
                        Create Item
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            RM {item.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={item.is_active ? {
                                                    backgroundColor: '#4CAF50',
                                                    color: '#ffffff'
                                                } : {
                                                    backgroundColor: '#FF4C4C',
                                                    color: '#ffffff'
                                                }}
                                            >
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setShowModal(true);
                                                }}
                                                className="transition-colors"
                                                style={{ color: '#FF6F3C' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#FF8F5C'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#FF6F3C'}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(item.id)}
                                                className="transition-colors"
                                                style={{ color: '#FF4C4C', cursor: 'pointer' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#CC0000'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#FF4C4C'}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">
                                {editingItem ? 'Edit Item' : 'Create Item'}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                {editingItem && (
                                    <input type="hidden" name="id" value={editingItem.id} />
                                )}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Item Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        defaultValue={editingItem?.name || ''}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price (RM)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        step="0.01"
                                        min="0"
                                        defaultValue={editingItem?.price || ''}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            defaultChecked={editingItem ? editingItem.is_active !== false : true}
                                            value="on"
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Active</span>
                                    </label>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingItem(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-md"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white rounded-md transition-colors"
                                        style={{ backgroundColor: '#FF6F3C', cursor: 'pointer' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF8F5C'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6F3C'}
                                    >
                                        {editingItem ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteConfirm}
                    title="Delete Item"
                    message="Are you sure you want to delete this item? This will soft delete the item and cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmColor="danger"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => {
                        setShowDeleteConfirm(false);
                        setItemToDelete(null);
                    }}
                />
            </div>
        </div>
    );
}
