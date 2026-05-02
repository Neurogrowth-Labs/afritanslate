import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { DownloadIcon, PaletteIcon, SparklesIcon } from '../Icons';
import { getClerkToken } from './_clerkToken';
import type {
    GeneratePatternRequest,
    GeneratePatternResponse,
    PatternComplexity,
    PatternType,
} from '../../../api/creative/_types';

// ── Static config ────────────────────────────────────────────────────────────

interface PatternOption {
    id: PatternType;
    label: string;
}

const PATTERN_OPTIONS: PatternOption[] = [
    { id: 'tribal', label: 'Tribal' },
    { id: 'textile', label: 'Textile' },
    { id: 'afrofuturistic', label: 'Afro-futuristic' },
    { id: 'geometric', label: 'Geometric' },
    { id: 'kente', label: 'Kente' },
    { id: 'ndebele', label: 'Ndebele' },
    { id: 'adinkra', label: 'Adinkra' },
];

const COMPLEXITY_OPTIONS: { id: PatternComplexity; label: string }[] = [
    { id: 'simple', label: 'Simple' },
    { id: 'medium', label: 'Medium' },
    { id: 'intricate', label: 'Intricate' },
];

// ── State ────────────────────────────────────────────────────────────────────

interface FormState {
    patternType: PatternType;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    complexity: PatternComplexity;
    tileable: boolean;
}

const INITIAL_FORM: FormState = {
    patternType: 'kente',
    primaryColor: '#E07B39',
    secondaryColor: '#1B3A4B',
    accentColor: '#F4D35E',
    complexity: 'medium',
    tileable: true,
};

type Status =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: GeneratePatternResponse };

// ── API ──────────────────────────────────────────────────────────────────────

async function fetchGeneratedPattern(
    body: GeneratePatternRequest,
): Promise<GeneratePatternResponse> {
    const token = await getClerkToken();
    if (!token) {
        throw new Error('You need to be signed in to generate patterns.');
    }

    const res = await fetch('/api/creative/generate-pattern', {
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
    return payload as GeneratePatternResponse;
}

// ── Sanitisation (defence in depth) ──────────────────────────────────────────

/**
 * Re-sanitise the SVG on the client before shoving it into the DOM. The
 * server already strips dangerous bits, but DOMPurify's SVG profile is the
 * authoritative guard for `dangerouslySetInnerHTML`.
 */
function safeSvg(svg: string): string {
    return DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
    });
}

// ── Download helpers ─────────────────────────────────────────────────────────

function triggerDownload(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadSvg(svg: string, baseName: string) {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    triggerDownload(`${baseName}.svg`, blob);
}

async function downloadPng(
    svg: string,
    baseName: string,
    size = 800,
): Promise<void> {
    // Wrap in a Blob URL so the browser parses it as an image. Using a data:
    // URL would also work but Blob avoids URL-encoding pitfalls with `#`.
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Could not rasterise SVG.'));
            img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable.');
        ctx.drawImage(img, 0, 0, size, size);

        const pngBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/png'),
        );
        if (!pngBlob) throw new Error('Could not create PNG blob.');
        triggerDownload(`${baseName}.png`, pngBlob);
    } finally {
        URL.revokeObjectURL(url);
    }
}

function safeFilename(name: string): string {
    return (
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'pattern'
    );
}

// ── Component ────────────────────────────────────────────────────────────────

const PatternGeneratorSection: React.FC = () => {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [status, setStatus] = useState<Status>({ kind: 'idle' });
    const requestId = useRef(0);

    const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((prev) => ({ ...prev, [k]: v }));

    const runGenerate = async (snapshot: FormState) => {
        const id = ++requestId.current;
        setStatus({ kind: 'loading' });
        try {
            const data = await fetchGeneratedPattern({
                patternType: snapshot.patternType,
                primaryColor: snapshot.primaryColor,
                secondaryColor: snapshot.secondaryColor,
                accentColor: snapshot.accentColor,
                complexity: snapshot.complexity,
                tileable: snapshot.tileable,
            });
            if (requestId.current !== id) return;
            setStatus({ kind: 'ready', data });
        } catch (err) {
            if (requestId.current !== id) return;
            const message =
                err instanceof Error
                    ? err.message
                    : 'Could not generate the pattern.';
            setStatus({ kind: 'error', message });
        }
    };

    const handleGenerate = () => {
        void runGenerate(form);
    };

    return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <header className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center">
                        <PaletteIcon className="w-4 h-4 text-accent" />
                    </span>
                    <div>
                        <h3 className="text-[13px] font-bold text-white">
                            Pattern Generator
                        </h3>
                        <p className="text-[11px] text-text-secondary">
                            Cultural SVG patterns you can drop straight into
                            print, web, or textile work.
                        </p>
                    </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-secondary/70">
                    <SparklesIcon className="w-3 h-3 text-accent" />
                    Gemini · SVG
                </span>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4 sm:gap-5 p-4 sm:p-5">
                <Controls
                    form={form}
                    update={update}
                    status={status}
                    onGenerate={handleGenerate}
                />
                <Preview
                    status={status}
                    primaryColor={form.primaryColor}
                    secondaryColor={form.secondaryColor}
                    onRetry={handleGenerate}
                />
            </div>
        </section>
    );
};

