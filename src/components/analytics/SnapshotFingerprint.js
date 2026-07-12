import { useMemo, useRef } from 'react';
import { layoutRadicalSignature, layoutBiradicalMandala } from './projectionLayout';
import RadicalSignatureSVG from './RadicalSignatureSVG';
import BiradicalMandalaSVG from './BiradicalMandalaSVG';

const slug = (s) => String(s || '').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'x';

// Dispatches a snapshot to its layout + SVG renderer pair, and lets the
// result be saved as a standalone .svg file — one reproducible image per
// center + scope + projection rule.
export default function SnapshotFingerprint({ snapshot }) {
  const containerRef = useRef(null);

  const layout = useMemo(() => {
    if (!snapshot) return null;
    if (snapshot.projection === 'by_position') return layoutRadicalSignature(snapshot);
    if (snapshot.projection === 'r3_completions') return layoutBiradicalMandala(snapshot);
    return null;
  }, [snapshot]);

  const handleSave = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const source = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([`<?xml version="1.0" standalone="no"?>\n${source}`], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `${slug(snapshot.center?.value)}_${slug(snapshot.scope?.label)}_${snapshot.projection}.svg`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!snapshot || !layout) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#333' }}>choose a center to project</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {snapshot.projection === 'by_position'
          ? <RadicalSignatureSVG layout={layout} />
          : <BiradicalMandalaSVG layout={layout} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px', flexShrink: 0 }}>
        <button onClick={handleSave} style={{
          padding: '4px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(234,179,8,0.4)', color: '#eab308',
        }}>
          save as SVG
        </button>
      </div>
    </div>
  );
}
