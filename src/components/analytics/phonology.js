// Arabic radical phonological classification
// Used for OCP (Obligatory Contour Principle) analysis across analytics charts.
//
// Classes follow standard Arabic phonological groupings:
//   LABIAL   — bilabial / labiodental / labio-velar
//   CORONAL  — dental, alveolar, palatal (place: front of tongue)
//   EMPHATIC — pharyngealized coronals (uvularized secondary articulation)
//   DORSAL   — velar / uvular (place: back of tongue body)
//   GUTTURAL — pharyngeal / laryngeal (place: throat)
//
// The OCP predicts that same-class pairs are underrepresented in r1-r2 position.
// Visible as dark bands along same-class diagonals in the heatmap.

export const PHON_CLASSES = {
  // ── LABIAL ──────────────────────────────────────────────────
  'ب': { class: 'labial',    color: '#3b82f6', label: 'Labial'    },
  'م': { class: 'labial',    color: '#3b82f6', label: 'Labial'    },
  'ف': { class: 'labial',    color: '#3b82f6', label: 'Labial'    },
  'و': { class: 'labial',    color: '#3b82f6', label: 'Labial'    },

  // ── CORONAL ─────────────────────────────────────────────────
  'ت': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ث': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ج': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'د': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ذ': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ر': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ز': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'س': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ش': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ل': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ن': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },
  'ي': { class: 'coronal',   color: '#22c55e', label: 'Coronal'   },

  // ── EMPHATIC (pharyngealized) ────────────────────────────────
  'ص': { class: 'emphatic',  color: '#f97316', label: 'Emphatic'  },
  'ض': { class: 'emphatic',  color: '#f97316', label: 'Emphatic'  },
  'ط': { class: 'emphatic',  color: '#f97316', label: 'Emphatic'  },
  'ظ': { class: 'emphatic',  color: '#f97316', label: 'Emphatic'  },

  // ── DORSAL (velar / uvular) ──────────────────────────────────
  'خ': { class: 'dorsal',    color: '#a855f7', label: 'Dorsal'    },
  'غ': { class: 'dorsal',    color: '#a855f7', label: 'Dorsal'    },
  'ك': { class: 'dorsal',    color: '#a855f7', label: 'Dorsal'    },
  'ق': { class: 'dorsal',    color: '#a855f7', label: 'Dorsal'    },

  // ── GUTTURAL (pharyngeal / laryngeal) ────────────────────────
  'ح': { class: 'guttural',  color: '#ef4444', label: 'Guttural'  },
  'ع': { class: 'guttural',  color: '#ef4444', label: 'Guttural'  },
  'ه': { class: 'guttural',  color: '#ef4444', label: 'Guttural'  },
  'ء': { class: 'guttural',  color: '#ef4444', label: 'Guttural'  },
  'ا': { class: 'guttural',  color: '#ef4444', label: 'Guttural'  },
};

export const CLASS_ORDER = ['labial', 'coronal', 'emphatic', 'dorsal', 'guttural'];

export const CLASS_META = {
  labial:   { color: '#3b82f6', label: 'Labial',   members: 'ب م ف و' },
  coronal:  { color: '#22c55e', label: 'Coronal',  members: 'ت ث ج د ذ ر ز س ش ل ن ي' },
  emphatic: { color: '#f97316', label: 'Emphatic', members: 'ص ض ط ظ' },
  dorsal:   { color: '#a855f7', label: 'Dorsal',   members: 'خ غ ك ق' },
  guttural: { color: '#ef4444', label: 'Guttural', members: 'ح ع ه ء' },
};

export function phonClass(radical) {
  return PHON_CLASSES[radical] || { class: 'unknown', color: '#555', label: 'Unknown' };
}

export function sameClass(r1, r2) {
  const c1 = PHON_CLASSES[r1]?.class;
  const c2 = PHON_CLASSES[r2]?.class;
  return c1 && c2 && c1 === c2;
}