// ── Controls ─────────────────────────────────────────────────────────────────

interface ControlsProps {
    form: FormState;
    update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
    status: Status;
    onGenerate: () => void;
}

const Controls: React.FC<ControlsProps> = ({
    form,
    update,
    status,
    onGenerate,
}) => (
    <div className="space-y-4">
        <FieldGroup label="Pattern Type">
            <div className="flex flex-wrap gap-1.5">
                {PATTERN_OPTIONS.map((p) => {
                    const active = form.patternType === p.id;
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => update('patternType', p.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                                active
                                    ? 'bg-accent/15 border-accent/50 text-white'
                                    : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary'
                            }`}
                            aria-pressed={active}
                        >
                            {p.label}
                        </button>
                    );
                })}
            </div>
        </FieldGroup>

        <FieldGroup label="Complexity">
            <div className="grid grid-cols-3 gap-1.5">
                {COMPLEXITY_OPTIONS.map((c) => {
                    const active = form.complexity === c.id;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => update('complexity', c.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                                active
                                    ? 'bg-accent/15 border-accent/50 text-white'
                                    : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary'
                            }`}
                            aria-pressed={active}
                        >
                            {c.label}
                        </button>
                    );
                })}
            </div>
        </FieldGroup>

        <div className="grid grid-cols-3 gap-2">
            <ColorField
                label="Primary"
                value={form.primaryColor}
                onChange={(v) => update('primaryColor', v)}
            />
            <ColorField
                label="Secondary"
                value={form.secondaryColor}
                onChange={(v) => update('secondaryColor', v)}
            />
            <ColorField
                label="Accent (optional)"
                value={form.accentColor}
                onChange={(v) => update('accentColor', v)}
                allowEmpty
            />
        </div>

        <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer select-none">
            <input
                type="checkbox"
                checked={form.tileable}
                onChange={(e) => update('tileable', e.target.checked)}
                className="w-4 h-4 accent-accent"
            />
            <span className="text-[12px] text-text-primary">
                Make tileable (seamless repeat)
            </span>
        </label>

        <button
            type="button"
            onClick={onGenerate}
            disabled={status.kind === 'loading'}
            className="w-full rounded-xl px-4 py-2.5 text-[12px] font-bold tracking-wide text-white bg-gradient-to-r from-accent to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_10px_30px_-12px_rgba(244,163,0,0.6)]"
        >
            {status.kind === 'loading' ? 'Weaving pattern…' : 'Generate Pattern'}
        </button>
    </div>
);

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

interface ColorFieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    allowEmpty?: boolean;
}

const ColorField: React.FC<ColorFieldProps> = ({
    label,
    value,
    onChange,
    allowEmpty,
}) => {
    // <input type="color"> rejects empty strings, so we feed it a default
    // fallback while keeping the actual form value empty.
    const fallback = '#888888';
    const display = value || fallback;
    return (
        <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                {label}
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] pl-1.5 pr-2 py-1.5">
                <input
                    type="color"
                    value={display}
                    onChange={(e) => onChange(e.target.value)}
                    aria-label={label}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10"
                />
                <span className="text-[11px] font-mono text-text-secondary truncate">
                    {value || (allowEmpty ? '— none —' : display)}
                </span>
                {allowEmpty && value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="ml-auto text-[10px] text-text-secondary/80 hover:text-white"
                        aria-label="Clear accent colour"
                    >
                        clear
                    </button>
                )}
            </div>
        </div>
    );
};

// ── Preview ──────────────────────────────────────────────────────────────────

interface PreviewProps {
    status: Status;
    primaryColor: string;
    secondaryColor: string;
    onRetry: () => void;
}

