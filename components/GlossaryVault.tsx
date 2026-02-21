
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookIcon, EditIcon, TrashIcon, CheckIcon, CloseIcon, ShieldIcon } from './Icons';

interface GlossaryEntry {
    id?: number;
    term: string;
    translation: string;
    language: string;
    category: string;
    notes?: string;
    forbidden_alternatives?: string[];
    created_at?: string;
}

interface GlossaryVaultProps {
    userId?: string;
}

const CATEGORIES = [
    'Brand Terms', 'Product Names', 'Legal Terms', 'Technical Jargon', 
    'Marketing Phrases', 'Cultural Terms', 'AfCFTA Trade', 'Compliance'
];

const GlossaryVault: React.FC<GlossaryVaultProps> = ({ userId }) => {
    const [entries, setEntries] = useState<GlossaryEntry[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [newEntry, setNewEntry] = useState<GlossaryEntry>({
        term: '',
        translation: '',
        language: 'sw',
        category: 'Brand Terms',
        notes: '',
        forbidden_alternatives: []
    });

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        const { data, error } = await supabase
            .from('glossary_entries')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setEntries(data);
        }
    };

    const handleAdd = async () => {
        if (!newEntry.term || !newEntry.translation) return;

        const { error } = await supabase
            .from('glossary_entries')
            .insert([newEntry]);

        if (!error) {
            fetchEntries();
            setIsAdding(false);
            setNewEntry({
                term: '',
                translation: '',
                language: 'sw',
                category: 'Brand Terms',
                notes: '',
                forbidden_alternatives: []
            });
        }
    };

    const handleDelete = async (id: number) => {
        const { error } = await supabase
            .from('glossary_entries')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchEntries();
        }
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            entry.translation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                            <ShieldIcon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Glossary Vault</h1>
                            <p className="text-xs text-text-secondary">Enterprise brand memory & terminology enforcement</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-accent text-bg-main font-bold rounded-lg hover:bg-white hover:text-accent transition-all text-sm"
                    >
                        + Add Entry
                    </button>
                </div>
            </div>

            <div className="flex-shrink-0 px-4 py-3 bg-bg-surface/30 flex gap-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search terms..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent outline-none"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isAdding && (
                    <div className="mb-4 bg-bg-surface border border-accent/30 rounded-xl p-4 animate-fade-in">
                        <h3 className="text-sm font-bold text-white mb-3">New Glossary Entry</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={newEntry.term}
                                onChange={(e) => setNewEntry({ ...newEntry, term: e.target.value })}
                                placeholder="Term (e.g., Brand Name)"
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent outline-none"
                            />
                            <input
                                type="text"
                                value={newEntry.translation}
                                onChange={(e) => setNewEntry({ ...newEntry, translation: e.target.value })}
                                placeholder="Approved Translation"
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent outline-none"
                            />
                            <select
                                value={newEntry.language}
                                onChange={(e) => setNewEntry({ ...newEntry, language: e.target.value })}
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                            >
                                <option value="sw">Swahili</option>
                                <option value="ha">Hausa</option>
                                <option value="yo">Yoruba</option>
                                <option value="zu">Zulu</option>
                                <option value="am">Amharic</option>
                                <option value="ar">Arabic</option>
                            </select>
                            <select
                                value={newEntry.category}
                                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <textarea
                                value={newEntry.notes}
                                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                                placeholder="Notes (optional)"
                                className="col-span-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent outline-none resize-none"
                                rows={2}
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleAdd}
                                className="flex-1 px-4 py-2 bg-accent text-bg-main font-bold rounded-lg hover:bg-white hover:text-accent transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <CheckIcon className="w-4 h-4" />
                                Save Entry
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {filteredEntries.map(entry => (
                        <div key={entry.id} className="bg-bg-surface border border-white/10 rounded-xl p-4 hover:border-accent/30 transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-white">{entry.term}</h3>
                                        <span className="px-2 py-0.5 bg-accent/20 text-accent rounded text-[10px] font-bold">
                                            {entry.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-accent mb-1">→ {entry.translation}</p>
                                    {entry.notes && (
                                        <p className="text-xs text-text-secondary italic">{entry.notes}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(entry.id!)}
                                        className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredEntries.length === 0 && (
                        <div className="text-center py-12 text-text-secondary">
                            <BookIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No glossary entries found</p>
                            <p className="text-xs mt-1">Add your first term to start building your brand memory</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlossaryVault;
