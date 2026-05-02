import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmStripIcon, ImageIcon, CloseIcon, DownloadIcon, ThinkingIcon } from '../Icons';

const ASPECT_RATIOS: { id: '16:9' | '9:16' | '1:1'; label: string; ratio: string }[] = [
    { id: '16:9', label: 'Landscape', ratio: '16/9' },
    { id: '9:16', label: 'Portrait', ratio: '9/16' },
    { id: '1:1', label: 'Square', ratio: '1/1' },
];

const RESOLUTIONS = ['720p', '1080p'] as const;
const DURATIONS = [
    { id: '8s', label: '8s · Quick' },
    { id: '15s', label: '15s · Standard' },
    { id: '30s', label: '30s · Story' },
    { id: '60s', label: '60s · Cinematic' },
];
const TONES = ['Inspirational', 'Documentary', 'Dramatic', 'Festive', 'Reflective', 'Promotional'];
const CONTEXTS = ['Promotional', 'Educational', 'Storytelling', 'Music Video', 'Cultural Heritage', 'Tourism'];
const REGIONS = [
    'Pan-African', 'West Africa', 'East Africa', 'Southern Africa',
    'North Africa', 'Central Africa', 'African Diaspora',
];

type GenerationStatus = 'idle' | 'generating' | 'preview';

interface FormState {
    prompt: string;
    aspect: '16:9' | '9:16' | '1:1';
    resolution: '720p' | '1080p';
    duration: string;
    tone: string;
    context: string;
    region: string;
    deepLocalize: boolean;
}

const INITIAL_FORM: FormState = {
    prompt: '',
    aspect: '16:9',
    resolution: '720p',
    duration: '15s',
    tone: 'Inspirational',
    context: 'Storytelling',
    region: 'Pan-African',
    deepLocalize: true,
};

const SAMPLE_PROMPTS = [
    'Sunrise over Mount Kilimanjaro with a Maasai herder leading cattle across golden grasslands.',
    'Lagos street food market at golden hour, vibrant umbrellas, slow tracking shot.',
    'A young girl in Kente cloth dancing in slow motion, petals falling around her.',
];