// Detailed phonetic properties per consonant.
// pair: voiced↔voiceless minimal pair, or emphatic↔plain pair.
export const PHONETIC_META = {
  'ب': { voicing: 'voiced',    manner: 'plosive',   place: 'bilabial',        emphatic: false, pair: 'ف'  },
  'ف': { voicing: 'voiceless', manner: 'fricative', place: 'labiodental',     emphatic: false, pair: 'ب'  },
  'م': { voicing: 'voiced',    manner: 'nasal',     place: 'bilabial',        emphatic: false, pair: null },
  'و': { voicing: 'voiced',    manner: 'semivowel', place: 'bilabial',        emphatic: false, pair: null },
  'ت': { voicing: 'voiceless', manner: 'plosive',   place: 'dental',          emphatic: false, pair: 'د'  },
  'د': { voicing: 'voiced',    manner: 'plosive',   place: 'dental',          emphatic: false, pair: 'ت'  },
  'ث': { voicing: 'voiceless', manner: 'fricative', place: 'dental',          emphatic: false, pair: 'ذ'  },
  'ذ': { voicing: 'voiced',    manner: 'fricative', place: 'dental',          emphatic: false, pair: 'ث'  },
  'ر': { voicing: 'voiced',    manner: 'trill',     place: 'alveolar',        emphatic: false, pair: null },
  'ز': { voicing: 'voiced',    manner: 'fricative', place: 'alveolar',        emphatic: false, pair: 'س'  },
  'س': { voicing: 'voiceless', manner: 'fricative', place: 'alveolar',        emphatic: false, pair: 'ز'  },
  'ش': { voicing: 'voiceless', manner: 'fricative', place: 'palato-alveolar', emphatic: false, pair: 'ج'  },
  'ج': { voicing: 'voiced',    manner: 'affricate', place: 'palato-alveolar', emphatic: false, pair: 'ش'  },
  'ل': { voicing: 'voiced',    manner: 'lateral',   place: 'alveolar',        emphatic: false, pair: null },
  'ن': { voicing: 'voiced',    manner: 'nasal',     place: 'alveolar',        emphatic: false, pair: null },
  'ي': { voicing: 'voiced',    manner: 'semivowel', place: 'palatal',         emphatic: false, pair: null },
  'ص': { voicing: 'voiceless', manner: 'fricative', place: 'alveolar',        emphatic: true,  pair: 'س'  },
  'ض': { voicing: 'voiced',    manner: 'fricative', place: 'alveolar',        emphatic: true,  pair: 'ز'  },
  'ط': { voicing: 'voiceless', manner: 'plosive',   place: 'dental',          emphatic: true,  pair: 'ت'  },
  'ظ': { voicing: 'voiced',    manner: 'fricative', place: 'dental',          emphatic: true,  pair: 'ذ'  },
  'خ': { voicing: 'voiceless', manner: 'fricative', place: 'velar',           emphatic: false, pair: 'غ'  },
  'غ': { voicing: 'voiced',    manner: 'fricative', place: 'uvular',          emphatic: false, pair: 'خ'  },
  'ك': { voicing: 'voiceless', manner: 'plosive',   place: 'velar',           emphatic: false, pair: null },
  'ق': { voicing: 'voiceless', manner: 'plosive',   place: 'uvular',          emphatic: false, pair: null },
  'ح': { voicing: 'voiceless', manner: 'fricative', place: 'pharyngeal',      emphatic: false, pair: 'ع'  },
  'ع': { voicing: 'voiced',    manner: 'fricative', place: 'pharyngeal',      emphatic: false, pair: 'ح'  },
  'ه': { voicing: 'voiceless', manner: 'fricative', place: 'laryngeal',       emphatic: false, pair: null },
  'ء': { voicing: 'voiceless', manner: 'plosive',   place: 'laryngeal',       emphatic: false, pair: null },
  'ا': { voicing: 'voiced',    manner: 'semivowel', place: 'laryngeal',       emphatic: false, pair: null },
};
