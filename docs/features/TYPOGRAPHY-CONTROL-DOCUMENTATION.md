# Typography & Font Control System

**Status**: ✅ Production Ready
**Last Updated**: November 16, 2025
**Related Files**: `src/components/selectors/DualFontScaleSelector.js`, `src/styles/typography.css`, `src/components/staticPages/Settings.js`

---

## Overview

MindRoots now provides comprehensive typography control with independent font sizing for English/Latin text and Arabic/Semitic text. This addresses the common UX issue where Arabic text appears smaller than Latin text at the same font size.

## Features

### 1. Dual Font Size Control

Users can independently control font sizes for:
- **English & Latin Text**: Affects all Latin-script content (English, French, etc.)
- **Arabic & Semitic Text**: Affects Arabic, Hebrew, and other Semitic script content

**Location**: Settings > Typography Settings > Font Size Control

#### Scale Options
- **Small**: 85% (0.85x multiplier)
- **Normal**: 100% (1x multiplier) - default
- **Large**: 115% (1.15x multiplier)
- **Extra Large**: 130% (1.3x multiplier)
- **XX-Large**: 150% (1.5x multiplier)

Users can also use the slider for fine-tuning (0.75x to 1.75x).

#### Implementation Details

**CSS Variables**:
```css
--font-scale-latin: 1;      /* Controls Latin/English text */
--font-scale-semitic: 1;    /* Controls Arabic/Semitic text */
```

All Latin text sizes use `--font-scale-latin`:
```css
--text-base: calc(1rem * var(--font-scale-latin));
--h1-size: calc(2.5rem * var(--font-scale-latin));
```

All Arabic text sizes use `--font-scale-semitic`:
```css
--arabic-base: calc(1.15rem * var(--font-scale-semitic));
--arabic-lg: calc(1.3rem * var(--font-scale-semitic));
```

**Storage**:
- Latin scale: `localStorage['fontScaleLatín']` (stored as decimal)
- Semitic scale: `localStorage['fontScaleSemitic']` (stored as decimal)

### 2. Arabic Font Selection

Three distinct Arabic font options with visual previews:

#### **Amiri** (Classic)
- **Type**: Serif
- **Character**: Elegant, traditional Arabic font
- **Best for**: Quranic text, literary works
- **Family**: `'Amiri', serif`
- **Sample**: ٱلْخَبِيرُ

#### **Noto Serif Arabic** (Modern)
- **Type**: Serif
- **Character**: Consistent with Latin serif fonts (Noto Serif)
- **Best for**: Bilingual documents, formal content
- **Family**: `'Noto Serif Arabic', serif`
- **Sample**: ٱلْخَبِيرُ (rendered differently from Amiri)

#### **Noto Kufi Arabic** (Contemporary)
- **Type**: Sans-serif
- **Character**: Clean, geometric, modern appearance
- **Best for**: UI text, contemporary designs
- **Family**: `'Noto Kufi Arabic', sans-serif`
- **Sample**: ٱلْخَبِيرُ (rendered in geometric style)

**Location**: Settings > Typography Settings > Arabic Font Style

**Storage**: `localStorage['arabicFont']` (id: 'amiri' | 'noto' | 'kufi')

### 3. Font Loading

All fonts are loaded from Google Fonts API in `public/index.html`:

```html
<!-- Latin fonts -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap">

<!-- Arabic fonts with multiple styles -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&subset=arabic&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+Arabic:wght@400;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap">
```

## User Experience Flow

### Accessing Settings
1. Navigate to Settings page
2. Find "Typography Settings" section
3. Two subsections:
   - Font Size Control (with dual sliders)
   - Arabic Font Style (with visual previews)

### Adjusting Font Sizes
1. Click preset buttons (Small, Normal, Large, etc.) OR use slider
2. Changes apply instantly
3. Preferences saved automatically to localStorage

