import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ImageIcon,
    PaletteIcon,
    SparklesIcon,
    DownloadIcon,
    CloseIcon,
} from '../Icons';
import { getClerkToken } from './_clerkToken';
import PatternGeneratorSection from './PatternGeneratorSection';
import type {
    GenerateImageRequest,
    GenerateImageResponse,
    GenerateImageSuccess,
    GenerateImageQuotaFallback,
    GeneratedImagePayload,
    ImageGenUseCase,
} from '../../../api/creative/_types';

// ── Static config ────────────────────────────────────────────────────────────

const TEMPLATES = [
    { id: 'township-promo', name: 'Township Promo', category: 'Marketing' },
    { id: 'afrocentric-brand', name: 'Afrocentric Brand', category: 'Branding' },
    { id: 'youth-social', name: 'Youth Social', category: 'Social' },
    { id: 'cultural-event', name: 'Cultural Event', category: 'Events' },
    { id: 'ngo-campaign', name: 'NGO Campaign', category: 'Nonprofit' },
    { id: 'market-vendor', name: 'Market Vendor', category: 'Business' },
];

const REGIONS = [
    'Pan-African',
    'West Africa',
    'East Africa',
    'Southern Africa',
    'North Africa',
    'Central Africa',
];

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

const PALETTE_HEXES = [
    '#F4A300',
    '#C2410C',
    '#7C2D12',
    '#0F766E',
    '#365314',
    '#0E7490',
];

interface UseCaseOption {
    id: ImageGenUseCase;
    label: string;
    aspect: '1:1' | '16:9' | '9:16';
    helper: string;
}

const USE_CASES: UseCaseOption[] = [
    {
        id: 'social_media',
        label: 'Social Media',
        aspect: '1:1',
        helper: 'Square feed post',
    },
    {
        id: 'banner',
        label: 'Banner',
        aspect: '16:9',
        helper: 'Wide horizontal banner',
    },
    {
        id: 'hero',
        label: 'Hero',
        aspect: '16:9',
        helper: 'Hero / cover artwork',
    },
    {
        id: 'portrait',
        label: 'Portrait',
        aspect: '9:16',
        helper: 'Vertical portrait',
    },
    { id: 'print', label: 'Print', aspect: '9:16', helper: 'Tall print poster' },
];

// ── Form / status types ──────────────────────────────────────────────────────

interface FormState {
    prompt: string;
    template: string;
    region: string;
    symbols: string[];
    skinTones: string[];
    useCase: ImageGenUseCase;
    audience: string;
}

const INITIAL_FORM: FormState = {
    prompt: '',
    template: '',
    region: 'Pan-African',
    symbols: [],
    skinTones: [],
    useCase: 'social_media',
    audience: '',
};

type Status =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: GenerateImageSuccess }
    | { kind: 'quotaFallback'; data: GenerateImageQuotaFallback };

// ── API client ───────────────────────────────────────────────────────────────

