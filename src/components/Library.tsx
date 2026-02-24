
import React, { useState, useMemo } from 'react';
import type { LibraryItem } from '../types';
import { SearchIcon, TranslateIcon, VolumeUpIcon } from './Icons';

interface LibraryProps {
  libraryItems: LibraryItem[];
  onSelectExample: (item: LibraryItem) => void;
}

const Library: React.FC<LibraryProps> = ({ libraryItems, onSelectExample }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return libraryItems;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return libraryItems.filter(item => 
      item.text.toLowerCase().includes(lowercasedTerm) ||
      item.meaning.toLowerCase().includes(lowercasedTerm)
    );
  }, [searchTerm, libraryItems]);
  
  const handlePlayAudio = (audioUrl: string) => {
    try {
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error("Error playing audio:", e));
    } catch (e) {
        console.error("Failed to create or play audio:", e)
    }
  };

  return (
    <div className="flex flex-col animate-fade-in max-w-6xl mx-auto py-2 px-4">
        <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Content Library</h1>
            <p className="text-sm text-text-secondary mt-1 max-w-xl mx-auto">
                Discover rich wisdom in African languages. Search for proverbs, idioms, and phrases.
            </p>
        </div>

        <div className="mb-6 sticky top-0 z-10">
            <div className="relative max-w-xl mx-auto">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-text-secondary" />
                </div>
                <input 
                    type="text"
                    placeholder="Search library..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 bg-bg-surface border border-border-default rounded-lg text-sm focus:ring-1 focus:ring-accent focus:border-accent transition placeholder-text-secondary text-text-primary shadow-sm"
                />
            </div>
        </div>
      
        {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-bg-surface p-4 rounded-lg border border-border-default flex flex-col group relative hover:border-accent/50 transition-all">
                        <div className="flex-grow">
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">{item.type}</span>
                             </div>
                            <blockquote className="text-sm font-semibold text-white leading-snug">
                                "{item.text}"
                            </blockquote>
                            <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-3">{item.meaning}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between">
                             <p className="text-[10px] font-mono text-text-secondary uppercase">{item.source} → {item.target}</p>
                             <div className="flex items-center gap-2">
                                {item.audioUrl && (
                                    <button
                                        onClick={() => handlePlayAudio(item.audioUrl!)}
                                        className="p-1.5 bg-bg-main text-text-secondary rounded hover:bg-border-default hover:text-white transition-colors"
                                        title="Play audio"
                                    >
                                        <VolumeUpIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => onSelectExample(item)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent font-bold rounded text-[10px] hover:bg-accent/20 transition-colors uppercase tracking-wide"
                                    title="Translate"
                                >
                                    <TranslateIcon className="w-3.5 h-3.5" />
                                    <span>Use</span>
                                </button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-12">
                 <p className="text-sm text-text-primary">No items found.</p>
                 <p className="text-xs text-text-secondary mt-1">Try a different keyword.</p>
            </div>
        )}
    </div>
  );
};

export default Library;
