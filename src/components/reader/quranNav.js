// Prev/Next paging shared by the desktop and mobile Quran readers.
//
// setSurah(n) is expected to reset the ayah to the start of the surah (PrimaryList
// does this); setAya(-1) after it means "the last page of that surah".
export const getQuranNav = ({ surah, ayaNumbers, ayaCount, ayahsPerPage, setSurah, setAya }) => {
  const s = Number(surah);
  const sorted = [...ayaNumbers].map(Number).sort((a, b) => a - b);
  const currentStartAya = sorted.length > 0 ? sorted[0] : 1;
  const currentEndAya = sorted.length > 0 ? sorted[sorted.length - 1] : 1;
  const atSurahStart = currentStartAya <= 1;
  const atSurahEnd = currentEndAya >= ayaCount;

  return {
    currentStartAya,
    currentEndAya,
    totalAyasInRange: sorted.length,
    atSurahStart,
    atSurahEnd,
    prevDisabled: s <= 1 && atSurahStart,
    nextDisabled: s >= 114 && atSurahEnd,
    onPrev: () => {
      if (!atSurahStart) {
        setAya(Math.max(1, currentStartAya - ayahsPerPage));
      } else if (s > 1) {
        setSurah(s - 1);
        setAya(-1);
      }
    },
    onNext: () => {
      if (!atSurahEnd) {
        setAya(currentEndAya + 1);
      } else if (s < 114) {
        setSurah(s + 1);
        setAya(0);
      }
    },
  };
};
