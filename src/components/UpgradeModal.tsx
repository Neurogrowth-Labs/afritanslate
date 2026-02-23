
import React from 'react';
import { AFRITRANSLATE_MODELS, ADD_ONS } from '../../constants';
import { CheckIcon, CloseIcon } from './Icons';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightedPlan?: string | null;
  onChoosePlan: (planName: string) => void;
  onContactSales: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, highlightedPlan, onChoosePlan, onContactSales }) => {
  if (!isOpen) return null;

  const premiumModels = AFRITRANSLATE_MODELS.filter(m => m.name === 'Basic' || m.name === 'Premium' || m.name === 'Training');
  const enterpriseModel = AFRITRANSLATE_MODELS.find(m => m.name === 'Entreprise');
  const hasHighlight = !!highlightedPlan;

  return (
    <div 
      className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div 
        className="bg-bg-surface rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-border-default m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors" aria-label="Close modal">
            <CloseIcon className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-8">
            <h2 id="upgrade-modal-title" className="text-3xl font-bold text-white">Upgrade Your AfriTranslate AI Plan</h2>
            <p className="text-text-secondary mt-2">Unlock powerful features to enhance your translation experience.</p>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {premiumModels.map((model) => {
              const isHighlighted = highlightedPlan === model.name;
              return (
                <div 
                    key={model.name} 
                    className={`
                        bg-bg-main p-6 rounded-lg border border-border-default flex flex-col
                        transition-all duration-300 transform
                        ${isHighlighted ? 'scale-105 ring-2 ring-accent shadow-lg' : ''}
                        ${hasHighlight && !isHighlighted ? 'scale-95 opacity-70' : ''}
                        ${!hasHighlight ? 'hover:-translate-y-1 hover:border-accent' : ''}
                    `}
                >
                  <h3 className="text-xl font-semibold text-white">{model.name}</h3>
                  <p className="text-3xl font-bold my-4 text-accent">{model.price || 'Contact Us'}</p>
                  <ul className="space-y-2 text-text-primary text-sm mb-6 flex-grow">
                    {model.features?.map(feature => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => model.price ? onChoosePlan(model.name) : onContactSales()}
                    className="w-full mt-auto py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors">
                    {model.price ? 'Choose Plan' : 'Contact Sales'}
                  </button>
                </div>
              );
            })}
             {/* Enterprise Card */}
             {enterpriseModel && (() => {
                const isHighlighted = highlightedPlan === enterpriseModel.name;
                return (
                    <div className={`
                        p-6 rounded-lg flex flex-col border shadow-lg transition-all duration-300 transform bg-accent
                        ${isHighlighted 
                            ? 'border-white ring-2 ring-white scale-105' 
                            : 'border-accent/50'
                        }
                        ${hasHighlight && !isHighlighted ? 'scale-95 opacity-70' : ''}
                        ${!hasHighlight ? 'hover:-translate-y-1' : ''}
                    `}>
                        <h3 className="text-xl font-semibold text-white">{enterpriseModel.name}</h3>
                        <p className="text-lg font-medium my-4 text-white">Custom solutions for your business.</p>
                        <ul className="space-y-2 text-white/90 text-sm mb-6 flex-grow">
                            {enterpriseModel.features?.map(feature => (
                                <li key={feature} className="flex items-start gap-3">
                                <CheckIcon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button 
                          onClick={onContactSales}
                          className="w-full mt-auto py-2.5 bg-white text-accent font-semibold rounded-lg hover:bg-text-primary transition-colors">
                        Contact Sales
                        </button>
                    </div>
                );
             })()}
          </div>
          
          {/* Add-ons */}
          <div>
            <h3 className="text-2xl font-bold text-white text-center mb-6">Power-up with Add-ons</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ADD_ONS.map(addon => (
                <div key={addon.name} className="bg-bg-main p-4 rounded-lg border border-border-default flex items-center gap-4">
                  <div className="bg-bg-surface p-3 rounded-full flex-shrink-0">
                    <addon.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{addon.name} <span className="text-sm font-normal text-text-secondary">{addon.price}</span></h4>
                    <p className="text-sm text-text-secondary">{addon.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
