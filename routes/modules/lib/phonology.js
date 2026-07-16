// Backend mirror of src/components/analytics/phonology.js — the phonological
// class of each Arabic radical, used by the lexicon-cloud layout to build
// family feature vectors (one-hot class dims) and to color points.
//
// Keep CLASS_ORDER / colors in sync with the frontend module.

const CLASS_ORDER = ['labial', 'coronal', 'emphatic', 'dorsal', 'guttural'];

const CLASS_COLOR = {
  labial:   '#3b82f6',
  coronal:  '#22c55e',
  emphatic: '#f97316',
  dorsal:   '#a855f7',
  guttural: '#ef4444',
  unknown:  '#555555',
};

const RADICAL_CLASS = {
  // labial
  'ب': 'labial', 'م': 'labial', 'ف': 'labial', 'و': 'labial',
  // coronal
  'ت': 'coronal', 'ث': 'coronal', 'ج': 'coronal', 'د': 'coronal', 'ذ': 'coronal',
  'ر': 'coronal', 'ز': 'coronal', 'س': 'coronal', 'ش': 'coronal', 'ل': 'coronal',
  'ن': 'coronal', 'ي': 'coronal',
  // emphatic
  'ص': 'emphatic', 'ض': 'emphatic', 'ط': 'emphatic', 'ظ': 'emphatic',
  // dorsal
  'خ': 'dorsal', 'غ': 'dorsal', 'ك': 'dorsal', 'ق': 'dorsal',
  // guttural
  'ح': 'guttural', 'ع': 'guttural', 'ه': 'guttural', 'ء': 'guttural', 'ا': 'guttural',
};

// class name for a radical (defaults to 'unknown')
const classOf = (radical) => RADICAL_CLASS[radical] || 'unknown';

// index into CLASS_ORDER, or -1 for unknown — used as the compact `cls` channel
const classIndex = (radical) => CLASS_ORDER.indexOf(classOf(radical));

// 5-dim one-hot class vector for a radical (all zeros if unknown)
const classOneHot = (radical) => {
  const v = [0, 0, 0, 0, 0];
  const i = classIndex(radical);
  if (i >= 0) v[i] = 1;
  return v;
};

// legend the frontend can use to render class colors without duplicating the map
const CLASS_LEGEND = CLASS_ORDER.map((name, i) => ({ index: i, name, color: CLASS_COLOR[name] }));

module.exports = { CLASS_ORDER, CLASS_COLOR, RADICAL_CLASS, classOf, classIndex, classOneHot, CLASS_LEGEND };
