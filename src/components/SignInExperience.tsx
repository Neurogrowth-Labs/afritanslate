/**
 * Split-screen sign-in experience.
 *
 *  - Left panel:  AfriTranslate AI branding (logo + tagline + headline +
 *                 supporting copy + Africa-centred glowing globe visual +
 *                 three pillar items at the bottom).
 *  - Right panel: Clerk `<SignIn />` rendered inside a "glass" card themed
 *                 to match the dark / neon-orange visual language.
 *
 * Responsive: collapses to a single-column layout on `<lg`, with the
 * branding rail above the form card.
 */

import React from 'react';
import { SignIn } from '@clerk/clerk-react';

import { ShieldIcon, LockIcon, UsersIcon } from './Icons';

const FEATURE_ITEMS = [
    {
        Icon: ShieldIcon,
        title: 'Enterprise security',
        body: 'Your data is encrypted and always protected.',
    },
    {
        Icon: LockIcon,
        title: 'Privacy first',
        body: 'We never access your translations or content.',
    },
    {
        Icon: UsersIcon,
        title: 'Built for studios',
        body: 'Reliable access for teams that work globally.',
    },
];

/**
 * A stylised SVG depiction of an Africa-centred glowing network globe.
 * Built entirely inline so it works under the strict CSP (no external
 * image hosts) and ships zero new assets.
 */
const AfricaGlobe: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 720 540"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
    >
        <defs>
            {/* Soft orange glow underneath the globe */}
            <radialGradient id="globe-floor-glow" cx="50%" cy="58%" r="52%">
                <stop offset="0%" stopColor="#F4A300" stopOpacity="0.55" />
                <stop offset="35%" stopColor="#F4A300" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#F4A300" stopOpacity="0" />
            </radialGradient>

            {/* Subtle inner-globe gradient (top dark, bottom warm) */}
            <radialGradient id="globe-inner" cx="50%" cy="40%" r="62%">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="70%" stopColor="#0a0a0a" stopOpacity="1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </radialGradient>

            {/* Glow filter for the bright accent dots */}
            <filter id="dot-glow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>

            {/* Mask = circle, so all the dot grid gets clipped to the globe */}
            <clipPath id="globe-clip">
                <circle cx="360" cy="270" r="225" />
            </clipPath>
        </defs>

        {/* Floor glow */}
        <ellipse cx="360" cy="478" rx="290" ry="34" fill="url(#globe-floor-glow)" />

        {/* Globe body */}
        <circle cx="360" cy="270" r="225" fill="url(#globe-inner)" />
        <circle
            cx="360"
            cy="270"
            r="225"
            fill="none"
            stroke="#F4A300"
            strokeOpacity="0.18"
            strokeWidth="1"
        />

        {/* Latitude / meridian arcs */}
        <g
            clipPath="url(#globe-clip)"
            stroke="#F4A300"
            strokeOpacity="0.22"
            strokeWidth="0.75"
            fill="none"
        >
            {/* Latitudes (flattened ellipses) */}
            <ellipse cx="360" cy="270" rx="225" ry="42" />
            <ellipse cx="360" cy="270" rx="225" ry="86" />
            <ellipse cx="360" cy="270" rx="225" ry="130" />
            <ellipse cx="360" cy="270" rx="225" ry="174" />
            {/* Meridians (rotated ellipses around the polar axis) */}
            <ellipse cx="360" cy="270" rx="42"  ry="225" />
            <ellipse cx="360" cy="270" rx="86"  ry="225" />
            <ellipse cx="360" cy="270" rx="130" ry="225" />
            <ellipse cx="360" cy="270" rx="174" ry="225" />
        </g>

        {/* Dot grid (the "network" pattern). Built deterministically: a
            21x21 grid of small circles, masked to the globe and slightly
            elevated in opacity around the equator (centre band). */}
        <g clipPath="url(#globe-clip)">
            {Array.from({ length: 23 }).map((_, row) =>
                Array.from({ length: 23 }).map((__, col) => {
                    const cx = 360 - 220 + (col * 440) / 22;
                    const cy = 270 - 220 + (row * 440) / 22;
                    // Distance from globe centre; we taper opacity toward edges
                    const dx = cx - 360;
                    const dy = cy - 270;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 220) return null;
                    const t = 1 - dist / 220;
                    // Brighter near the lower-centre to suggest Africa
                    const africaBias =
                        Math.max(0, 1 - Math.sqrt((dx + 0) ** 2 + (dy - 20) ** 2) / 110);
                    const opacity = 0.18 + 0.45 * t + 0.35 * africaBias;
                    return (
                        <circle
                            key={`${row}-${col}`}
                            cx={cx}
                            cy={cy}
                            r={1.4 + 0.7 * africaBias}
                            fill="#F4A300"
                            fillOpacity={Math.min(opacity, 0.95)}
                        />
                    );
                }),
            )}
        </g>

        {/* A handful of brighter "city" dots over Africa for warmth */}
        <g filter="url(#dot-glow)">
            <circle cx="345" cy="225" r="2.5" fill="#FFB733" />
            <circle cx="378" cy="265" r="3.2" fill="#FFB733" />
            <circle cx="335" cy="305" r="2.6" fill="#FFB733" />
            <circle cx="395" cy="320" r="2.4" fill="#FFB733" />
            <circle cx="358" cy="368" r="3.0" fill="#FFB733" />
            <circle cx="312" cy="260" r="2.2" fill="#FFB733" />
            <circle cx="408" cy="240" r="2.2" fill="#FFB733" />
        </g>

        {/* A couple of long arcing connection lines */}
        <g
            clipPath="url(#globe-clip)"
            stroke="#F4A300"
            strokeOpacity="0.45"
            strokeWidth="0.9"
            fill="none"
        >
            <path d="M 200 280 Q 360 120 530 290" />
            <path d="M 220 360 Q 360 460 500 340" />
            <path d="M 270 200 Q 360 360 470 230" />
        </g>
    </svg>
);

