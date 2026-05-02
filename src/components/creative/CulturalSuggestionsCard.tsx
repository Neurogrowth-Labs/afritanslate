import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

export interface CulturalColorSwatch {
    name: string;
    hex: string;
    meaning: string;
}

export type CulturalWarningSeverity = 'high' | 'medium' | 'low';

export interface CulturalWarning {
    issue: string;
    reason: string;
    severity: CulturalWarningSeverity;
}

export interface CulturalSuggestions {
    culturalNotes: string[];
    suggestedElements: string[];
    colorPalette: CulturalColorSwatch[];
    symbolism: string[];
    warningFlags: CulturalWarning[];
}

type CardStatus =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; data: CulturalSuggestions };

interface Props {
    status: CardStatus;
    onRetry?: () => void;
    onDismiss?: () => void;
}

const severityClasses: Record<CulturalWarningSeverity, string> = {
    high: 'bg-red-500/15 text-red-300 border-red-500/30',
    medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    low: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

const CulturalSuggestionsCard: React.FC<Props> = ({
    status,
    onRetry,
    onDismiss,
}) => {
    const [expanded, setExpanded] = useState(true);

    if (status.kind === 'idle') return null;

    // Only the 'ready' state has enough content to make collapsing useful.
    // Loading shows a tiny skeleton; error shows the retry button which must stay
    // visible. Letting the user toggle in those states would rotate the chevron
    // without changing visibility — a broken control.
    const collapsible = status.kind === 'ready';
    const bodyVisible =
        status.kind === 'loading' ||
        status.kind === 'error' ||
        (status.kind === 'ready' && expanded);

    return (
        <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] overflow-hidden"
        >
            <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <header className="relative z-10 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10">
                <button
                    type="button"
                    onClick={collapsible ? () => setExpanded((v) => !v) : undefined}
                    className={`flex items-center gap-2.5 text-left ${collapsible ? '' : 'cursor-default'}`}
                    aria-expanded={collapsible ? expanded : undefined}
                    disabled={!collapsible}
                >
                    <span className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center text-[14px]">
                        🌍
                    </span>
                    <span>
                        <span className="block text-[12px] font-bold text-white tracking-wide">
                            Cultural style suggestions
                        </span>
                        <span className="block text-[10px] text-text-secondary">
                            {status.kind === 'loading' &&
                                'Consulting cultural advisor…'}
                            {status.kind === 'error' && 'Could not load guidance'}
                            {status.kind === 'ready' && 'AI-generated guidance for your scene'}
                        </span>
                    </span>
                </button>

                <div className="flex items-center gap-2">
                    {status.kind === 'ready' && onDismiss && (
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="text-[10px] uppercase tracking-wider text-text-secondary/70 hover:text-white transition px-2 py-1 rounded-md hover:bg-white/[0.04]"
                        >
                            Dismiss
                        </button>
                    )}
                    {collapsible && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="p-1.5 rounded-md text-text-secondary hover:text-white hover:bg-white/[0.06] transition"
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                        >
                            <ChevronDownIcon
                                className={`w-4 h-4 transition-transform ${expanded ? '' : '-rotate-90'}`}
                            />
                        </button>
                    )}
                </div>
            </header>

            <AnimatePresence initial={false}>
                {bodyVisible && (
                    <motion.div
                        key={status.kind}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="relative z-10 overflow-hidden"
                    >
                        <div className="p-4 sm:p-5 space-y-5">
                            {status.kind === 'loading' && <LoadingState />}
                            {status.kind === 'error' && (
                                <ErrorState
                                    message={status.message}
                                    onRetry={onRetry}
                                />
                            )}
                            {status.kind === 'ready' && (
                                <ReadyState data={status.data} />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
};

const LoadingState: React.FC = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
            <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-3 animate-pulse"
            >
                <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                <div className="h-2.5 w-full bg-white/5 rounded mb-1.5" />
                <div className="h-2.5 w-4/5 bg-white/5 rounded mb-1.5" />
                <div className="h-2.5 w-2/3 bg-white/5 rounded" />
            </div>
        ))}
    </div>
);

