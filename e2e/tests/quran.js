// Helpers shared by the Quran reader specs
const readerUrl = (surah, aya = 0) =>
  `list?corpus_id=2&corpus_name=Quran&corpus_type=quran&surah=${surah}&aya=${aya}`;

// verse keys of the ayah cells on screen, e.g. ['2:1', '2:2']
const ayahKeys = (page) =>
  page.locator('[data-ayah]').evaluateAll((els) => els.map((el) => el.dataset.ayah));

module.exports = { readerUrl, ayahKeys };
