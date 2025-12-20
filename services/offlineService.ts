import type { TranslationResult } from '../types';

// A simple dictionary for offline demonstration purposes.
const dictionaries: Record<string, Record<string, string>> = {
  'en-sw': {
    'hello': 'hujambo',
    'world': 'ulimwengu',
    'goodbye': 'kwaheri',
    'thank you': 'asante',
    'yes': 'ndiyo',
    'no': 'hapana',
    'how are you': 'habari gani',
    'i am fine': 'mimi ni mzima',
    'lion': 'simba',
    'game': 'mchezo',
    'roaring': 'ngurumo',
    'a': 'a',
    'kills': 'huua',
    'nation': 'taifa',
    'ruin': 'uharibifu',
    'begins': 'huanza',
    'in': 'katika',
    'the': 'ya',
    'homes': 'nyumba',
    'of': 'ya',
    'its': 'yake',
    'people': 'watu',
    'the ruin of a nation begins in the homes of its people': 'uharibifu wa taifa huanza katika nyumba za watu wake'
  },
  'sw-en': {
    'hujambo': 'hello',
    'ulimwengu': 'world',
    'kwaheri': 'goodbye',
    'asante': 'thank you',
    'ndiyo': 'yes',
    'hapana': 'no',
    'habari gani': 'how are you',
    'mimi ni mzima': 'i am fine',
    'simba': 'lion',
    'mchezo': 'game',
    'ngurumo': 'roaring',
    'taifa': 'nation',
    'uharibifu': 'ruin',
    'huanza': 'begins',
    'katika': 'in',
    'nyumba': 'homes',
    'watu': 'people'
  },
  'en-yo': {
    'hello': 'bawo ni',
    'world': 'aye',
    'goodbye': 'odigba',
    'thank you': 'e se',
    'yes': 'beeni',
    'no': 'raara',
    'house': 'ile',
    'market': 'oja',
    'a': 'a',
    'single': 'ẹyọkan',
    'bracelet': 'egbaowo',
    'does': 'ṣe',
    'not': 'kì',
    'jingle': 'dun',
    'a single bracelet does not jingle': 'egbaowo kan soso ki i dun'
  },
  'yo-en': {
    'bawo ni': 'hello',
    'aye': 'world',
    'odigba': 'goodbye',
    'e se': 'thank you',
    'beeni': 'yes',
    'raara': 'no',
    'ile': 'house',
    'oja': 'market',
    'ẹyọkan': 'single',
    'egbaowo': 'bracelet',
    'dun': 'jingle'
  }
};

/**
 * Provides a basic, word-for-word offline translation using a predefined dictionary.
 */
export function getOfflineTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): TranslationResult {
  const dictionaryKey = `${sourceLang}-${targetLang}`;
  const dictionary = dictionaries[dictionaryKey];

  if (!dictionary) {
    return {
      directTranslation: `Offline translation is not available for this language pair.`,
      culturallyAwareTranslation: `Offline translation not available for ${sourceLang} to ${targetLang}.`,
      explanation: 'Basic offline mode only supports a limited set of languages and vocabulary. Please connect to the internet for full translation capabilities.'
    };
  }

  // First, check for a full phrase match
  const lowercasedText = text.toLowerCase().trim();
  if (dictionary[lowercasedText]) {
    const translatedText = dictionary[lowercasedText];
    return {
      directTranslation: translatedText,
      culturallyAwareTranslation: translatedText,
      explanation: 'This is a basic, literal translation performed while offline. Cultural nuances and complex grammar are not available without an internet connection.'
    };
  }

  // If no full phrase match, do simple word-for-word translation, preserving punctuation
  const words = text.split(/([ .,;!?]+)/);
  const translatedWords = words.map(word => {
    const cleanWord = word.toLowerCase();
    return dictionary[cleanWord] || (word.match(/[a-zA-Z]+/) ? `[${word}]` : word);
  });
  const translatedText = translatedWords.join('');

  return {
    directTranslation: translatedText,
    culturallyAwareTranslation: translatedText,
    explanation: 'This is a basic, literal translation performed while offline. Cultural nuances and complex grammar are not available without an internet connection.'
  };
}