import React from 'react';

interface FooterProps {
  onShowTerms: () => void;
  onShowPrivacy: () => void;
  onShowLanding: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShowTerms, onShowPrivacy, onShowLanding }) => {
  return (
    <footer className="flex-shrink-0 p-2 border-t border-border-default text-[11px] text-text-secondary bg-bg-main/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap">
            <span>&copy; {new Date().getFullYear()} <button onClick={onShowLanding} className="hover:text-text-primary transition-colors">AfriTranslate AI</button></span>
            <div className="flex items-center gap-x-2">
                 <button onClick={onShowTerms} className="hover:text-text-primary transition-colors">Terms</button>
                <span className="text-border-default">|</span>
                <button onClick={onShowPrivacy} className="hover:text-text-primary transition-colors">Privacy</button>
            </div>
        </div>
    </footer>
  );
};

export default Footer;