const MotionTab: React.FC = () => {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleFile = (file: File | null) => {
        setImageFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = e => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
            // Reset the input so re-selecting the same file fires onChange.
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleGenerate = () => {
        if (!form.prompt.trim()) return;
        setStatus('generating');
        // Skeleton: simulate generation with a timed mock until real video AI is integrated.
        setTimeout(() => setStatus('preview'), 2200);
    };

    const handleReset = () => {
        setStatus('idle');
        setForm(INITIAL_FORM);
        handleFile(null);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-4 sm:gap-5 p-4 sm:p-6">
            {/* --- Left: Controls --- */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 space-y-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
                <div>
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Prompt</label>
                    <textarea
                        value={form.prompt}
                        onChange={e => updateForm('prompt', e.target.value)}
                        placeholder="Describe the scene you want to bring to life..."
                        rows={4}
                        className="w-full bg-bg-main/60 border border-border-default rounded-xl px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition resize-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {SAMPLE_PROMPTS.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => updateForm('prompt', p)}
                                className="px-2.5 py-1 rounded-full text-[10px] text-text-secondary border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:text-text-primary transition"
                            >
                                Try sample {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <ImageDropzone
                    imagePreview={imagePreview}
                    onChange={handleFile}
                    fileInputRef={fileInputRef}
                />

                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Aspect">
                        <div className="grid grid-cols-3 gap-1">
                            {ASPECT_RATIOS.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => updateForm('aspect', a.id)}
                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition border ${
                                        form.aspect === a.id
                                            ? 'bg-accent/15 border-accent/50 text-white'
                                            : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {a.id}
                                </button>
                            ))}
                        </div>
                    </FieldGroup>
                    <FieldGroup label="Resolution">
                        <div className="grid grid-cols-2 gap-1">
                            {RESOLUTIONS.map(r => (
                                <button
                                    key={r}
                                    onClick={() => updateForm('resolution', r)}
                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition border ${
                                        form.resolution === r
                                            ? 'bg-accent/15 border-accent/50 text-white'
                                            : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </FieldGroup>
                </div>

                <FieldGroup label="Duration">
                    <div className="grid grid-cols-2 gap-1.5">
                        {DURATIONS.map(d => (
                            <button
                                key={d.id}
                                onClick={() => updateForm('duration', d.id)}
                                className={`px-2.5 py-2 rounded-lg text-[11px] font-medium transition border text-left ${
                                    form.duration === d.id
                                        ? 'bg-accent/15 border-accent/50 text-white'
                                        : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </FieldGroup>

                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Tone">
                        <SelectInput
                            value={form.tone}
                            onChange={v => updateForm('tone', v)}
                            options={TONES}
                        />
                    </FieldGroup>
                    <FieldGroup label="Context">
                        <SelectInput
                            value={form.context}
                            onChange={v => updateForm('context', v)}
                            options={CONTEXTS}
                        />
                    </FieldGroup>
                </div>

                <FieldGroup label="Cultural Region">
                    <SelectInput
                        value={form.region}
                        onChange={v => updateForm('region', v)}
                        options={REGIONS}
                    />
                </FieldGroup>

                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition p-3">
                    <input
                        type="checkbox"
                        checked={form.deepLocalize}
                        onChange={e => updateForm('deepLocalize', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 text-accent focus:ring-accent/40 bg-transparent"
                    />
                    <div className="flex-1">
                        <div className="text-[12px] font-semibold text-text-primary">Deep cultural localization</div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                            Apply nuanced regional details — wardrobe, lighting, cadence — when the AI phase is enabled.
                        </p>
                    </div>
                </label>

                <button
                    onClick={handleGenerate}
                    disabled={!form.prompt.trim() || status === 'generating'}
                    className="w-full relative overflow-hidden rounded-xl px-4 py-3 text-[13px] font-bold tracking-wide text-white bg-gradient-to-r from-accent to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_10px_40px_-12px_rgba(244,163,0,0.7)]"
                >
                    {status === 'generating' ? 'Generating preview...' : 'Generate Motion Preview'}
                </button>

                <p className="text-center text-[10px] text-text-secondary/70">
                    Skeleton mode · Real video AI is part of a later phase. Image, cultural-style, and pattern AI ship next.
                </p>
            </section>

            {/* --- Right: Preview --- */}
            <section className="relative min-h-[420px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl overflow-hidden flex flex-col">
                <div className="absolute inset-0 pointer-events-none opacity-50">
                    <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
                    <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-fuchsia-400/10 blur-3xl" />
                </div>

                <div className="relative z-10 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                        <FilmStripIcon className="w-4 h-4 text-accent" />
                        <span>Motion preview</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-text-secondary/70">
                        {form.aspect} · {form.resolution} · {form.duration}
                    </span>
                </div>

                <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-black/40 overflow-hidden"
                        style={{ aspectRatio: ASPECT_RATIOS.find(a => a.id === form.aspect)?.ratio ?? '16/9' }}
                    >
                        <AnimatePresence mode="wait">
                            {status === 'idle' && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                                        <FilmStripIcon className="w-7 h-7 text-accent/80" />
                                    </div>
                                    <h3 className="text-base font-bold text-white">Your story will play here</h3>
                                    <p className="text-[12px] text-text-secondary max-w-md">
                                        Describe a scene, choose a duration, and tap Generate. Real motion synthesis arrives in a future phase — for now, the preview shows the layout your video will fill.
                                    </p>
                                </motion.div>
                            )}
                            {status === 'generating' && (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(244,163,0,0.15),_transparent_60%)] animate-pulse-slow" />
                                    <div className="relative w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                                    <div className="relative text-center">
                                        <p className="text-[13px] text-white font-semibold">Composing motion...</p>
                                        <p className="text-[11px] text-text-secondary mt-1">Mock pipeline · ~2s</p>
                                    </div>
                                </motion.div>
                            )}
                            {status === 'preview' && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0"
                                >
                                    <div className="absolute inset-0 bg-[conic-gradient(from_140deg,_#1f1f1f,_#3a2a10,_#1f1f1f)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(244,163,0,0.25),_transparent_60%)]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ThinkingIcon className="w-12 h-12 text-white/30" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-semibold text-white truncate">
                                                    {form.prompt.slice(0, 80) || 'Untitled motion'}
                                                </p>
                                                <p className="text-[10px] text-text-secondary truncate">
                                                    {form.tone} · {form.context} · {form.region}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    title="Download (mock)"
                                                    className="p-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-text-secondary hover:text-white hover:bg-white/[0.1] transition"
                                                >
                                                    <DownloadIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleReset}
                                                    title="Reset"
                                                    className="p-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-text-secondary hover:text-white hover:bg-white/[0.1] transition"
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="relative z-10 px-4 sm:px-5 py-3 border-t border-white/10 grid grid-cols-3 gap-3 text-[11px] text-text-secondary">
                    <SummaryStat label="Aspect" value={form.aspect} />
                    <SummaryStat label="Tone" value={form.tone} />
                    <SummaryStat label="Region" value={form.region} />
                </div>
            </section>
        </div>
    );
};

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

const SummaryStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-lg bg-white/[0.02] border border-white/10 px-2.5 py-1.5">
        <div className="text-[9px] uppercase tracking-wider text-text-secondary/70">{label}</div>
        <div className="text-[12px] text-text-primary font-medium truncate">{value}</div>
    </div>
);

const ImageDropzone: React.FC<{
    imagePreview: string | null;
    onChange: (file: File | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}> = ({ imagePreview, onChange, fileInputRef }) => {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <FieldGroup label="Reference image (optional)">
            <div
                onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f && f.type.startsWith('image/')) onChange(f);
                }}
                className={`relative rounded-xl border border-dashed transition p-3 text-center cursor-pointer ${
                    isDragging
                        ? 'border-accent/60 bg-accent/5'
                        : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => onChange(e.target.files?.[0] ?? null)}
                />
                {imagePreview ? (
                    <div className="relative">
                        <img src={imagePreview} alt="Reference" className="mx-auto max-h-32 rounded-lg" />
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:text-white"
                            aria-label="Remove reference image"
                        >
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-[11px] text-text-secondary py-3">
                        <ImageIcon className="w-4 h-4" />
                        <span>Drop or click to add a reference image</span>
                    </div>
                )}
            </div>
        </FieldGroup>
    );
};

export default MotionTab;
