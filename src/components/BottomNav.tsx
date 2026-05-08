import React from 'react';
import type { TranslationMode, View } from '../types';
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
 */

interface NavItemProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 touch-target transition-colors ${
            isActive
                ? 'text-[#F47B20]'
                : 'text-text-secondary hover:text-text-primary active:text-text-primary'
        }`}
    >
        <div
            className={`flex items-center justify-center w-6 h-6 ${
                isActive ? 'drop-shadow-[0_0_6px_rgba(244,123,32,0.6)]' : ''
            }`}
        >
            {icon}
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

const BottomNav: React.FC<BottomNavProps> = ({
    currentView,
    currentMode,
    onSetView,
    onSetMode,
}) => {
    const isCreativeActive =
        currentView === 'creative' ||
        currentView === 'motion' ||
        currentView === 'image';
    const isMeetingsActive = currentMode === 'meetings';
    const isGlossaryActive = currentView === 'glossary';
    const isPricingActive = currentView === 'pricing';
    const isProfileActive = currentView === 'profile';

    return (
        <nav
            role="navigation"
            aria-label="Primary"
            className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur-lg border-t border-white/10 flex items-stretch shadow-[0_-2px_12px_rgba(0,0,0,0.4)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="relative flex w-full">
                <NavItem
                    label="Creative"
                    icon={<SparklesIcon className="w-5 h-5" />}
                    isActive={isCreativeActive}
                    onClick={() => onSetView('creative')}
                />
                <NavItem
                    label="Meetings"
                    icon={<MeetingIcon className="w-5 h-5" />}
                    isActive={isMeetingsActive}
                    onClick={() => onSetMode('meetings')}
                />
                <NavItem
                    label="Glossary"
                    icon={<BookIcon className="w-5 h-5" />}
                    isActive={isGlossaryActive}
                    onClick={() => onSetView('glossary')}
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