### Changing Arabic Font
1. Select one of three font options
2. Visual preview shows how the font looks
3. Selection applies instantly across all Arabic text
4. Preference saved automatically

## Technical Architecture

### Component Hierarchy
```
Settings.js (parent)
├── DualFontScaleSelector.js (font size control)
└── Arabic font selection (inline in Settings.js)
```

### CSS Variable System

**Root variables** (in typography.css):
- `--font-scale-latin`: 0.75 to 1.75 (user-controlled)
- `--font-scale-semitic`: 0.75 to 1.75 (user-controlled)

**Computed variables**:
```css
--text-base: calc(1rem * var(--font-scale-latin));
--arabic-base: calc(1.15rem * var(--font-scale-semitic));
```

**Applied to elements**:
```css
p { font-size: var(--text-base); }
.arabic-text { font-size: var(--arabic-base); }
[lang="ar"] { font-size: var(--arabic-base); }
```

### localStorage Schema

```javascript
{
  'fontScaleLatín': '1',           // String representation of decimal
  'fontScaleSemitic': '1',         // String representation of decimal
  'arabicFont': 'amiri'            // 'amiri' | 'noto' | 'kufi'
}
```

## Applying Typography Classes

### Using Arabic Text Classes

**In components or HTML:**
```jsx
<div className="arabic-text">Arabic text here</div>
<div className="arabic-text large">Large Arabic text</div>
<div lang="ar">Arabic text with lang attribute</div>
```

**Available Arabic size modifiers:**
- `.arabic-text.large`: Uses `--arabic-lg`
- `.arabic-text.small`: Uses `--arabic-sm`
- `.arabic-text.tiny`: Uses `--arabic-xs`
- Default: Uses `--arabic-base`

### Using Latin Text Classes

Latin text automatically uses `--font-scale-latin` through standard elements:
```jsx
<p>English paragraph (uses --text-base)</p>
<h1>Heading (uses --h1-size)</h1>
<button>Button (uses --button-size)</button>
```

## Mobile Responsiveness

Typography system is responsive. On mobile devices:
- Base font sizes are reduced (13px instead of 16px)
- Scale multipliers still apply
- User-set scales work on all screen sizes

**Responsive breakpoints** (in typography.css):
- `@media (max-width: 768px)`: Tablet/small devices
- `@media (max-width: 480px)`: Mobile phones

## Performance Considerations

1. **CSS Variables**: Zero performance cost - native browser support
2. **Font Loading**: Async from Google Fonts with `display=swap`
3. **localStorage**: Minimal (~100 bytes per user)
4. **No JavaScript recalculation**: All sizing handled by CSS

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (CSS variables supported since Safari 9.1)
- Mobile browsers: Full support (iOS 9.3+, Android 5.0+)

## Troubleshooting

### Arabic fonts not loading
- Check network tab in DevTools - verify Google Fonts requests succeed
- Verify `public/index.html` has correct font imports
- Clear browser cache and reload

### Font changes not applying
- Check localStorage: Open DevTools > Application > Local Storage
- Verify `fontScaleLatín`, `fontScaleSemitic`, and `arabicFont` keys exist
- Hard reload page (Ctrl+Shift+R or Cmd+Shift+R)

### Text still looks too small/large
- Arabic text naturally appears smaller than Latin at same size
- Try increasing Arabic scale to 1.15-1.3x
- Use the slider for precise fine-tuning

## Future Enhancements

Potential improvements for future iterations:
- Additional Arabic fonts (Scheherazade, Droid Arabic, etc.)
- Custom font upload capability
- Font weight selection (400, 500, 700)
- Line height adjustment for readability
- Preview mode showing all text at new sizes before saving

## Related Documentation

- [Typography System Overview](../DOCUMENTATION-INDEX.md) - In Documentation Index
- [Settings Page](SETTINGS-PAGE.md) - If separate doc exists
- [CSS Variables Guide](../archived/) - Check archived docs

---

**Last Updated**: November 16, 2025
**Maintained By**: Development Team
