import { useLanguage } from '../contexts/LanguageContext';
import { labels } from '../constants/uiLabels';

/**
 * Returns the UI label set for the current L1 language.
 * Use as: const t = useLabels();
 * Then: t.word, t.root, t.foundWords(n), etc.
 */
export const useLabels = () => {
  const { L1 } = useLanguage();
  return L1 === 'arabic' ? labels.sem : labels.en;
};
