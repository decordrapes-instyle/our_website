// Offline dynamic vector generator ported from inspire.html for bearings and machinery
export function generateBearingSvg(p: { d?: number; D?: number; B?: number }, viewIndex = 1, seed = 0): string {
  const d = p.d || 25;
  const D = p.D || 62;
  const B = p.B || 16;
  
  const R = 170;
  const r = Math.max(40, (R * d) / D);
  const m = (R + r) / 2;
  const bw = (R - r) * 0.42;
  const n = Math.round(7 + ((seed % 3) * 2));
  
  const tint = [
    [236, 236, 238],
    [228, 230, 232],
    [240, 238, 234],
    [226, 226, 228],
    [232, 234, 236]
  ][(viewIndex - 1) % 5];
  
  const bg = `rgb(${tint.join(',')})`;
  const cx = 320;
  const cy = 240;

  const defs = `
    <defs>
      <radialGradient id="g_${seed}_${viewIndex}" cx=".35" cy=".3">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset=".6" stop-color="#c9c9cc"/>
        <stop offset="1" stop-color="#8e8e93"/>
      </radialGradient>
      <linearGradient id="l_${seed}_${viewIndex}" x1="0" x2="1">
        <stop offset="0" stop-color="#8e8e93"/>
        <stop offset=".45" stop-color="#e9e9ec"/>
        <stop offset="1" stop-color="#9a9a9f"/>
      </linearGradient>
      <pattern id="h_${seed}_${viewIndex}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="9" height="9" fill="#dcdce0"/>
        <line x1="0" y1="0" x2="0" y2="9" stroke="#9b9ba1" stroke-width="2"/>
      </pattern>
    </defs>
  `;

  let bodySvg = '';

  if (viewIndex === 1) {
    // Front View
    const balls = Array.from({ length: n }, (_, j) => {
      const a = (j / n) * 6.2832 + seed;
      return `<circle cx="${cx + m * Math.cos(a)}" cy="${cy + m * Math.sin(a)}" r="${bw}" fill="url(#g_${seed}_${viewIndex})"/>`;
    }).join('');

    bodySvg = `
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#g_${seed}_${viewIndex})" stroke="#9a9a9f" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${R - 14}" fill="#d3d3d7"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="url(#g_${seed}_${viewIndex})"/>
      ${balls}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}" stroke="#9a9a9f" stroke-width="2"/>
    `;
  } else if (viewIndex === 2) {
    // Side View
    const w = Math.max(70, Math.min(300, (2 * R * B) / D * 1.7));
    bodySvg = `
      <rect x="${cx - w / 2}" y="${cy - R}" width="${w}" height="${2 * R}" rx="10" fill="url(#l_${seed}_${viewIndex})" stroke="#8e8e93" stroke-width="2"/>
      <rect x="${cx - w / 2 + 10}" y="${cy - r}" width="${w - 20}" height="${2 * r}" fill="${bg}" stroke="#8e8e93" stroke-dasharray="6 6"/>
      <line x1="${cx - w / 2}" y1="${cy - R + 22}" x2="${cx + w / 2}" y2="${cy - R + 22}" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
      <line x1="${cx - w / 2}" y1="${cy + R - 22}" x2="${cx + w / 2}" y2="${cy + R - 22}" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
    `;
  } else if (viewIndex === 3) {
    // Section / Cutaway View
    const w = Math.max(110, Math.min(240, B * 13));
    const h = (R - r) * 0.9;
    const slices = [-1, 1].map(s => {
      const y = cy + (s * (R + r)) / 2;
      const ya = y - h / 2;
      return `
        <rect x="${cx - w / 2}" y="${ya}" width="${w}" height="${h * 0.28}" fill="url(#h_${seed}_${viewIndex})" stroke="#6f6f75" stroke-width="2"/>
        <rect x="${cx - w / 2}" y="${ya + h * 0.72}" width="${w}" height="${h * 0.28}" fill="url(#h_${seed}_${viewIndex})" stroke="#6f6f75" stroke-width="2"/>
        <circle cx="${cx}" cy="${y}" r="${h * 0.28}" fill="url(#g_${seed}_${viewIndex})" stroke="#6f6f75" stroke-width="2"/>
      `;
    }).join('');

    bodySvg = `
      ${slices}
      <line x1="${cx - w / 2 - 30}" y1="${cy}" x2="${cx + w / 2 + 30}" y2="${cy}" stroke="#999" stroke-dasharray="14 6 3 6"/>
    `;
  } else if (viewIndex === 4) {
    // Angled Isometric View
    const th = 34;
    const e = (y: number, f: string) => `<ellipse cx="${cx}" cy="${y}" rx="${R}" ry="${R * 0.42}" fill="${f}" stroke="#8e8e93" stroke-width="2"/>`;
    bodySvg = `
      <rect x="${cx - R}" y="${cy}" width="${2 * R}" height="${th}" fill="url(#l_${seed}_${viewIndex})"/>
      ${e(cy + th, `url(#l_${seed}_${viewIndex})`)}
      ${e(cy, `url(#g_${seed}_${viewIndex})`)}
      <ellipse cx="${cx}" cy="${cy}" rx="${R - 14}" ry="${(R - 14) * 0.42}" fill="#d3d3d7"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r + 14}" ry="${(r + 14) * 0.42}" fill="url(#g_${seed}_${viewIndex})"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.42}" fill="${bg}" stroke="#8e8e93" stroke-width="2"/>
    `;
  } else {
    // Close-Up Ball View
    const circles = [
      [190, 250, 120],
      [330, 190, 130],
      [450, 290, 125],
      [300, 330, 110],
      [470, 150, 80]
    ].map(([x, y, q]) => `<circle cx="${x + (seed % 5) * 3}" cy="${y}" r="${q}" fill="url(#g_${seed}_${viewIndex})" stroke="#8e8e93" stroke-width="2"/>`).join('');
    bodySvg = circles;
  }

  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">${defs}<rect width="640" height="480" fill="${bg}"/>${bodySvg}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(rawSvg);
}

