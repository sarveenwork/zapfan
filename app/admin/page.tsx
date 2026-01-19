'use client';

import { useState, useEffect } from 'react';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '@/app/actions/admin';
import { getUsers, createUser, updateUser, deleteUser } from '@/app/actions/admin';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function AdminPage() {
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
    const [companies, setCompanies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [showDeleteCompanyConfirm, setShowDeleteCompanyConfirm] = useState(false);
    const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [companiesResult, usersResult] = await Promise.all([
            getCompanies(),
            getUsers(),
        ]);

        if (companiesResult.success) {
            setCompanies(companiesResult.data || []);
        }
        if (usersResult.success) {
            setUsers(usersResult.data || []);
        }
        setLoading(false);
    }

    async function handleCreateCompany(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await createCompany(formData);
        if (result.success) {
            setShowCompanyModal(false);
            showSuccess('Company created successfully');
            loadData();
        } else {
            showError(result.error || 'Failed to create company');
        }
    }

    async function handleUpdateCompany(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await updateCompany(formData);
        if (result.success) {
            setShowCompanyModal(false);
            setEditingCompany(null);
            showSuccess('Company updated successfully');
            loadData();
        } else {
            showError(result.error || 'Failed to update company');
        }
    }

    async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await createUser(formData);
        if (result.success) {
            setShowUserModal(false);
            showSuccess('User created successfully');
            loadData();
        } else {
            showError(result.error || 'Failed to create user');
        }
    }

    async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await updateUser(formData);
        if (result.success) {
            setShowUserModal(false);
            setEditingUser(null);
            setShowEditPassword(false);
            showSuccess('User updated successfully');
            loadData();
        } else {
            showError(result.error || 'Failed to update user');
        }
    }

    function handleDeleteCompanyClick(companyId: string) {
        setCompanyToDelete(companyId);
        setShowDeleteCompanyConfirm(true);
    }

    async function handleDeleteCompanyConfirm() {
        if (!companyToDelete) return;

        setShowDeleteCompanyConfirm(false);
        const formData = new FormData();
        formData.append('id', companyToDelete);
        const result = await deleteCompany(formData);

        if (result.success) {
            showSuccess('Company deleted successfully');
            loadData();
        } else {
            showError(result.error || 'Failed to delete company');
        }
        setCompanyToDelete(null);
    }

    function handleDeleteUserClick(userId: string) {
        setUserToDelete(userId);
        setShowDeleteUserConfirm(true);
    }

    async function handleDeleteUserConfirm() {
        if (!userToDelete) return;

        setShowDeleteUserConfirm(false);
        const formData = new FormData();
        formData.append('id', userToDelete);
        const result = await deleteUser(formData);

        if (result.success) {
            showSuccess('User deleted successfully');
            loadData();
        } else {
            showError(result.error || 'Failed to delete user');
        }
        setUserToDelete(null);
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6" style={{ color: '#333333' }}>Super Admin Panel</h1>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('companies')}
                            className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                            style={activeTab === 'companies' ? {
                                borderColor: '#FF6F3C',
                                color: '#FF6F3C',
                                cursor: 'pointer'
                            } : {
                                borderColor: 'transparent',
                                color: '#777777',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== 'companies') {
                                    e.currentTarget.style.color = '#333333';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== 'companies') {
                                    e.currentTarget.style.color = '#777777';
                                }
                            }}
                        >
                            Companies
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                            style={activeTab === 'users' ? {
                                borderColor: '#FF6F3C',
                                color: '#FF6F3C',
                                cursor: 'pointer'
                            } : {
                                borderColor: 'transparent',
                                color: '#777777',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== 'users') {
                                    e.currentTarget.style.color = '#333333';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== 'users') {
                                    e.currentTarget.style.color = '#777777';
                                }
                            }}
                        >
                            Users
                        </button>
                    </nav>
                </div>

                {/* Companies Tab */}
                {activeTab === 'companies' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
                            <button
                                onClick={() => {
                                    setEditingCompany(null);
                                    setShowCompanyModal(true);
                                }}
                                className="text-white px-4 py-2 rounded-md transition-colors"
                                style={{ backgroundColor: '#FF6F3C' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF8F5C'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6F3C'}
                            >
                                Create Company
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
                                                Created At
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {companies.map((company) => (
                                            <tr key={company.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {company.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(company.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCompany(company);
                                                            setShowCompanyModal(true);
                                                        }}
                                                        className="transition-colors"
                                                        style={{ color: '#FF6F3C', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#FF8F5C'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#FF6F3C'}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCompanyClick(company.id)}
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
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Users</h2>
                            <button
                                onClick={() => {
                                    setEditingUser(null);
                                    setShowUserModal(true);
                                }}
                                className="text-white px-4 py-2 rounded-md transition-colors"
                                style={{ backgroundColor: '#FF6F3C' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF8F5C'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6F3C'}
                            >
                                Create User
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
                                                User ID / Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Company
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {user.email ? user.email.replace('@moodiefoodie.com', '').replace('@moodiefoodie.local', '') : user.id.substring(0, 8) + '...'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.role}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.companies?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setShowUserModal(true);
                                                        }}
                                                        className="transition-colors"
                                                        style={{ color: '#FF6F3C', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#FF8F5C'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#FF6F3C'}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUserClick(user.id)}
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
                    </div>
                )}

                {/* Company Modal */}
                {showCompanyModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">
                                {editingCompany ? 'Edit Company' : 'Create Company'}
                            </h3>
                            <form
                                onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany}
                            >
                                {editingCompany && (
                                    <input type="hidden" name="id" value={editingCompany.id} />
                                )}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        defaultValue={editingCompany?.name || ''}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCompanyModal(false);
                                            setEditingCompany(null);
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
                                        {editingCompany ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* User Modal */}
                {showUserModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">
                                {editingUser ? 'Edit User' : 'Create User'}
                            </h3>
                            <form
                                onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                            >
                                {editingUser && (
                                    <>
                                        <input type="hidden" name="id" value={editingUser.id} />
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                name="email"
                                                required
                                                defaultValue={editingUser.email?.replace('@moodiefoodie.com', '').replace('@moodiefoodie.local', '') || ''}
                                                placeholder="Enter username"
                                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Username will be updated (without @moodiefoodie.com)
                                            </p>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Change Password (Optional)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showEditPassword ? 'text' : 'password'}
                                                    name="password"
                                                    minLength={8}
                                                    placeholder="Leave empty to keep current password"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                    style={{ color: '#777777', cursor: 'pointer' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = '#777777'}
                                                >
                                                    {showEditPassword ? (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Enter new password to change it, or leave empty to keep current password
                                            </p>
                                        </div>
                                    </>
                                )}
                                {!editingUser && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                name="email"
                                                required
                                                placeholder="Enter username"
                                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    required
                                                    minLength={8}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                    style={{ color: '#777777', cursor: 'pointer' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = '#777777'}
                                                >
                                                    {showPassword ? (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        required
                                        defaultValue={editingUser?.role || ''}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                                    >
                                        <option value="">Select role</option>
                                        <option value="super_admin">Super Admin</option>
                                        <option value="company_admin">Company Admin</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company
                                    </label>
                                    <select
                                        name="company_id"
                                        defaultValue={editingUser?.company_id || ''}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                                    >
                                        <option value="">No company</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUserModal(false);
                                            setEditingUser(null);
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
                                        {editingUser ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Company Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteCompanyConfirm}
                    title="Delete Company"
                    message="Are you sure you want to delete this company? This will soft delete the company and cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmColor="danger"
                    onConfirm={handleDeleteCompanyConfirm}
                    onCancel={() => {
                        setShowDeleteCompanyConfirm(false);
                        setCompanyToDelete(null);
                    }}
                />

                {/* Delete User Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteUserConfirm}
                    title="Delete User"
                    message="Are you sure you want to delete this user? This will soft delete the user and cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmColor="danger"
                    onConfirm={handleDeleteUserConfirm}
                    onCancel={() => {
                        setShowDeleteUserConfirm(false);
                        setUserToDelete(null);
                    }}
                />
            </div>
        </div>
    );
}