const Preview: React.FC<PreviewProps> = ({
    status,
    primaryColor,
    secondaryColor,
    onRetry,
}) => (
    <div className="relative min-h-[260px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-50">
            <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
                style={{ background: `${primaryColor}33` }}
            />
            <div
                className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl"
                style={{ background: `${secondaryColor}33` }}
            />
        </div>
        <div className="relative z-10 p-4 sm:p-5">
            <AnimatePresence mode="wait">
                {status.kind === 'idle' && <IdleView />}
                {status.kind === 'loading' && <LoadingView />}
                {status.kind === 'error' && (
                    <ErrorView message={status.message} onRetry={onRetry} />
                )}
                {status.kind === 'ready' && (
                    <ReadyView key="ready" data={status.data} />
                )}
            </AnimatePresence>
        </div>
    </div>
);

const IdleView: React.FC = () => (
    <motion.div
        key="idle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center gap-4 py-8 px-2"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <PaletteIcon className="w-7 h-7 text-accent/80" />
        </div>
        <div>
            <h4 className="text-base font-bold text-white">
                Generate a cultural SVG
            </h4>
            <p className="text-[12px] text-text-secondary mt-0.5 max-w-md">
                Pick a tradition, pick a palette, hit Generate. Output is a
                viewBox 0 0 400 400 SVG you can download as SVG or PNG.
            </p>
        </div>
    </motion.div>
);

const LoadingView: React.FC = () => (
    <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-4 items-start"
    >
        <div className="aspect-square rounded-xl border border-white/10 overflow-hidden bg-white/[0.04]">
            <div className="w-full h-full animate-pulse-slow bg-gradient-to-br from-white/[0.04] via-white/[0.10] to-white/[0.02]" />
        </div>
        <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-3 rounded animate-pulse-slow bg-white/[0.06]"
                    style={{ width: `${75 + ((i * 17) % 25)}%` }}
                />
            ))}
        </div>
    </motion.div>
);

const ErrorView: React.FC<{ message: string; onRetry: () => void }> = ({
    message,
    onRetry,
}) => (
    <motion.div
        key="error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center text-center gap-3 py-10 px-3"
    >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-center text-lg">
            !
        </div>
        <h4 className="text-sm font-bold text-white">
            Pattern generation failed
        </h4>
        <p className="text-[12px] text-red-300/90 max-w-md">{message}</p>
        <button
            type="button"
            onClick={onRetry}
            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 transition"
        >
            Retry
        </button>
    </motion.div>
);

const ReadyView: React.FC<{ data: GeneratePatternResponse }> = ({ data }) => {
    const cleanedSvg = useMemo(() => safeSvg(data.svgContent), [data.svgContent]);
    const baseName = useMemo(() => safeFilename(data.patternName), [data.patternName]);
    const [pngError, setPngError] = useState<string | null>(null);
    const [pngBusy, setPngBusy] = useState(false);

    const handlePng = async () => {
        setPngError(null);
        setPngBusy(true);
        try {
            await downloadPng(cleanedSvg, baseName);
        } catch (err) {
            setPngError(
                err instanceof Error
                    ? err.message
                    : 'Could not rasterise SVG.',
            );
        } finally {
            setPngBusy(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-4 items-start"
        >
            <div className="space-y-2">
                <div
                    className="aspect-square rounded-xl border border-white/15 bg-white/[0.02] overflow-hidden flex items-center justify-center"
                    aria-label={`Pattern preview: ${data.patternName}`}
                >
                    <div
                        className="w-full h-full"
                        // SVG sanitised on server (sanitiseSvg) AND on client
                        // (DOMPurify SVG profile via safeSvg). Safe to inject.
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: cleanedSvg }}
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => downloadSvg(cleanedSvg, baseName)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/15 bg-white/[0.03] text-text-primary hover:bg-white/[0.07] transition"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" /> SVG
                    </button>
                    <button
                        type="button"
                        onClick={handlePng}
                        disabled={pngBusy}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-accent/40 bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />{' '}
                        {pngBusy ? 'Rendering…' : 'PNG'}
                    </button>
                </div>
                {pngError && (
                    <p className="text-[11px] text-red-300/90">{pngError}</p>
                )}
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                        Pattern
                    </p>
                    <p className="text-[14px] font-bold text-white leading-snug">
                        {data.patternName}
                    </p>
                </div>
                {data.culturalOrigin && (
                    <Field label="Cultural origin" value={data.culturalOrigin} />
                )}
                {data.designNotes && (
                    <Field label="Design notes" value={data.designNotes} />
                )}
                {data.colorMeaning && (
                    <Field label="Colour meaning" value={data.colorMeaning} />
                )}
            </div>
        </motion.div>
    );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            {label}
        </p>
        <p className="text-[12px] text-text-primary leading-relaxed">{value}</p>
    </div>
);

export default PatternGeneratorSection;
