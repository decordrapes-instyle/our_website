// Vector generator for Zebra Blinds (Dual-Layer Day & Night Shades)

export type BlindColorScheme = 'grey' | 'linen' | 'charcoal' | 'white';

export function generateZebraBlindSvg(
  variantName = 'Silver Pearl',
  viewIndex = 1,
  colorScheme: BlindColorScheme = 'grey'
): string {
  const colors = {
    grey: { solid: '#52525b', sheer: 'rgba(255,255,255,0.7)', stripe: '#71717a', frame: '#27272a' },
    linen: { solid: '#a89f91', sheer: 'rgba(255,250,240,0.7)', stripe: '#b8afa1', frame: '#443f38' },
    charcoal: { solid: '#27272a', sheer: 'rgba(255,255,255,0.6)', stripe: '#3f3f46', frame: '#18181b' },
    white: { solid: '#f4f4f5', sheer: 'rgba(255,255,255,0.85)', stripe: '#e4e4e7', frame: '#71717a' },
  }[colorScheme] || { solid: '#52525b', sheer: 'rgba(255,255,255,0.7)', stripe: '#71717a', frame: '#27272a' };

  const bg = '#f8f8fa';
  const cleanId = (variantName || 'blind').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  let innerContent = '';

  if (viewIndex === 1) {
    // View 1: Full Front View of Zebra Blind with alternating sheer/solid bands and top cassette
    const stripeCount = 10;
    const stripes = Array.from({ length: stripeCount }, (_, i) => {
      const y = 80 + i * 36;
      return `
        <!-- Sheer mesh day band -->
        <rect x="70" y="${y}" width="500" height="18" fill="${colors.sheer}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
        <!-- Solid fabric band -->
        <rect x="70" y="${y + 18}" width="500" height="18" fill="${colors.solid}"/>
        <!-- Slat thread fold accent line -->
        <line x1="70" y1="${y + 27}" x2="570" y2="${y + 27}" stroke="${colors.stripe}" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="8 4"/>
      `;
    }).join('');

    innerContent = `
      <!-- Window Aperture Shadow -->
      <rect x="60" y="40" width="520" height="400" rx="8" fill="#e4e4e7" stroke="#d4d4d8" stroke-width="3"/>
      <!-- Blind Fabric Body -->
      <g>
        ${stripes}
      </g>
      <!-- Top Aluminum Cassette Valance -->
      <rect x="54" y="32" width="532" height="46" rx="6" fill="#f4f4f5" stroke="#a1a1aa" stroke-width="2"/>
      <rect x="58" y="36" width="524" height="6" fill="#e4e4e7"/>
      <circle cx="80" cy="55" r="4" fill="#a1a1aa"/>
      <circle cx="560" cy="55" r="4" fill="#a1a1aa"/>
      <!-- Bottom Weighted Bar -->
      <rect x="64" y="440" width="512" height="22" rx="4" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
      <line x1="68" y1="451" x2="572" y2="451" stroke="#d4d4d8" stroke-width="2"/>
      <!-- Side Guide Cord -->
      <line x1="565" y1="78" x2="565" y2="440" stroke="#71717a" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="320" y="475" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600" fill="#71717a">
        ${variantName} • Full Front View
      </text>
    `;
  } else if (viewIndex === 2) {
    // View 2: High-detail Close-up of alternating sheer mesh & solid woven blackout band
    innerContent = `
      <rect x="40" y="40" width="560" height="400" rx="12" fill="${colors.sheer}" stroke="#d4d4d8" stroke-width="2"/>
      <!-- Sheer Mesh Texture Grid -->
      <defs>
        <pattern id="mesh_${colorScheme}_${cleanId}" width="12" height="12" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="12" y2="12" stroke="#a1a1aa" stroke-width="0.7" stroke-opacity="0.5"/>
          <line x1="12" y1="0" x2="0" y2="12" stroke="#a1a1aa" stroke-width="0.7" stroke-opacity="0.5"/>
        </pattern>
      </defs>
      <rect x="40" y="40" width="560" height="190" fill="url(#mesh_${colorScheme}_${cleanId})"/>
      <!-- Solid Band Texture with woven ribs -->
      <rect x="40" y="230" width="560" height="210" fill="${colors.solid}"/>
      ${Array.from({ length: 9 }, (_, k) => `
        <line x1="40" y1="${240 + k * 22}" x2="600" y2="${240 + k * 22}" stroke="${colors.stripe}" stroke-width="3" stroke-opacity="0.8"/>
      `).join('')}
      <rect x="40" y="225" width="560" height="10" fill="rgba(0,0,0,0.2)"/>
      <text x="320" y="468" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#52525b">
        Fabric Weave & Light-Filtering Detail
      </text>
    `;
  } else if (viewIndex === 3) {
    // View 3: Complete Blackout Closed Slat View
    innerContent = `
      <rect x="60" y="40" width="520" height="400" rx="8" fill="#e4e4e7" stroke="#d4d4d8" stroke-width="3"/>
      <!-- Overlapping Solid Panels in Full Closed Night Privacy Mode -->
      <rect x="66" y="70" width="508" height="360" fill="${colors.solid}"/>
      ${Array.from({ length: 8 }, (_, j) => `
        <line x1="66" y1="${90 + j * 42}" x2="574" y2="${90 + j * 42}" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
        <rect x="66" y="${92 + j * 42}" width="508" height="6" fill="${colors.stripe}" opacity="0.3"/>
      `).join('')}
      <!-- Top Valance -->
      <rect x="54" y="32" width="532" height="46" rx="6" fill="#f4f4f5" stroke="#a1a1aa" stroke-width="2"/>
      <!-- Bottom Weighted Bar -->
      <rect x="64" y="430" width="512" height="22" rx="4" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
      <text x="320" y="475" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600" fill="#71717a">
        Night Mode • 100% Privacy Alignment
      </text>
    `;
  } else if (viewIndex === 4) {
    // View 4: Motorized Tubular Drive Head & Remote Control
    innerContent = `
      <!-- Aluminum Cassette cutaway -->
      <rect x="50" y="80" width="380" height="120" rx="10" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
      <circle cx="120" cy="140" r="42" fill="#71717a" stroke="#3f3f46" stroke-width="3"/>
      <circle cx="120" cy="140" r="18" fill="#18181b"/>
      <rect x="160" y="125" width="230" height="30" rx="4" fill="#27272a"/>
      <text x="275" y="145" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10" fill="#a1a1aa">
        DOOYA DM25 DC MOTOR
      </text>
      <!-- Remote Handset -->
      <rect x="470" y="60" width="110" height="260" rx="16" fill="#ffffff" stroke="#a1a1aa" stroke-width="2"/>
      <circle cx="525" cy="115" r="22" fill="#f4f4f5" stroke="#d4d4d8" stroke-width="1.5"/>
      <polygon points="525,103 516,118 534,118" fill="#18181b"/>
      <circle cx="525" cy="175" r="14" fill="#f4f4f5" stroke="#d4d4d8" stroke-width="1.5"/>
      <rect x="520" y="170" width="10" height="10" fill="#18181b"/>
      <circle cx="525" cy="235" r="22" fill="#f4f4f5" stroke="#d4d4d8" stroke-width="1.5"/>
      <polygon points="525,247 516,232 534,232" fill="#18181b"/>
      <text x="320" y="440" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#52525b">
        Smart Tubular Motor & RF Controller
      </text>
    `;
  } else {
    // View 5: Room Ambient Setting
    innerContent = `
      <rect x="40" y="40" width="560" height="400" rx="12" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="2"/>
      <!-- Window Reveal Wall -->
      <rect x="120" y="60" width="400" height="350" fill="#ffffff" stroke="#d4d4d8" stroke-width="2"/>
      <!-- Warm sunlight glow -->
      <polygon points="120,60 520,60 560,410 80,410" fill="rgba(254,243,199,0.4)"/>
      <!-- Blind on window -->
      <rect x="140" y="70" width="360" height="280" fill="${colors.sheer}" stroke="#a1a1aa" stroke-width="1"/>
      ${Array.from({ length: 6 }, (_, m) => `
        <rect x="140" y="${90 + m * 40}" width="360" height="20" fill="${colors.solid}"/>
      `).join('')}
      <text x="320" y="465" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600" fill="#71717a">
        Architectural Room Setting • Diffused Day Light
      </text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
    <rect width="640" height="480" fill="${bg}"/>
    ${innerContent}
  </svg>`;

  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
