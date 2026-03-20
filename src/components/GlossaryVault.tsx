
import React, { useState, useEffect } from 'react';
import { getUserGlossary, saveBrandGlossaryTerm, deleteGlossaryTerm, BrandGlossaryTerm } from '../services/culturalService';
import LanguageSelector from './LanguageSelector';
import { SearchIcon, TrashIcon, EditIcon, PlusIcon, CloseIcon, BookIcon } from './Icons';

interface GlossaryVaultProps {
    userId: string;
}

const GlossaryVault: React.FC<GlossaryVaultProps> = ({ userId }) => {
    const [terms, setTerms] = useState<BrandGlossaryTerm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLang, setFilterLang] = useState('all');
    const [filterBrand, setFilterBrand] = useState('all');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTerm, setEditingMessageId] = useState<BrandGlossaryTerm | null>(null);
    const [formData, setFormData] = useState<Partial<BrandGlossaryTerm>>({
        term: '',
        brand_name: '',
        source_lang: 'en',
        target_lang: 'sw',
        preferred_translation: '',
        forbidden_terms: [],
        context_note: ''
    });
    const [forbiddenInput, setForbiddenInput] = useState('');

    useEffect(() => {
        loadGlossary();
    }, [userId]);

    const loadGlossary = async () => {
        setIsLoading(true);
        try {
            const data = await getUserGlossary(userId);
            setTerms(data as BrandGlossaryTerm[]);
        } catch (err) {
            console.error('Failed to load glossary:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const termToSave = {
                ...formData,
                forbidden_terms: forbiddenInput.split(',').map(t => t.trim()).filter(t => t)
            } as BrandGlossaryTerm;
            
            await saveBrandGlossaryTerm(userId, termToSave);
            setIsModalOpen(false);
            resetForm();
            loadGlossary();
        } catch (err) {
            console.error('Failed to save term:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this term?')) return;
        try {
            await deleteGlossaryTerm(id);
            loadGlossary();
        } catch (err) {
            console.error('Failed to delete term:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            term: '',
            brand_name: '',
            source_lang: 'en',
            target_lang: 'sw',
            preferred_translation: '',
            forbidden_terms: [],
            context_note: ''
        });
        setForbiddenInput('');
        setEditingMessageId(null);
    };

    const openEdit = (term: BrandGlossaryTerm) => {
        setEditingMessageId(term);
        setFormData(term);
        setForbiddenInput(term.forbidden_terms.join(', '));
        setIsModalOpen(true);
    };

    const filteredTerms = terms.filter(t => {
        const matchesSearch = t.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.brand_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLang = filterLang === 'all' || t.target_lang === filterLang || t.source_lang === filterLang;
        const matchesBrand = filterBrand === 'all' || t.brand_name === filterBrand;
        return matchesSearch && matchesLang && matchesBrand;
    });

    const uniqueBrands = Array.from(new Set(terms.map(t => t.brand_name).filter(Boolean)));

    return (
        <div className="flex flex-col h-full animate-fade-in p-6 max-w-7xl mx-auto overflow-hidden">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8 bg-bg-surface p-6 rounded-2xl border border-white/5 shadow-xl">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Glossary Vault</h1>
                    <p className="text-text-secondary mt-1">Your enterprise brand memory and terminology consistency center.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-bg-main font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
                >
                    <PlusIcon className="w-5 h-5" /> ADD NEW TERM
                </button>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Search terms or brands..." 
                        className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="px-4 py-3 bg-bg-surface border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                    value={filterLang}
                    onChange={e => setFilterLang(e.target.value)}
                >
                    <option value="all">All Languages</option>
                    <option value="en">English (EN)</option>
                    <option value="sw">Swahili (SW)</option>
                    <option value="zu">Zulu (ZU)</option>
                    <option value="yo">Yoruba (YO)</option>
                </select>
                <select 
                    className="px-4 py-3 bg-bg-surface border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                    value={filterBrand}
                    onChange={e => setFilterBrand(e.target.value)}
                >
                    <option value="all">All Brands</option>
                    {uniqueBrands.map(b => <option key={b} value={b as string}>{b}</option>)}
                </select>
            </div>

            {/* TERMS TABLE */}
            <div className="flex-1 min-h-0 bg-bg-surface rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                <th className="px-6 py-4">Term</th>
                                <th className="px-6 py-4">Context</th>
                                <th className="px-6 py-4">Languages</th>
                                <th className="px-6 py-4">Preferred Translation</th>
                                <th className="px-6 py-4">Forbidden Terms</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTerms.map(term => (
                                <tr key={term.id} className="hover:bg-white/2 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{term.term}</div>
                                        {term.brand_name && <div className="text-[9px] text-accent uppercase font-black mt-0.5">{term.brand_name}</div>}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-[11px] text-text-secondary truncate" title={term.context_note}>{term.context_note || '—'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono text-text-primary uppercase">
                                            {term.source_lang} → {term.target_lang}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white font-medium">
                                        {term.preferred_translation}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {term.forbidden_terms?.map((f, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold rounded-full">
                                                    {f}
                                                </span>
                                            )) || '—'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => openEdit(term)} className="p-2 text-text-secondary hover:text-accent transition-colors"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => term.id && handleDelete(term.id)} className="p-2 text-text-secondary hover:text-red-400 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTerms.length === 0 && !isLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                            <BookIcon className="w-10 h-10 text-text-secondary opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-white">No terms yet</h3>
                        <p className="text-text-secondary mt-2 max-w-xs mx-auto">Add your first brand term to build your organization's custom glossary memory.</p>
                        <button 
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="mt-6 px-6 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-accent hover:text-bg-main transition-all font-bold"
                        >
                            + Add First Term
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">{editingTerm ? 'Edit Term' : 'Add New Brand Term'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-white transition-colors"><CloseIcon className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Brand / Project Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-bg-main border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                                        placeholder="e.g. AfriBank, GlobalHealth..."
                                        value={formData.brand_name}
                                        onChange={e => setFormData({...formData, brand_name: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Source Language</label>
                                    <LanguageSelector label="" value={formData.source_lang || 'en'} onChange={val => setFormData({...formData, source_lang: val})} />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Target Language</label>
                                    <LanguageSelector label="" value={formData.target_lang || 'sw'} onChange={val => setFormData({...formData, target_lang: val})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Primary Term (English/Source)*</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-3 bg-bg-main border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                                        placeholder="e.g. Account Balance"
                                        value={formData.term}
                                        onChange={e => setFormData({...formData, term: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Preferred Translation*</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-3 bg-bg-main border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none border-accent/30"
                                        placeholder="e.g. Salio la Akaunti"
                                        value={formData.preferred_translation}
                                        onChange={e => setFormData({...formData, preferred_translation: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Forbidden Terms (Comma separated)</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-bg-main border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                                        placeholder="Balance, Fedha za akaunti..."
                                        value={forbiddenInput}
                                        onChange={e => setForbiddenInput(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Context / Usage Notes</label>
                                    <textarea 
                                        className="w-full px-4 py-3 bg-bg-main border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-accent outline-none resize-none h-24"
                                        placeholder="Only use this in formal banking documents..."
                                        value={formData.context_note}
                                        onChange={e => setFormData({...formData, context_note: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/5 text-text-secondary font-bold rounded-xl hover:text-white transition-all">CANCEL</button>
                                <button type="submit" className="flex-1 py-3 bg-accent text-bg-main font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">SAVE TERM</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlossaryVault;
