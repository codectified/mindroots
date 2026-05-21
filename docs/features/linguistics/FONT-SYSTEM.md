# MindRoots Font System

## The 4 Controls

| Control | What it affects | How |
|---------|----------------|-----|
| **Latin size**  | Every rem-based value in the entire UI | `html { font-size: 16px * scale }` — Tailwind utilities are rem-based, so everything scales |
| **Latin style** | body font-family globally | `--font-latin` CSS variable, set by SettingsContext |
| **Arabic size** | Only Arabic text (`.arabic` class, D3 Arabic labels) | `--arabic-*` variables use `px * scale` — independent of Latin html rem scaling |
| **Arabic style**| All elements using `--font-arabic` | `--font-arabic` CSS variable, set by SettingsContext |

---

## How Latin Scaling Works

`DualFontScaleSelector` writes `--font-scale-latin` to `:root`. `typography.css` has:
```css
html { font-size: calc(16px * var(--font-scale-latin)); }
```
Because `html font-size` is set this way, `1rem` = `16px × scale` everywhere. Every Tailwind
utility like `text-sm` (0.875rem), `text-base` (1rem), `text-xl` (1.25rem) — and all other
rem-based CSS across the app — scales proportionally. No opt-in needed.

The `text-dynamic-*` Tailwind utilities (`text-dynamic-sm`, `text-dynamic-base`, etc.) still work
and are equivalent to the corresponding standard sizes, since both are rem-based.

---

## How Arabic Scaling Works

`DualFontScaleSelector` writes `--font-scale-semitic` to `:root`. The Arabic variables in
`typography.css` are **px-based**:
```css
--arabic-base: calc(18px * var(--font-scale-semitic));
```
Because they use `px` not `rem`, they are **independent** of the `html font-size` Latin scaling.
Moving the Latin slider has zero effect on Arabic text; moving the Arabic slider has zero effect
on Latin text.

The `.arabic` CSS class applies both font-family and font-size:
```css
.arabic { font-family: var(--font-arabic); font-size: var(--arabic-base); }
```

---

## How Font Family Switching Works

`SettingsContext` owns both font family choices. On mount and on change:
```js
document.documentElement.style.setProperty('--font-latin',  latinFontFamily);
document.documentElement.style.setProperty('--font-arabic', arabicFontFamily);
```
`body { font-family: var(--font-latin) }` is declared **outside `@layer globals`** in
`typography.css`, so it beats `index.css`'s unlayered body rule via source order (typography.css
loads after index.css in the webpack bundle).

Fonts are loaded via `@fontsource` packages in `src/index.js` (primary) and Google Fonts CDN
in `public/index.html` (fallback).

---

## Where Each CSS Rule Lives

| Rule | File | Layer | Priority |
|------|------|-------|----------|
| `html { font-size: calc(16px * …) }` | `typography.css` | none (unlayered) | beats all layers |
| `body { font-family: var(--font-latin) }` | `typography.css` | none (unlayered) | beats all layers |
| Element defaults (h1–h6, p, li, etc.) | `typography.css` | `@layer globals` | lowest — Tailwind wins |
| `.arabic` class | `typography.css` | none (class-based) | specificity 0,1,0 |
| `@layer globals` layer declaration | `index.css` | — | establishes layer order |

---

## Adding Arabic Font to a New Component

Apply the `.arabic` CSS class to the element containing Arabic text:
```jsx
<span className="arabic">{arabicText}</span>
```

If you need a different size than the default (`var(--arabic-base)` = 18px), use the size
modifier classes (`.arabic.large`, `.arabic.small`) or override with an inline style:
```jsx
<div className="arabic" style={{ fontSize: 'var(--arabic-lg)' }}>{text}</div>
```

NodeInspector is the one exception: it uses an inline `arabicFontFamily` string from context
because `.property-value`'s monospace rule would otherwise override the `.arabic` class.

---

## Common Mistakes

- **Don't use `var(--font-scale-*)` in element selectors** — this was what caused the original
  bleedover. The `html font-size` approach handles Latin scaling without per-element opt-in.
- **Don't put `body { font-family }` in `@layer globals`** — it will lose to `index.css`.
- **Don't use `var()` in React inline `style.fontFamily`** — React uses property assignment
  which rejects CSS variable references. Use a concrete string from context instead.
- **Don't add rem-based sizes to `.arabic`** — they would double-scale when the Latin slider
  moves (since `html font-size` would already be scaling rems). Use `px` or `var(--arabic-*)`.