async function fetchGeneratedImages(
    body: GenerateImageRequest,
): Promise<GenerateImageResponse> {
    const token = await getClerkToken();
    if (!token) {
        throw new Error('You need to be signed in to generate images.');
    }

    const res = await fetch('/api/creative/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    const payload = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
    >;

    if (!res.ok) {
        const message =
            typeof payload.error === 'string'
                ? payload.error
                : `Request failed (${res.status})`;
        throw new Error(message);
    }

    return payload as GenerateImageResponse;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findUseCase(id: ImageGenUseCase): UseCaseOption {
    return USE_CASES.find((u) => u.id === id) ?? USE_CASES[0];
}

function buildBody(form: FormState): GenerateImageRequest {
    const styleParts = [
        form.template ? TEMPLATES.find((t) => t.id === form.template)?.name : null,
        form.symbols.length ? `Symbols: ${form.symbols.join(', ')}` : null,
        form.skinTones.length ? `Skin tones: ${form.skinTones.join(', ')}` : null,
    ].filter(Boolean) as string[];

    return {
        prompt: form.prompt,
        culture: form.region,
        style: styleParts.join(' · ') || 'Editorial',
        useCase: form.useCase,
        audience: form.audience.trim(),
    };
}

function isQuotaFallback(
    res: GenerateImageResponse,
): res is GenerateImageQuotaFallback {
    return (res as GenerateImageQuotaFallback).error === 'IMAGE_GEN_UNAVAILABLE';
}

// ── Component ────────────────────────────────────────────────────────────────

const VisualArtsTab: React.FC = () => {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [status, setStatus] = useState<Status>({ kind: 'idle' });
    const requestId = useRef(0);

    const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((prev) => ({ ...prev, [k]: v }));

    const toggleArrayItem = (key: 'symbols' | 'skinTones', value: string) => {
        setForm((prev) => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter((v) => v !== value)
                : [...prev[key], value],
        }));
    };

    const runGenerate = async (snapshot: FormState) => {
        const id = ++requestId.current;
        setStatus({ kind: 'loading' });
        try {
            const result = await fetchGeneratedImages(buildBody(snapshot));
            if (requestId.current !== id) return; // stale
            if (isQuotaFallback(result)) {
                setStatus({ kind: 'quotaFallback', data: result });
            } else {
                setStatus({ kind: 'ready', data: result });
            }
        } catch (err) {
            if (requestId.current !== id) return;
            const message =
                err instanceof Error
                    ? err.message
                    : 'Something went wrong generating the visual.';
            setStatus({ kind: 'error', message });
        }
    };

    const handleGenerate = () => {
        if (!form.prompt.trim()) return;
        void runGenerate(form);
    };

    const handleRetry = () => {
        if (!form.prompt.trim()) return;
        void runGenerate(form);
    };

    const handleReset = () => {
        requestId.current++;
        setForm(INITIAL_FORM);
        setStatus({ kind: 'idle' });
    };

    const useCaseConfig = findUseCase(form.useCase);
    const aspectForLayout = useCaseConfig.aspect;

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-4 sm:gap-5">
            {/* --- Left: Controls --- */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 space-y-5">
                <FieldGroup label="Concept">
                    <textarea
                        value={form.prompt}
                        onChange={(e) => update('prompt', e.target.value)}
                        placeholder="A bold pan-African celebration poster, layered Kente weaves..."
                        rows={3}
                        className="w-full bg-bg-main/60 border border-border-default rounded-xl px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition resize-none"
                    />
                </FieldGroup>

                <FieldGroup label="Template">
                    <div className="grid grid-cols-2 gap-1.5">
                        {TEMPLATES.map((t) => {
                            const active = form.template === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() =>
                                        update('template', active ? '' : t.id)
                                    }
                                    className={`text-left px-3 py-2 rounded-lg transition border ${
                                        active
                                            ? 'bg-accent/15 border-accent/50'
                                            : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <div
                                        className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-text-primary'}`}
                                    >
                                        {t.name}
                                    </div>
                                    <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                                        {t.category}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>

                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Region">
                        <SelectInput
                            value={form.region}
                            onChange={(v) => update('region', v)}
                            options={REGIONS}
                        />
                    </FieldGroup>
                    <FieldGroup label="Use Case">
                        <select
                            value={form.useCase}
                            onChange={(e) =>
                                update('useCase', e.target.value as ImageGenUseCase)
                            }
                            className="w-full bg-bg-main/60 border border-border-default rounded-xl px-3 py-2 text-[12px] text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
                        >
                            {USE_CASES.map((u) => (
                                <option
                                    key={u.id}
                                    value={u.id}
                                    className="bg-bg-surface text-text-primary"
                                >
                                    {u.label} · {u.aspect}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[10px] text-text-secondary/70">
                            {useCaseConfig.helper}
                        </p>
                    </FieldGroup>
                </div>

                <FieldGroup label="Audience">
                    <input
                        type="text"
                        value={form.audience}
                        onChange={(e) => update('audience', e.target.value)}
                        placeholder="Gen-Z urban creatives, NGO donors, festival attendees…"
                        className="w-full bg-bg-main/60 border border-border-default rounded-xl px-3.5 py-2 text-[12px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
                    />
                </FieldGroup>

                <FieldGroup label="Cultural Symbols">
                    <div className="flex flex-wrap gap-1.5">
                        {SYMBOLS.map((s) => {
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
                        {SKIN_TONES.map((t) => {
                            const active = form.skinTones.includes(t.name);
                            return (
                                <button
                                    key={t.name}
                                    onClick={() =>
                                        toggleArrayItem('skinTones', t.name)
                                    }
                                    className={`flex-1 rounded-lg p-2 border transition flex flex-col items-center gap-1 ${
                                        active
                                            ? 'border-accent/60 bg-accent/10'
                                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                                    }`}
                                    aria-pressed={active}
                                >
                                    <span
                                        className="w-6 h-6 rounded-full border border-white/20"
                                        style={{ background: t.hex }}
                                    />
                                    <span className="text-[10px] text-text-secondary">
                                        {t.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </FieldGroup>

                <FieldGroup label="Style Notes">
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-[11px] text-text-secondary flex items-start gap-2">
                        <SparklesIcon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <p>
                            Imagen 3 generates four variations using a
                            culturally-enriched prompt. The use-case picks the
                            aspect ratio. Pattern generation arrives next.
                        </p>
                    </div>
                </FieldGroup>

                <button
                    onClick={handleGenerate}
                    disabled={!form.prompt.trim() || status.kind === 'loading'}
                    className="w-full rounded-xl px-4 py-3 text-[13px] font-bold tracking-wide text-white bg-gradient-to-r from-accent to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_10px_40px_-12px_rgba(244,163,0,0.7)]"
                >
                    {status.kind === 'loading'
                        ? 'Composing artwork...'
                        : 'Generate Visual'}
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
                        {useCaseConfig.label} · {useCaseConfig.aspect} ·{' '}
                        {form.region}
                    </span>
                </div>

                <div className="relative z-10 flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {status.kind === 'idle' && <IdleState />}
                        {status.kind === 'loading' && (
                            <GeneratingState aspect={aspectForLayout} />
                        )}
                        {status.kind === 'error' && (
                            <ErrorState
                                message={status.message}
                                onRetry={handleRetry}
                            />
                        )}
                        {status.kind === 'ready' && (
                            <ReadyState
                                key="ready"
                                data={status.data}
                                aspect={aspectForLayout}
                                onReset={handleReset}
                            />
                        )}
                        {status.kind === 'quotaFallback' && (
                            <QuotaFallbackState
                                key="fallback"
                                data={status.data}
                                aspect={aspectForLayout}
                                onReset={handleReset}
                                onRetry={handleRetry}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>

        <PatternGeneratorSection />
        </div>
    );
};

// ── Sub-states ───────────────────────────────────────────────────────────────

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
            Pick a template, layer cultural symbols, set your audience, and tap
            Generate. Imagen returns four culturally-enriched variations.
        </p>
    </motion.div>
);

const GeneratingState: React.FC<{ aspect: string }> = ({ aspect }) => (
    <motion.div
        key="gen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-3"
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="relative rounded-xl border border-white/10 overflow-hidden bg-white/[0.04]"
                    style={{ aspectRatio: aspect.replace(':', '/') }}
                >
                    <div className="absolute inset-0 animate-pulse-slow bg-gradient-to-br from-white/[0.04] via-white/[0.08] to-white/[0.02]" />
                </div>
            ))}
        </div>
        <p className="text-center text-[11px] text-text-secondary/80">
            Enriching prompt and rendering 4 variations…
        </p>
    </motion.div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
    message,
    onRetry,
}) => (
    <motion.div
        key="error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col items-center justify-center text-center gap-3 py-12"
    >
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-center text-xl">
            !
        </div>
        <h3 className="text-base font-bold text-white">
            Could not generate your visual
        </h3>
        <p className="text-[12px] text-red-300/90 max-w-md">{message}</p>
        <button
            onClick={onRetry}
            className="mt-1 px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 transition"
        >
            Retry
        </button>
    </motion.div>
);

const ReadyState: React.FC<{
    data: GenerateImageSuccess;
    aspect: string;
    onReset: () => void;
}> = ({ data, aspect, onReset }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
    >
        <ImageGrid images={data.images} aspect={aspect} />
        <CulturalContextNote text={data.culturalContext} />
        <AvoidanceNotes notes={data.avoidanceNotes} />
        <FooterActions onReset={onReset} />
    </motion.div>
);

const QuotaFallbackState: React.FC<{
    data: GenerateImageQuotaFallback;
    aspect: string;
    onReset: () => void;
    onRetry: () => void;
}> = ({ data, aspect, onReset, onRetry }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
    >
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 flex items-start gap-2.5">
            <span className="text-amber-300 text-base leading-none mt-0.5">⚡</span>
            <div className="flex-1">
                <p className="text-[12px] font-semibold text-amber-200">
                    Image generation quota reached — cultural context still
                    available
                </p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                    {data.detail}
                </p>
            </div>
            <button
                onClick={onRetry}
                className="text-[11px] font-semibold text-amber-200 hover:text-white border border-amber-300/40 hover:border-amber-300 px-2.5 py-1 rounded-md transition"
            >
                Retry
            </button>
        </div>

        <ImageGrid images={[]} aspect={aspect} />
        <CulturalContextNote text={data.culturalContext} />
        <AvoidanceNotes notes={data.avoidanceNotes} />
        <FooterActions onReset={onReset} />
    </motion.div>
);

// ── Sub-components ───────────────────────────────────────────────────────────

const ImageGrid: React.FC<{
    images: GeneratedImagePayload[];
    aspect: string;
}> = ({ images, aspect }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => {
            const img = images[i];
            const isPrimary = i === 0;
            return (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative rounded-xl border border-white/10 overflow-hidden group"
                    style={{ aspectRatio: aspect.replace(':', '/') }}
                >
                    {img ? (
                        <img
                            src={`data:${img.mimeType};base64,${img.base64}`}
                            alt={
                                isPrimary
                                    ? 'Generated visual (primary)'
                                    : `Generated visual variation ${i + 1}`
                            }
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <PlaceholderTile index={i} />
                    )}
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] uppercase tracking-wider text-white/85 bg-black/40 backdrop-blur px-2 py-0.5 rounded-full">
                            {isPrimary ? 'Primary' : `Variation ${i + 1}`}
                        </span>
                        {img && (
                            <a
                                href={`data:${img.mimeType};base64,${img.base64}`}
                                download={`visual-${i + 1}.${img.mimeType.split('/')[1] ?? 'png'}`}
                                title="Download"
                                className="pointer-events-auto opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg bg-black/50 text-white/85 hover:text-white"
                            >
                                <DownloadIcon className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                </motion.div>
            );
        })}
    </div>
);

const PlaceholderTile: React.FC<{ index: number }> = ({ index }) => (
    <>
        <div
            className="absolute inset-0"
            style={{
                background: `linear-gradient(135deg, ${PALETTE_HEXES[index % PALETTE_HEXES.length]}33, ${PALETTE_HEXES[(index + 2) % PALETTE_HEXES.length]}33)`,
            }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.1),_transparent_60%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-white/40" />
        </div>
    </>
);

const CulturalContextNote: React.FC<{ text: string }> = ({ text }) => {
    if (!text.trim()) return null;
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-start gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center text-[13px] shrink-0">
                🌍
            </span>
            <div>
                <p className="text-[11px] font-bold text-white tracking-wide uppercase">
                    Cultural context
                </p>
                <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
                    {text}
                </p>
            </div>
        </div>
    );
};

const AvoidanceNotes: React.FC<{ notes: string[] }> = ({ notes }) => {
    const [open, setOpen] = useState(false);
    if (notes.length === 0) return null;
    return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left"
            >
                <span className="flex items-center gap-2 text-[12px] font-semibold text-red-200">
                    <span aria-hidden>⚠</span> Sensitive content notes ({notes.length})
                </span>
                <ChevronDownIcon
                    className={`w-4 h-4 text-red-200 transition-transform ${open ? '' : '-rotate-90'}`}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-3 pt-1 space-y-1.5 text-[12px] text-red-100/90 list-disc list-inside"
                    >
                        {notes.map((n, i) => (
                            <li key={i}>{n}</li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

const FooterActions: React.FC<{ onReset: () => void }> = ({ onReset }) => (
    <div className="flex justify-end">
        <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-text-secondary border border-white/10 bg-white/[0.02] hover:text-text-primary hover:bg-white/[0.05] transition"
        >
            <CloseIcon className="w-3.5 h-3.5" /> Reset
        </button>
    </div>
);

// ── Form helpers ─────────────────────────────────────────────────────────────

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
}) => (
    <div>
        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
            {label}
        </label>
        {children}
    </div>
);

const SelectInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    options: string[];
}> = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-main/60 border border-border-default rounded-xl px-3 py-2 text-[12px] text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
    >
        {options.map((o) => (
            <option
                key={o}
                value={o}
                className="bg-bg-surface text-text-primary"
            >
                {o}
            </option>
        ))}
    </select>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        <path d="M5 7l5 6 5-6" />
    </svg>
);

export default VisualArtsTab;
