import { useEffect, useState } from 'react';

// Word-by-word meanings, transliteration, Sahih International translation and
// Mishary Alafasy recitation from quran.com's public API (Quran Foundation).
// The Quran CorpusItems in the graph have none of these. Word positions match
// one-to-one: both have 77,429 words, keyed surah:ayah:word.
//
// TODO(Phase 5): move to the authenticated Quran Foundation API behind the
// backend once QF_CLIENT_ID / QF_CLIENT_SECRET exist.

const API = 'https://api.quran.com/api/v4';
const AUDIO_BASE = 'https://verses.quran.com/';
export const DEFAULT_TRANSLATION_ID = 20; // Saheeh International
export const DEFAULT_TRANSLATION_NAME = 'Saheeh International';
// Languages quran.com has word-by-word meanings in (others fall back to English)
export const WORD_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ur', name: 'اردو' },
  { code: 'id', name: 'Indonesia' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'fa', name: 'فارسی' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'inh', name: 'Гӏалгӏай' },
];
export const RECITER_ID = 7; // Mishary Rashid Alafasy
export const RECITER_NAME = 'Mishary Alafasy';
const PER_PAGE = 50; // API maximum

// "Alif, Lām, Meem.<sup foot_note=195935>1</sup>" → "Alif, Lām, Meem."
export const cleanTranslation = (html) =>
  (html || '')
    .replace(/<sup[^>]*>.*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();

// API verse → { translation, audioUrl, segments, words: { [position]: { gloss, translit } } }
export const toVerse = (v) => ({
  translation: cleanTranslation(v.translations?.[0]?.text),
  audioUrl: v.audio?.url ? AUDIO_BASE + v.audio.url : null,
  // [index, wordPosition, startMs, endMs]
  segments: v.audio?.segments || [],
  words: Object.fromEntries(
    (v.words || [])
      .filter((w) => w.char_type_name === 'word')
      .map((w) => [w.position, { gloss: w.translation?.text || null, translit: w.transliteration?.text || null }])
  ),
});

const cache = new Map();

// All of quran.com's translations, grouped by language:
// [{ language, direction, translations: [{ id, name, author }] }], English first
let translationList = null;
export const fetchTranslationList = () => {
  if (!translationList) {
    translationList = Promise.all([
      fetch(`${API}/resources/translations`).then((r) => r.json()),
      fetch(`${API}/resources/languages`).then((r) => r.json()),
    ])
      .then(([{ translations }, { languages }]) => {
        const direction = Object.fromEntries(languages.map((l) => [l.name.toLowerCase(), l.direction]));
        const groups = {};
        translations.forEach((t) => {
          const language = t.language_name;
          if (!groups[language]) groups[language] = { language, direction: direction[language] || 'ltr', translations: [] };
          groups[language].translations.push({ id: t.id, name: t.translated_name?.name || t.name, author: t.author_name });
        });
        return Object.values(groups)
          .map((g) => ({ ...g, translations: g.translations.sort((a, b) => a.name.localeCompare(b.name)) }))
          .sort((a, b) => (a.language === 'english' ? -1 : b.language === 'english' ? 1 : a.language.localeCompare(b.language)));
      })
      .catch((err) => {
        translationList = null; // retry next time
        throw err;
      });
  }
  return translationList;
};

// { [ayahNumber]: verse } for surah ayat from..to
export const fetchQuranComVerses = (surah, from, to, { translationId = DEFAULT_TRANSLATION_ID, wordLanguage = 'en' } = {}) => {
  const key = `${surah}:${from}-${to}:${translationId}:${wordLanguage}`;
  if (!cache.has(key)) {
    const load = async () => {
      const verses = {};
      for (let page = 1; page; ) {
        const params = new URLSearchParams({
          words: 'true',
          word_fields: 'text_uthmani',
          translations: String(translationId),
          language: wordLanguage,
          audio: String(RECITER_ID),
          from: String(from),
          to: String(to),
          per_page: String(PER_PAGE),
          page: String(page),
        });
        const res = await fetch(`${API}/verses/by_chapter/${surah}?${params}`);
        if (!res.ok) throw new Error(`quran.com ${res.status}`);
        const data = await res.json();
        data.verses.forEach((v) => {
          verses[v.verse_number] = toVerse(v);
        });
        page = data.pagination?.next_page || null;
      }
      return verses;
    };
    cache.set(
      key,
      load().catch((err) => {
        cache.delete(key); // retry on the next render
        throw err;
      })
    );
  }
  return cache.get(key);
};

// Verses for the page on screen; null until they arrive (or if quran.com is unreachable)
export const useQuranComVerses = (surah, from, to, { translationId, wordLanguage } = {}) => {
  const key = surah && from && to ? `${surah}:${from}-${to}:${translationId}:${wordLanguage}` : null;
  const [state, setState] = useState({ key: null, verses: null });

  useEffect(() => {
    if (!key) return undefined;
    let live = true;
    fetchQuranComVerses(surah, from, to, { translationId, wordLanguage })
      .then((verses) => live && setState({ key, verses }))
      .catch((err) => {
        console.warn('quran.com verses unavailable:', err.message);
        if (live) setState({ key, verses: null });
      });
    return () => {
      live = false;
    };
  }, [key, surah, from, to, translationId, wordLanguage]);

  return state.key === key ? state.verses : null;
};