const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
    message,
    onRetry,
}) => (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3.5">
        <span className="shrink-0 w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 flex items-center justify-center text-[14px]">
            !
        </span>
        <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white">
                Cultural consultant unavailable
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">{message}</p>
        </div>
        {onRetry && (
            <button
                type="button"
                onClick={onRetry}
                className="shrink-0 self-center text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 transition"
            >
                Retry
            </button>
        )}
    </div>
);

const ReadyState: React.FC<{ data: CulturalSuggestions }> = ({ data }) => {
    const {
        culturalNotes,
        suggestedElements,
        colorPalette,
        symbolism,
        warningFlags,
    } = data;

    const hasAny =
        culturalNotes.length +
            suggestedElements.length +
            colorPalette.length +
            symbolism.length +
            warningFlags.length >
        0;

    if (!hasAny) {
        return (
            <p className="text-[12px] text-text-secondary text-center py-4">
                No specific guidance for this brief — your prompt is already culturally neutral.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {warningFlags.length > 0 && (
                <Section
                    title="⚠️ Cultural risks"
                    className="lg:col-span-2"
                >
                    <div className="space-y-2">
                        {warningFlags.map((flag, i) => (
                            <div
                                key={i}
                                className={`rounded-lg border p-3 ${severityClasses[flag.severity]}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-[12px] font-semibold">
                                        {flag.issue}
                                    </p>
                                    <span className="text-[9px] uppercase tracking-wider opacity-80">
                                        {flag.severity}
                                    </span>
                                </div>
                                <p className="text-[11px] mt-1 opacity-90">
                                    {flag.reason}
                                </p>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {culturalNotes.length > 0 && (
                <Section title="💡 Cultural notes">
                    <ul className="space-y-1.5">
                        {culturalNotes.map((note, i) => (
                            <li
                                key={i}
                                className="text-[12px] text-text-secondary leading-relaxed pl-3 border-l border-white/10"
                            >
                                {note}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {suggestedElements.length > 0 && (
                <Section title="✨ Suggested elements">
                    <div className="flex flex-wrap gap-1.5">
                        {suggestedElements.map((el, i) => (
                            <span
                                key={i}
                                className="text-[11px] text-text-primary px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10"
                            >
                                {el}
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            {colorPalette.length > 0 && (
                <Section title="🎨 Colour palette">
                    <div className="grid grid-cols-1 gap-1.5">
                        {colorPalette.map((swatch, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-2"
                            >
                                <span
                                    className="shrink-0 w-7 h-7 rounded-md border border-white/10"
                                    style={{ backgroundColor: swatch.hex }}
                                    aria-label={swatch.name}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold text-white truncate">
                                        {swatch.name}{' '}
                                        <span className="text-text-secondary font-mono font-normal">
                                            {swatch.hex}
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-text-secondary line-clamp-2">
                                        {swatch.meaning}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {symbolism.length > 0 && (
                <Section
                    title="🪶 Symbolism"
                    className={
                        colorPalette.length === 0 ? 'lg:col-span-2' : ''
                    }
                >
                    <ul className="space-y-1.5">
                        {symbolism.map((s, i) => {
                            const isAvoid = /^avoid:/i.test(s);
                            return (
                                <li
                                    key={i}
                                    className={`text-[12px] leading-relaxed pl-3 border-l ${
                                        isAvoid
                                            ? 'text-red-300 border-red-500/40'
                                            : 'text-text-secondary border-white/10'
                                    }`}
                                >
                                    {s}
                                </li>
                            );
                        })}
                    </ul>
                </Section>
            )}
        </div>
    );
};

const Section: React.FC<{
    title: string;
    className?: string;
    children: React.ReactNode;
}> = ({ title, className = '', children }) => (
    <div className={className}>
        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
            {title}
        </h4>
        {children}
    </div>
);

export default CulturalSuggestionsCard;
