

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
    <div className="flex flex-col h-full animate-fade-in">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary">Content Library</h1>
            <p className="text-lg text-text-secondary mt-4 max-w-2xl mx-auto">
                Discover the rich wisdom woven into African languages. Search for a proverb, idiom, or phrase and explore the collection.
            </p>
        </div>

        <div className="mb-8 sticky top-0 z-10 py-4 bg-bg-main/80 backdrop-blur-sm">
            <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-text-secondary" />
                </div>
                <input 
                    type="text"
                    placeholder="Search library..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-12 bg-bg-surface border border-border-default rounded-lg text-lg focus:ring-2 focus:ring-accent focus:border-accent transition placeholder-text-secondary text-text-primary"
                />
            </div>
        </div>
      
        {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-bg-surface p-6 rounded-xl border border-border-default flex flex-col group relative">
                        <div className="flex-grow">
                             <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-full">{item.type}</span>
                            <blockquote className="text-lg font-semibold text-text-primary leading-snug mt-3">
                                "{item.text}"
                            </blockquote>
                            <p className="text-base text-text-secondary mt-3 leading-relaxed">{item.meaning}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border-default flex items-center justify-between">
                             <p className="text-sm text-text-secondary">{item.source} → {item.target}</p>
                             <div className="flex items-center gap-2">
                                {item.audioUrl && (
                                    <button
                                        onClick={() => handlePlayAudio(item.audioUrl!)}
                                        className="p-2 bg-bg-main text-text-secondary rounded-md hover:bg-border-default hover:text-white transition-colors"
                                        title="Play audio pronunciation"
                                    >
                                        <VolumeUpIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => onSelectExample(item)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent font-semibold rounded-md text-sm hover:bg-accent/20 transition-colors"
                                    title="Translate this item"
                                >
                                    <TranslateIcon className="w-4 h-4" />
                                    <span>Translate</span>
                                </button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-16">
                 <p className="text-xl text-text-primary">No items found.</p>
                 <p className="text-text-secondary mt-2">Try searching for a different keyword.</p>
            </div>
        )}
    </div>
  );
};

export default Library;