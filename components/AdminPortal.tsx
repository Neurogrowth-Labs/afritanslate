
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { LibraryItem, User, LibraryItemType, UserPlan } from '../types';
import { LANGUAGES, TONES } from '../constants';
import { SearchIcon, LogoutIcon, TrashIcon, DashboardIcon, LibraryIcon, UsersIcon, EditIcon, CloseIcon } from './Icons';
import ToneSelector from './ToneSelector';

type AdminView = 'dashboard' | 'library' | 'users';
const ITEMS_PER_PAGE = 10;

// --- PROPS & HELPER COMPONENTS --- //

interface AdminPortalProps {
    currentLibrary: LibraryItem[];
    users: User[];
    onAddItem: (item: Omit<LibraryItem, 'id'>) => void;
    onUpdateItem: (item: LibraryItem) => void;
    onDeleteItem: (itemId: number) => void;
    onLogout: () => void;
    currentUser: User;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-bg-surface p-6 rounded-xl border border-border-default flex items-center gap-4">
        <div className="bg-border-default p-3 rounded-lg text-accent">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// --- SUB-COMPONENTS FOR EACH VIEW --- //

const Dashboard: React.FC<{ users: User[], library: LibraryItem[] }> = ({ users, library }) => {
    const planDistribution = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.plan] = (acc[user.plan] || 0) + 1;
            return acc;
        }, {} as Record<UserPlan, number>);
    }, [users]);
    
    const recentUsers = useMemo(() => [...users].sort((a,b) => b.id - a.id).slice(0, 5), [users]);
    const recentItems = useMemo(() => [...library].sort((a,b) => b.id - a.id).slice(0, 5), [library]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Application Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Total Users" value={users.length} icon={<UsersIcon className="w-6 h-6" />} />
                    <StatCard title="Total Library Items" value={library.length} icon={<LibraryIcon className="w-6 h-6" />} />
                </div>
            </div>
            
             <div>
                <h2 className="text-2xl font-bold text-white mb-4">User Plan Distribution</h2>
                <div className="bg-bg-surface p-6 rounded-xl border border-border-default grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(planDistribution).map(([plan, count]) => (
                        <div key={plan} className="text-center">
                            <p className="text-3xl font-bold text-accent">{count}</p>
                            <p className="text-sm text-text-secondary">{plan}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                    <div className="bg-bg-surface p-6 rounded-xl border border-border-default space-y-3">
                         <h3 className="text-lg font-semibold text-text-primary">Newest Library Items</h3>
                         {recentItems.map(item => (
                             <div key={item.id} className="text-sm border-b border-border-default/50 pb-2 last:border-b-0 last:pb-0">
                                 <p className="font-semibold text-white truncate">"{item.text}"</p>
                                 <p className="text-xs text-text-secondary">{item.type} - {item.source.toUpperCase()}&rarr;{item.target.toUpperCase()}</p>
                             </div>
                         ))}
                    </div>
                </div>
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-4">&nbsp;</h2>
                    <div className="bg-bg-surface p-6 rounded-xl border border-border-default space-y-3">
                        <h3 className="text-lg font-semibold text-text-primary">Newest Users</h3>
                        {recentUsers.map(user => (
                            <div key={user.id} className="text-sm border-b border-border-default/50 pb-2 last:border-b-0 last:pb-0">
                                <p className="font-semibold text-white">{user.name}</p>
                                <p className="text-xs text-text-secondary">{user.email} - <span className="font-medium text-accent/80">{user.plan}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LibraryManager: React.FC<Omit<AdminPortalProps, 'users' | 'onLogout' | 'currentUser'>> = ({ currentLibrary, onAddItem, onUpdateItem, onDeleteItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);

    const filteredLibrary = useMemo(() => {
        return currentLibrary.filter(item =>
            item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [currentLibrary, searchTerm]);

    const totalPages = Math.ceil(filteredLibrary.length / ITEMS_PER_PAGE);
    const paginatedLibrary = useMemo(() => {
        return filteredLibrary.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredLibrary, currentPage]);
    
    const handleSaveItem = (itemData: LibraryItem | Omit<LibraryItem, 'id'>) => {
        if ('id' in itemData) {
            onUpdateItem(itemData);
        } else {
            onAddItem(itemData);
        }
        setEditingItem(null);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">Manage Library</h2>
                <button onClick={() => setEditingItem({} as LibraryItem)} className="px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 transition-colors">
                    Add New Item
                </button>
            </div>
             <div className="relative mb-4">
                <SearchIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Search library..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full p-2 pl-10 bg-bg-surface border border-border-default rounded-md focus:ring-2 focus:ring-accent"
                />
            </div>
            <div className="bg-bg-surface rounded-xl border border-border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-border-default/50 text-xs text-text-secondary uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Text</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Meaning</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLibrary.map(item => (
                                <tr key={item.id} className="border-b border-border-default last:border-b-0 hover:bg-border-default/30">
                                    <td className="px-6 py-4 font-medium text-white max-w-xs truncate">{item.text}</td>
                                    <td className="px-6 py-4">{item.type}</td>
                                    <td className="px-6 py-4 text-text-secondary max-w-xs truncate">{item.meaning}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => setEditingItem(item)} className="p-2 text-text-secondary hover:text-accent"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onDeleteItem(item.id)} className="p-2 text-text-secondary hover:text-red-500"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-bg-surface rounded-md disabled:opacity-50">Previous</button>
                    <span className="text-sm text-text-secondary">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-bg-surface rounded-md disabled:opacity-50">Next</button>
                </div>
            )}
            {editingItem && (
                <LibraryForm 
                    item={editingItem} 
                    onSave={handleSaveItem} 
                    onClose={() => setEditingItem(null)} 
                />
            )}
        </div>
    );
};

const UserManager: React.FC<{ users: User[] }> = ({ users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    return (
         <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
            <div className="relative mb-4">
                <SearchIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full p-2 pl-10 bg-bg-surface border border-border-default rounded-md focus:ring-2 focus:ring-accent"
                />
            </div>
            <div className="bg-bg-surface rounded-xl border border-border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-border-default/50 text-xs text-text-secondary uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Plan</th>
                                <th scope="col" className="px-6 py-3">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                             {paginatedUsers.map(user => (
                                <tr key={user.id} className="border-b border-border-default last:border-b-0 hover:bg-border-default/30">
                                    <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                                    <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                                    <td className="px-6 py-4"><span className="bg-accent/20 text-accent text-xs font-semibold px-2 py-1 rounded-full">{user.plan}</span></td>
                                    <td className="px-6 py-4 text-text-secondary capitalize">{user.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-bg-surface rounded-md disabled:opacity-50">Previous</button>
                    <span className="text-sm text-text-secondary">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-bg-surface rounded-md disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
};

// FIX: Defined the ITEM_TYPES constant.
const ITEM_TYPES: LibraryItemType[] = ['Proverb', 'Idiom', 'Word', 'Phrase', 'Sentence', 'Paragraph'];

const LibraryForm: React.FC<{ item: LibraryItem | Omit<LibraryItem, 'id'>, onSave: (data: any) => void, onClose: () => void }> = ({ item, onSave, onClose }) => {
    const isEditing = 'id' in item && item.id > 0;
    const [formData, setFormData] = useState<Omit<LibraryItem, 'id'>>({
        type: 'Proverb', text: '', meaning: '', source: 'en', target: 'sw', tone: 'Friendly', audioUrl: undefined,
        ...item
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(isEditing ? { ...formData, id: item.id } : formData);
    };

    return (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-surface rounded-xl shadow-2xl w-full max-w-lg border border-border-default m-4" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-border-default flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">{isEditing ? 'Edit Library Item' : 'Add New Library Item'}</h3>
                        <button type="button" onClick={onClose}><CloseIcon className="w-6 h-6 text-text-secondary"/></button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label>Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full mt-1 p-2 bg-bg-main border border-border-default rounded-md">
                                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                         <div>
                            <label>Text</label>
                            <textarea name="text" value={formData.text} onChange={handleChange} rows={2} className="w-full mt-1 p-2 bg-bg-main border border-border-default rounded-md"/>
                        </div>
                        <div>
                            <label>Meaning</label>
                            <textarea name="meaning" value={formData.meaning} onChange={handleChange} rows={3} className="w-full mt-1 p-2 bg-bg-main border border-border-default rounded-md"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label>Source Lang</label>
                                <select name="source" value={formData.source} onChange={handleChange} className="w-full mt-1 p-2 bg-bg-main border border-border-default rounded-md">
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Target Lang</label>
                                <select name="target" value={formData.target} onChange={handleChange} className="w-full mt-1 p-2 bg-bg-main border border-border-default rounded-md">
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                         <div>
                            <ToneSelector label="Tone" tones={TONES} value={formData.tone} onChange={(v) => setFormData(p => ({...p, tone: v}))} />
                        </div>
                    </div>
                    <div className="p-6 bg-bg-main/50 rounded-b-xl flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-border-default rounded-md font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-accent text-white rounded-md font-semibold">Save Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- MAIN PORTAL COMPONENT --- //

const AdminPortal: React.FC<AdminPortalProps> = ({ currentLibrary, users, onAddItem, onUpdateItem, onDeleteItem, onLogout, currentUser }) => {
    const [view, setView] = useState<AdminView>('dashboard');

    const renderView = () => {
        switch (view) {
            case 'library':
                return <LibraryManager currentLibrary={currentLibrary} onAddItem={onAddItem} onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem} />;
            case 'users':
                return <UserManager users={users} />;
            case 'dashboard':
            default:
                return <Dashboard users={users} library={currentLibrary} />;
        }
    };
    
    const NavLink: React.FC<{ targetView: AdminView; label: string; icon: React.ReactNode }> = ({ targetView, label, icon }) => {
        const isActive = view === targetView;
        return (
            <button
                onClick={() => setView(targetView)}
                className={`flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:bg-border-default hover:text-white'}`}
            >
                {icon}
                {label}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-bg-main text-text-primary font-sans flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-bg-surface p-4 flex-col border-r border-border-default hidden md:flex">
                <div className="flex items-center gap-3 mb-8">
                     <div className="w-9 h-9 rounded-full bg-bg-main flex items-center justify-center border-2 border-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-accent"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path></svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Admin Portal</h1>
                        <p className="text-xs text-text-secondary">AfriTranslate AI</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavLink targetView="dashboard" label="Dashboard" icon={<DashboardIcon className="w-5 h-5" />} />
                    <NavLink targetView="library" label="Library" icon={<LibraryIcon className="w-5 h-5" />} />
                    <NavLink targetView="users" label="Users" icon={<UsersIcon className="w-5 h-5" />} />
                </nav>
                 <div className="mt-auto">
                    <div className="border-t border-border-default pt-4 flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">{currentUser.name.charAt(0)}</div>
                         <div>
                            <p className="font-semibold text-white text-sm">{currentUser.name}</p>
                            <button onClick={onLogout} className="text-xs text-text-secondary hover:text-red-400 transition-colors">Log Out</button>
                         </div>
                    </div>
                 </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen">
                <header className="flex md:hidden items-center justify-between p-4 border-b border-border-default bg-bg-surface">
                    <h1 className="text-lg font-bold text-white">Admin Portal</h1>
                     <button onClick={onLogout}><LogoutIcon /></button>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {renderView()}
                </main>
                 <nav className="flex md:hidden justify-around p-2 border-t border-border-default bg-bg-surface">
                    <button onClick={() => setView('dashboard')} className={`p-2 rounded-md ${view === 'dashboard' ? 'text-accent' : 'text-text-secondary'}`}><DashboardIcon className="w-6 h-6" /></button>
                    <button onClick={() => setView('library')} className={`p-2 rounded-md ${view === 'library' ? 'text-accent' : 'text-text-secondary'}`}><LibraryIcon className="w-6 h-6" /></button>
                    <button onClick={() => setView('users')} className={`p-2 rounded-md ${view === 'users' ? 'text-accent' : 'text-text-secondary'}`}><UsersIcon className="w-6 h-6" /></button>
                </nav>
            </div>
        </div>
    );
};

export default AdminPortal;
