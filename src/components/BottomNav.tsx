import React from 'react';
import type { TranslationMode, User, View } from '../types';
import { getTrialStatus } from '../utils/trialUtils';
import {
    SparklesIcon,
    MeetingIcon,
    BookIcon,
    PriceTagIcon,
    UserIcon,
} from './Icons';

interface BottomNavProps {
    currentView: View;
    currentMode: TranslationMode;
    onSetView: (view: View) => void;
    onSetMode: (mode: TranslationMode) => void;
    currentUser: User | null;
    onUpgrade: () => void;
}

/**
 * Mobile bottom navigation. Shown only on viewports < 768px (`md`); the
 * full sidebar takes over on tablet and desktop. Five top-level entries
 * matching the spec from the responsiveness pass:
 *
 *   Creative Studio | Meeting Insights | Glossary Vault | Plans | Profile
 *
 * The hamburger icon in `Header.tsx` opens the full drawer (the existing
 * `Sidebar` component, repurposed to slide in full-width on mobile) which
 * carries every other AI surface. Each item below is a 44 × 44 minimum
 * touch target with a visible orange (#F47B20) active state.
 *
 * Plan-gated entries (Creative, Meetings, Glossary — all require Premium /
 * trial level 2) route through the same `hasAccess` check that
 * `Sidebar.handleFeatureClick` uses; below-tier users get the upgrade modal
 * instead of bypassing the paywall.
 */

interface NavItemProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    isLocked?: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, isLocked, onClick }) => (
    <button
        onClick={onClick}
        aria-label={isLocked ? `${label} (upgrade required)` : label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 touch-target transition-colors ${
            isActive
                ? 'text-[#F47B20]'
                : 'text-text-secondary hover:text-text-primary active:text-text-primary'
        }`}
    >
        <div
            className={`relative flex items-center justify-center w-6 h-6 ${
                isActive ? 'drop-shadow-[0_0_6px_rgba(244,123,32,0.6)]' : ''
            }`}
        >
            {icon}
            {isLocked && (
                <span
                    aria-hidden
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#F47B20] ring-2 ring-bg-surface"
                />
            )}
        </div>
        <span className="text-[10px] font-medium leading-tight tracking-wide">
            {label}
        </span>
        {isActive && (
            <span
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#F47B20]"
            />
        )}
    </button>
);

const PLAN_LEVELS: Record<string, number> = {
    Free: 0, Basic: 1, Premium: 2, Training: 3, Entreprise: 4,
};

// Mirror of `Sidebar.tsx` FEATURE_LEVELS for the three plan-gated entries.
const FEATURE_LEVELS = { creative: 2, meetings: 2, glossary: 2 } as const;

const BottomNav: React.FC<BottomNavProps> = ({
    currentView,
    currentMode,
    onSetView,
    onSetMode,
    currentUser,
    onUpgrade,
}) => {
    const isCreativeActive =
        currentView === 'creative' ||
        currentView === 'motion' ||
        currentView === 'image';
    // Meetings is the only mode-based entry; the others are view-based, so we
    // need to scope this to `currentView === 'chat'` (the only view a Meetings
    // session lives under). Without that scope, a user who taps Meetings then
    // Glossary would see both tabs lit up because `handleSetView` in App.tsx
    // only clears `currentMode` when navigating into `'chat'`.
    const isMeetingsActive = currentMode === 'meetings' && currentView === 'chat';
    const isGlossaryActive = currentView === 'glossary';
    const isPricingActive = currentView === 'pricing';
    const isProfileActive = currentView === 'profile';

    // Plan-access check mirrors Sidebar.tsx:98-102 — trial OR ≥ Premium grants
    // access to all level-2 features; otherwise compare numeric plan level.
    const userPlan = currentUser?.plan || 'Free';
    const currentLevel = PLAN_LEVELS[userPlan] ?? 0;
    const trialStatus = currentUser
        ? getTrialStatus({
              plan: currentUser.plan,
              trial_start_date: (currentUser as { trial_start_date?: string | null }).trial_start_date || null,
          })
        : null;
    const hasPremiumTrialAccess = trialStatus
        ? trialStatus.isPremium || trialStatus.isOnTrial
        : false;
    const hasAccess = (minLevel: number) => {
        if (hasPremiumTrialAccess) return true;
        if (currentLevel >= 2) return true;
        return currentLevel >= minLevel;
    };

    const handleGated = (action: () => void, requiredLevel: number) => () => {
        if (hasAccess(requiredLevel)) {
            action();
        } else {
            onUpgrade();
        }
    };

    const creativeLocked = !hasAccess(FEATURE_LEVELS.creative);
    const meetingsLocked = !hasAccess(FEATURE_LEVELS.meetings);
    const glossaryLocked = !hasAccess(FEATURE_LEVELS.glossary);

    return (
        <nav
            role="navigation"
            aria-label="Primary"
            className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-surface/95 backdrop-blur-lg border-t border-white/10 flex items-stretch shadow-[0_-2px_12px_rgba(0,0,0,0.4)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="relative flex w-full">
                <NavItem
                    label="Creative"
                    icon={<SparklesIcon className="w-5 h-5" />}
                    isActive={isCreativeActive}
                    isLocked={creativeLocked}
                    onClick={handleGated(() => onSetView('creative'), FEATURE_LEVELS.creative)}
                />
                <NavItem
                    label="Meetings"
                    icon={<MeetingIcon className="w-5 h-5" />}
                    isActive={isMeetingsActive}
                    isLocked={meetingsLocked}
                    onClick={handleGated(() => onSetMode('meetings'), FEATURE_LEVELS.meetings)}
                />
                <NavItem
                    label="Glossary"
                    icon={<BookIcon className="w-5 h-5" />}
                    isActive={isGlossaryActive}
                    isLocked={glossaryLocked}
                    onClick={handleGated(() => onSetView('glossary'), FEATURE_LEVELS.glossary)}
                />
                <NavItem
                    label="Plans"
                    icon={<PriceTagIcon className="w-5 h-5" />}
                    isActive={isPricingActive}
                    onClick={() => onSetView('pricing')}
                />
                <NavItem
                    label="Profile"
                    icon={<UserIcon className="w-5 h-5" />}
                    isActive={isProfileActive}
                    onClick={() => onSetView('profile')}
                />
            </div>
        </nav>
    );
};

export default BottomNav;
