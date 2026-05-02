import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, PaletteIcon, SparklesIcon, DownloadIcon, CloseIcon } from '../Icons';

const TEMPLATES = [
    { id: 'township-promo', name: 'Township Promo', category: 'Marketing' },
    { id: 'afrocentric-brand', name: 'Afrocentric Brand', category: 'Branding' },
    { id: 'youth-social', name: 'Youth Social', category: 'Social' },
    { id: 'cultural-event', name: 'Cultural Event', category: 'Events' },
    { id: 'ngo-campaign', name: 'NGO Campaign', category: 'Nonprofit' },
    { id: 'market-vendor', name: 'Market Vendor', category: 'Business' },
];

const REGIONS = ['Pan-African', 'West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Central Africa'];

const SYMBOLS = [
    'Adinkra (Ghana)',
    'Kente Patterns',
    'Maasai Beadwork',
    'Ethiopian Cross',
    'Zulu Shields',
    'Berber Symbols',
    'Ancient Egyptian',
    'Swahili Calligraphy',
];

const SKIN_TONES = [
    { name: 'Light', hex: '#F1C27D' },
    { name: 'Medium', hex: '#C68642' },
    { name: 'Dark', hex: '#8D5524' },
    { name: 'Deep', hex: '#4A2511' },
];

const PALETTE_HEXES = ['#F4A300', '#C2410C', '#7C2D12', '#0F766E', '#365314', '#0E7490'];

type Status = 'idle' | 'generating' | 'preview';

interface FormState {
    prompt: string;
    template: string;
    region: string;
    symbols: string[];
    skinTones: string[];
    aspect: '1:1' | '4:5' | '16:9' | '9:16';
}

const INITIAL_FORM: FormState = {
    prompt: '',
    template: '',
    region: 'Pan-African',
    symbols: [],
    skinTones: [],
    aspect: '1:1',
};

const ASPECTS: FormState['aspect'][] = ['1:1', '4:5', '16:9', '9:16'];