const SignInExperience: React.FC = () => {
    return (
        <div className="relative min-h-dvh w-full overflow-hidden bg-[#0a0a0a] text-white">
            {/* Ambient background glows */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    background:
                        'radial-gradient(60% 50% at 20% 100%, rgba(244,163,0,0.10) 0%, rgba(244,163,0,0) 60%),' +
                        'radial-gradient(50% 60% at 80% 0%, rgba(244,163,0,0.07) 0%, rgba(244,163,0,0) 55%),' +
                        'radial-gradient(circle at 50% -10%, #1a1a1a 0%, #0a0a0a 70%)',
                }}
            />
            {/* Subtle dot grid overlay */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                }}
            />

            <div className="mx-auto grid min-h-dvh w-full max-w-[1440px] grid-cols-1 lg:grid-cols-2">
                {/* ─────────────── Left panel: branding ─────────────── */}
                <section className="relative flex flex-col justify-between px-8 py-10 sm:px-14 sm:py-14 lg:px-16 lg:py-16">
                    {/* Top: logo + tagline */}
                    <div className="relative z-10">
                        <img
                            src="/logo-transparent.svg"
                            alt="AfriTranslate AI"
                            className="h-9 w-auto select-none sm:h-10"
                            draggable={false}
                        />
                        <p className="mt-3 text-[11px] uppercase tracking-[0.32em] text-text-secondary">
                            Culturally Intelligent Localization
                        </p>

                        {/* Headline */}
                        <h1 className="mt-12 max-w-xl font-brand text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                            Secure sign-in for your{' '}
                            <span className="text-accent">translation</span>{' '}
                            studio.
                        </h1>
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-text-secondary sm:text-[15px]">
                            Clerk now manages access to the studio while your
                            translations, storage, and product data remain in
                            Supabase.
                        </p>
                    </div>

                    {/* Middle: globe visual (hidden on small screens to save vertical space) */}
                    <div className="relative my-10 hidden flex-1 items-end justify-center lg:flex">
                        <AfricaGlobe className="h-auto w-full max-w-[520px]" />
                    </div>

                    {/* Bottom: feature pillars */}
                    <div className="relative z-10 mt-10 border-t border-white/5 pt-6 lg:mt-0">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4">
                            {FEATURE_ITEMS.map(({ Icon, title, body }) => (
                                <div key={title} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold leading-tight text-white">
                                            {title}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-text-secondary">
                                            {body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─────────────── Right panel: SignIn card ─────────────── */}
                <section className="relative flex items-center justify-center px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
                    {/* Accent halo behind the card */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[40px] opacity-60 blur-3xl"
                        style={{
                            background:
                                'radial-gradient(50% 50% at 50% 50%, rgba(244,163,0,0.18) 0%, rgba(244,163,0,0) 70%)',
                        }}
                    />

                    {/* Floating glass card wrapper. The inner element is the
                        Clerk <SignIn /> component, themed via `appearance`
                        to inherit the same dark / neon-orange palette. */}
                    <div className="w-full max-w-[480px] rounded-[28px] border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                        <div className="rounded-[22px] bg-[#0e0e0e]/85 px-2 py-5 sm:px-4 sm:py-6">
                            {/* Custom header — Clerk's default "Sign in to
                                {{applicationName}}" title is hidden via
                                appearance.elements below so this header is
                                the visible one. */}
                            <div className="px-2 pb-1 pt-2 text-center sm:px-4">
                                <img
                                    src="/logo-transparent.svg"
                                    alt="AfriTranslate AI"
                                    className="mx-auto h-9 w-auto select-none"
                                    draggable={false}
                                />
                                <h2 className="mt-4 font-brand text-[26px] font-bold leading-tight text-white">
                                    Welcome back!{' '}
                                    <span aria-hidden>👋</span>
                                </h2>
                                <p className="mt-1 text-[13px] text-text-secondary">
                                    Please sign in to continue to your studio
                                </p>
                            </div>

                            <SignIn
                                routing="hash"
                                fallbackRedirectUrl="/"
                                appearance={{
                                    layout: {
                                        logoImageUrl: '/logo-transparent.svg',
                                        logoPlacement: 'inside',
                                        socialButtonsPlacement: 'bottom',
                                        socialButtonsVariant: 'blockButton',
                                        showOptionalFields: true,
                                    },
                                    variables: {
                                        colorBackground: 'transparent',
                                        colorPrimary: '#F4A300',
                                        colorText: '#ffffff',
                                        colorTextSecondary: '#a3a3a3',
                                        colorInputBackground: 'rgba(255,255,255,0.04)',
                                        colorInputText: '#ffffff',
                                        colorDanger: '#ef4444',
                                        colorSuccess: '#22c55e',
                                        colorNeutral: '#ffffff',
                                        fontFamily:
                                            'Inter, ui-sans-serif, system-ui, sans-serif',
                                        fontSize: '14px',
                                        borderRadius: '12px',
                                    },
                                    elements: {
                                        rootBox: 'w-full',
                                        card:
                                            'bg-transparent shadow-none border-0 px-2 py-2 sm:px-4 sm:py-3 w-full',
                                        // Logo + Clerk's default header are
                                        // hidden — we render the branded
                                        // welcome block above instead.
                                        logoBox: 'hidden',
                                        logoImage: 'hidden',
                                        header: 'hidden',
                                        headerTitle: 'hidden',
                                        headerSubtitle: 'hidden',

                                        formFieldLabel:
                                            'text-[12px] font-semibold uppercase tracking-wide text-white/85',
                                        formFieldInput:
                                            'h-11 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/40 focus:border-accent focus:ring-2 focus:ring-accent/40 transition',
                                        formFieldInputShowPasswordButton:
                                            'text-text-secondary hover:text-white',
                                        formFieldHintText:
                                            'text-[11px] text-text-secondary',
                                        formFieldErrorText:
                                            'text-[11px] text-red-400',
                                        formFieldAction:
                                            'text-[12px] font-semibold text-accent hover:text-accent/90',
                                        formFieldRow: 'mt-1',

                                        formButtonPrimary:
                                            'h-11 rounded-xl bg-gradient-to-r from-accent to-[#f5b733] hover:from-[#f5b733] hover:to-accent text-black font-semibold normal-case tracking-normal shadow-[0_10px_30px_-12px_rgba(244,163,0,0.6)] transition-all',

                                        dividerLine: 'bg-white/10',
                                        dividerText:
                                            'text-[11px] uppercase tracking-[0.2em] text-text-secondary',

                                        socialButtonsBlockButton:
                                            'h-11 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.07] hover:border-white/20 transition normal-case',
                                        socialButtonsBlockButtonText:
                                            'text-[13px] font-medium text-white',
                                        socialButtonsBlockButtonArrow: 'hidden',

                                        footer: 'mt-4',
                                        footerAction:
                                            'text-[12px] text-text-secondary text-center',
                                        footerActionText: 'text-text-secondary',
                                        footerActionLink:
                                            'font-semibold text-accent hover:text-accent/90',

                                        identityPreviewEditButton:
                                            'text-accent hover:text-accent/90',
                                        identityPreviewText: 'text-white',

                                        alert:
                                            'rounded-xl bg-red-500/10 border border-red-500/30 text-red-200',
                                        alertText: 'text-[12px]',

                                        formFieldInputShowPasswordIcon:
                                            'text-text-secondary',
                                        badge:
                                            'bg-accent/15 text-accent border border-accent/30 rounded-md text-[10px] uppercase tracking-wide font-semibold',
                                    },
                                }}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SignInExperience;
