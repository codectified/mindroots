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