const VisualArtsTab: React.FC = () => {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [status, setStatus] = useState<Status>('idle');

    const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const toggleArrayItem = (key: 'symbols' | 'skinTones', value: string) => {
        setForm(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(v => v !== value)
                : [...prev[key], value],
        }));
    };

    const handleGenerate = () => {
        if (!form.prompt.trim() && !form.template) return;
        setStatus('generating');
        // Skeleton: real image AI is wired in the next phase.
        setTimeout(() => setStatus('preview'), 1600);
    };

    const handleReset = () => {
        setStatus('idle');
        setForm(INITIAL_FORM);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-4 sm:gap-5 p-4 sm:p-6">
            {/* --- Left: Controls --- */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 space-y-5">
                <FieldGroup label="Concept">
                    <textarea
                        value={form.prompt}
                        onChange={e => update('prompt', e.target.value)}
                        placeholder="A bold pan-African celebration poster, layered Kente weaves..."
                        rows={3}
                        className="w-full bg-bg-main/60 border border-border-default rounded-xl px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition resize-none"
                    />
                </FieldGroup>

                <FieldGroup label="Template">
                    <div className="grid grid-cols-2 gap-1.5">
                        {TEMPLATES.map(t => {
                            const active = form.template === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => update('template', active ? '' : t.id)}
                                    className={`text-left px-3 py-2 rounded-lg transition border ${
                                        active
                                            ? 'bg-accent/15 border-accent/50'
                                            : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <div className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-text-primary'}`}>{t.name}</div>
                                    <div className="text-[10px] text-text-secondary uppercase tracking-wider">{t.category}</div>
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>

                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Region">
                        <SelectInput
                            value={form.region}
                            onChange={v => update('region', v)}
                            options={REGIONS}
                        />
                    </FieldGroup>
                    <FieldGroup label="Aspect">
                        <div className="grid grid-cols-4 gap-1">
                            {ASPECTS.map(a => (
                                <button
                                    key={a}
                                    onClick={() => update('aspect', a)}
                                    className={`px-1.5 py-1.5 rounded-lg text-[11px] font-medium transition border ${
                                        form.aspect === a
                                            ? 'bg-accent/15 border-accent/50 text-white'
                                            : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </FieldGroup>
                </div>

                <FieldGroup label="Cultural Symbols">
                    <div className="flex flex-wrap gap-1.5">
                        {SYMBOLS.map(s => {
                            const active = form.symbols.includes(s);
                            return (
                                <button
                                    key={s}
                                    onClick={() => toggleArrayItem('symbols', s)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                                        active
                                            ? 'bg-accent/15 border-accent/50 text-white'
                                            : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>

                <FieldGroup label="Skin Tones">
                    <div className="flex gap-2">
                        {SKIN_TONES.map(t => {
                            const active = form.skinTones.includes(t.name);
                            return (
                                <button
                                    key={t.name}
                                    onClick={() => toggleArrayItem('skinTones', t.name)}
                                    className={`flex-1 rounded-lg p-2 border transition flex flex-col items-center gap-1 ${
                                        active ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                                    }`}
                                    aria-pressed={active}
                                >
                                    <span
                                        className="w-6 h-6 rounded-full border border-white/20"
                                        style={{ background: t.hex }}
                                    />
                                    <span className="text-[10px] text-text-secondary">{t.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>

                <FieldGroup label="Style Suggestions">
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-[11px] text-text-secondary flex items-start gap-2">
                        <SparklesIcon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <p>
                            Cultural style suggestions and pattern generation will populate here once AI is wired up. The skeleton ships first; real Gemini suggestions are next.
                        </p>
                    </div>
                </FieldGroup>

                <button
                    onClick={handleGenerate}
                    disabled={(!form.prompt.trim() && !form.template) || status === 'generating'}
                    className="w-full rounded-xl px-4 py-3 text-[13px] font-bold tracking-wide text-white bg-gradient-to-r from-accent to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_10px_40px_-12px_rgba(244,163,0,0.7)]"
                >
                    {status === 'generating' ? 'Composing artwork...' : 'Generate Visual'}
                </button>
            </section>

            {/* --- Right: Preview --- */}
            <section className="relative min-h-[420px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl overflow-hidden flex flex-col">
                <div className="absolute inset-0 pointer-events-none opacity-50">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl" />
                </div>

                <div className="relative z-10 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                        <PaletteIcon className="w-4 h-4 text-accent" />
                        <span>Visual preview</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-text-secondary/70">
                        {form.aspect} · {form.region}
                    </span>
                </div>

                <div className="relative z-10 flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {status === 'idle' && <IdleState />}
                        {status === 'generating' && <GeneratingState />}
                        {status === 'preview' && (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="relative rounded-xl border border-white/10 overflow-hidden group"
                                            style={{ aspectRatio: form.aspect.replace(':', '/') }}
                                        >
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background: `linear-gradient(135deg, ${PALETTE_HEXES[i % PALETTE_HEXES.length]}, ${PALETTE_HEXES[(i + 2) % PALETTE_HEXES.length]})`,
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.18),_transparent_60%)]" />
                                            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                                                <span className="text-[10px] uppercase tracking-wider text-white/80 bg-black/30 backdrop-blur px-2 py-0.5 rounded-full">
                                                    Variation {i + 1}
                                                </span>
                                                <button
                                                    title="Download (mock)"
                                                    className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg bg-black/40 text-white/80 hover:text-white"
                                                >
                                                    <DownloadIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                    <h4 className="text-[12px] font-bold text-white mb-1.5">Design Brief</h4>
                                    <p className="text-[12px] text-text-secondary leading-relaxed">
                                        Mock placeholder for the AI design rationale. The next phase wires Gemini for cultural style suggestions and pattern generation, with citations to regional motifs.
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-text-secondary border border-white/10 bg-white/[0.02] hover:text-text-primary hover:bg-white/[0.05] transition"
                                    >
                                        <CloseIcon className="w-3.5 h-3.5" /> Reset
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
};

const IdleState: React.FC = () => (
    <motion.div
        key="idle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col items-center justify-center text-center gap-3 py-12"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-accent/80" />
        </div>
        <h3 className="text-base font-bold text-white">Compose your first piece</h3>
        <p className="text-[12px] text-text-secondary max-w-md">
            Pick a template, layer cultural symbols, and tap Generate. The skeleton renders mock variations so you can preview the layout.
        </p>
    </motion.div>
);

const GeneratingState: React.FC = () => (
    <motion.div
        key="gen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
        {[0, 1, 2, 3].map(i => (
            <div
                key={i}
                className="relative rounded-xl border border-white/10 overflow-hidden bg-white/[0.04]"
                style={{ aspectRatio: '1/1' }}
            >
                <div className="absolute inset-0 animate-pulse-slow bg-gradient-to-br from-white/[0.04] via-white/[0.08] to-white/[0.02]" />
            </div>
        ))}
    </motion.div>
);

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">{label}</label>
        {children}
    </div>
);

const SelectInput: React.FC<{ value: string; onChange: (v: string) => void; options: string[] }> = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg-main/60 border border-border-default rounded-xl px-3 py-2 text-[12px] text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
    >
        {options.map(o => (
            <option key={o} value={o} className="bg-bg-surface text-text-primary">
                {o}
            </option>
        ))}
    </select>
);

export default VisualArtsTab;
