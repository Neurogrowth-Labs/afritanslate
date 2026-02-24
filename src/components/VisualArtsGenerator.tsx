
import React, { useState } from 'react';
import { PaletteIcon, ImageIcon, DownloadIcon, SparklesIcon } from './Icons';
import * as geminiService from '../services/geminiService';

interface VisualArtsGeneratorProps {
    isOffline?: boolean;
}

interface DesignTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
}

const DESIGN_TEMPLATES: DesignTemplate[] = [
    { id: 'township-promo', name: 'Township Promotion', description: 'Vibrant community-focused design', category: 'Marketing' },
    { id: 'afrocentric-brand', name: 'Afrocentric Brand', description: 'Traditional patterns and colors', category: 'Branding' },
    { id: 'youth-social', name: 'Youth Social Media', description: 'Modern, energetic design for Gen Z', category: 'Social' },
    { id: 'government-formal', name: 'Government Formal', description: 'Official, authoritative design', category: 'Official' },
    { id: 'ngo-campaign', name: 'NGO Campaign', description: 'Impactful social cause design', category: 'Nonprofit' },
    { id: 'market-vendor', name: 'Market Vendor', description: 'Local business promotion', category: 'Business' },
    { id: 'cultural-event', name: 'Cultural Event', description: 'Festival and celebration design', category: 'Events' },
    { id: 'education-awareness', name: 'Education Awareness', description: 'Clear, informative design', category: 'Education' }
];

const SKIN_TONES = [
    { name: 'Light', hex: '#F1C27D' },
    { name: 'Medium', hex: '#C68642' },
    { name: 'Dark', hex: '#8D5524' },
    { name: 'Deep', hex: '#4A2511' }
];

const CULTURAL_SYMBOLS = [
    'Adinkra (Ghana)', 'Kente Patterns', 'Maasai Beadwork', 'Ethiopian Cross',
    'Zulu Shields', 'Berber Symbols', 'Ancient Egyptian', 'Swahili Calligraphy'
];

const REGIONS = [
    'West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Central Africa', 'Pan-African'
];

const VisualArtsGenerator: React.FC<VisualArtsGeneratorProps> = ({ isOffline = false }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedRegion, setSelectedRegion] = useState('Pan-African');
    const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
    const [selectedSkinTones, setSelectedSkinTones] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [designDescription, setDesignDescription] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim() && !selectedTemplate) return;

        setIsGenerating(true);
        try {
            const fullPrompt = `Create an Afrocentric visual design with the following specifications:
            
            ${selectedTemplate ? `Template: ${DESIGN_TEMPLATES.find(t => t.id === selectedTemplate)?.name}` : ''}
            ${prompt ? `Custom Request: ${prompt}` : ''}
            Region: ${selectedRegion}
            Cultural Symbols: ${selectedSymbols.join(', ') || 'General African motifs'}
            Skin Tones: ${selectedSkinTones.join(', ') || 'Diverse representation'}
            
            Design should be:
            - Culturally authentic and respectful
            - Visually striking and professional
            - Appropriate for the target region
            - Inclusive and representative
            
            Provide a detailed description of the visual design concept.`;

            const description = await geminiService.getAIAssistantResponse(fullPrompt);
            setDesignDescription(description);
            
            setGeneratedImageUrl('/placeholder-design.jpg');
        } catch (error) {
            console.error('Generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleSymbol = (symbol: string) => {
        setSelectedSymbols(prev => 
            prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
        );
    };

    const toggleSkinTone = (tone: string) => {
        setSelectedSkinTones(prev => 
            prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                        <PaletteIcon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Visual Arts Generator</h1>
                        <p className="text-xs text-text-secondary">Culturally intelligent African design creation</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
                <div className="w-80 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-bg-surface/40 border border-white/5 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-white mb-3">Design Templates</h3>
                        <div className="space-y-2">
                            {DESIGN_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        selectedTemplate === template.id
                                            ? 'bg-accent/20 border-accent text-white'
                                            : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                                    }`}
                                >
                                    <div className="text-xs font-bold">{template.name}</div>
                                    <div className="text-[10px] opacity-70">{template.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-bg-surface/40 border border-white/5 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-white mb-3">Region</h3>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                        >
                            {REGIONS.map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-bg-surface/40 border border-white/5 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-white mb-3">Cultural Symbols</h3>
                        <div className="flex flex-wrap gap-2">
                            {CULTURAL_SYMBOLS.map(symbol => (
                                <button
                                    key={symbol}
                                    onClick={() => toggleSymbol(symbol)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                                        selectedSymbols.includes(symbol)
                                            ? 'bg-accent text-bg-main'
                                            : 'bg-white/10 text-text-secondary hover:bg-white/20'
                                    }`}
                                >
                                    {symbol}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-bg-surface/40 border border-white/5 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-white mb-3">Skin Tone Representation</h3>
                        <div className="flex gap-2">
                            {SKIN_TONES.map(tone => (
                                <button
                                    key={tone.name}
                                    onClick={() => toggleSkinTone(tone.name)}
                                    className={`flex-1 h-12 rounded-lg border-2 transition-all ${
                                        selectedSkinTones.includes(tone.name)
                                            ? 'border-accent scale-105'
                                            : 'border-white/20'
                                    }`}
                                    style={{ backgroundColor: tone.hex }}
                                    title={tone.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-bg-surface/40 border border-white/5 rounded-xl p-4">
                        <label className="text-sm font-bold text-white block mb-2">Custom Design Request</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your design vision... e.g., 'Create a poster for a youth entrepreneurship event in Lagos with vibrant colors and modern African aesthetics'"
                            className="w-full h-24 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent outline-none resize-none"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || (!prompt.trim() && !selectedTemplate)}
                            className="mt-3 w-full px-6 py-3 bg-accent text-bg-main font-bold rounded-xl hover:bg-white hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating Design...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Generate Design</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 bg-[#0c0c0c]/80 border border-white/5 rounded-xl overflow-hidden">
                        {!generatedImageUrl && !isGenerating && (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-sm">Your culturally intelligent design will appear here</p>
                            </div>
                        )}

                        {generatedImageUrl && (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center p-8">
                                    <div className="text-center text-white">
                                        <ImageIcon className="w-24 h-24 mx-auto mb-4" />
                                        <p className="text-sm opacity-70">Design Preview Placeholder</p>
                                        <p className="text-xs opacity-50 mt-2">Integration with image generation API required</p>
                                    </div>
                                </div>
                                
                                {designDescription && (
                                    <div className="p-4 border-t border-white/10 bg-black/40">
                                        <h4 className="text-xs font-bold text-accent uppercase mb-2">Design Concept</h4>
                                        <p className="text-xs text-white leading-relaxed">{designDescription}</p>
                                        <div className="flex gap-2 mt-3">
                                            <button className="flex-1 px-4 py-2 bg-accent text-bg-main rounded-lg text-xs font-bold hover:bg-white transition-all flex items-center justify-center gap-2">
                                                <DownloadIcon className="w-3 h-3" />
                                                Download
                                            </button>
                                            <button className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-all">
                                                Refine Design
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualArtsGenerator;
