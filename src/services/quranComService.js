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
export const TRANSLATION_ID = 20; // Saheeh International
export const TRANSLATION_NAME = 'Saheeh International';
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

// { [ayahNumber]: verse } for surah ayat from..to
export const fetchQuranComVerses = (surah, from, to) => {
  const key = `${surah}:${from}-${to}`;
  if (!cache.has(key)) {
    const load = async () => {
      const verses = {};
      for (let page = 1; page; ) {
        const params = new URLSearchParams({
          words: 'true',
          word_fields: 'text_uthmani',
          translations: String(TRANSLATION_ID),
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
export const useQuranComVerses = (surah, from, to) => {
  const key = surah && from && to ? `${surah}:${from}-${to}` : null;
  const [state, setState] = useState({ key: null, verses: null });

  useEffect(() => {
    if (!key) return undefined;
    let live = true;
    fetchQuranComVerses(surah, from, to)
      .then((verses) => live && setState({ key, verses }))
      .catch((err) => {
        console.warn('quran.com verses unavailable:', err.message);
        if (live) setState({ key, verses: null });
      });
    return () => {
      live = false;
    };
  }, [key, surah, from, to]);

  return state.key === key ? state.verses : null;
};
