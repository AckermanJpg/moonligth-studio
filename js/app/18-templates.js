// Templates
const tplStyle = t => t.style || 'pixel';
const TPL = [
  {
    name: 'Full Moon',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#020821', c2: '#1a5cff'});
      p.els.push(
        mk('sprite', {
          spr: 'moon',
          fill: '#d6f8ff',
          w: W * 0.5,
          h: W * 0.5,
          x: W * 0.25,
          y: H * 0.12,
          shadow: true,
          sc: '#3fe0ff',
          sd: 12,
        }),
        mk('text', {
          text: 'FULL MOON',
          font: 'Press Start 2P',
          size: Math.round(W * 0.075),
          fill: '#ffffff',
          shadow: true,
          sc: '#1a5cff',
          sd: 8,
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.68,
        }),
        mk('text', {
          text: 'LA LUNA LLENA — 00:00',
          font: 'Silkscreen',
          size: Math.round(W * 0.032),
          fill: '#3fe0ff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.8,
        }),
        mk('sprite', {spr: 'star', fill: '#ffd84a', w: 90, h: 90, x: W * 0.08, y: H * 0.1}),
        mk('sprite', {spr: 'star', fill: '#d6f8ff', w: 60, h: 60, x: W * 0.84, y: H * 0.2}),
      );
      return p;
    },
  },
  {
    name: 'Tartarus',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'stripes', c1: '#0b2a8a', c2: '#0a2475'});
      p.els.push(
        mk('rect', {
          fill: '#3fe0ff',
          w: W * 0.9,
          h: H * 0.26,
          x: W * 0.05,
          y: H * 0.34,
          px: 8,
          shadow: true,
          sc: '#020821',
          sd: 14,
        }),
        mk('text', {
          text: 'TARTARUS',
          font: 'Press Start 2P',
          size: Math.round(W * 0.09),
          fill: '#020821',
          align: 'center',
          w: W * 0.84,
          x: W * 0.08,
          y: H * 0.41,
        }),
        mk('text', {
          text: 'PISO 001 — ASCENSO',
          font: 'VT323',
          size: Math.round(W * 0.06),
          fill: '#d6f8ff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.68,
        }),
        mk('sprite', {
          spr: 'skull',
          fill: '#ffffff',
          w: W * 0.16,
          h: W * 0.16,
          x: W * 0.42,
          y: H * 0.1,
          shadow: true,
          sc: '#1a5cff',
          sd: 8,
        }),
      );
      return p;
    },
  },
  {
    name: 'Social Hour',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'checker', c1: '#1a5cff', c2: '#1654e6'});
      p.els.push(
        mk('rect', {
          fill: '#f4fcff',
          w: W * 0.8,
          h: H * 0.6,
          x: W * 0.1,
          y: H * 0.2,
          px: 8,
          shadow: true,
          sc: '#020821',
          sd: 16,
          stroke: '#020821',
          sw: 10,
        }),
        mk('text', {
          text: 'ESTA NOCHE',
          font: 'Pixelify Sans',
          bold: true,
          size: Math.round(W * 0.1),
          fill: '#0b2a8a',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.3,
        }),
        mk('text', {
          text: '21:00 · SALÓN DE ESTUDIO',
          font: 'Silkscreen',
          size: Math.round(W * 0.03),
          fill: '#1a5cff',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.5,
        }),
        mk('sprite', {spr: 'heart', fill: '#ff3d6e', w: W * 0.14, h: W * 0.12, x: W * 0.43, y: H * 0.6}),
      );
      return p;
    },
  },
  {
    name: 'Dark Hour',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'stars', c1: '#020821', c2: '#d6f8ff'});
      p.els.push(
        mk('sprite', {
          spr: 'clock',
          fill: '#3fe0ff',
          w: W * 0.36,
          h: W * 0.36,
          x: W * 0.32,
          y: H * 0.14,
          shadow: true,
          sc: '#1a5cff',
          sd: 12,
        }),
        mk('text', {
          text: '00:00',
          font: 'VT323',
          size: Math.round(W * 0.2),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.52,
          lh: 1,
        }),
        mk('text', {
          text: 'THE DARK HOUR',
          font: 'Press Start 2P',
          size: Math.round(W * 0.045),
          fill: '#3fe0ff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.76,
        }),
      );
      return p;
    },
  },
  {
    name: 'Cita',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#050d2b', c2: '#0b2a8a'});
      p.els.push(
        mk('sprite', {spr: 'moon', fill: '#d6f8ff', w: W * 0.14, h: W * 0.14, x: W * 0.43, y: H * 0.1}),
        mk('text', {
          text: 'Sé quien eres,\nno lo que esperan.',
          font: 'Pixelify Sans',
          bold: true,
          size: Math.round(W * 0.075),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.84,
          x: W * 0.08,
          y: H * 0.33,
          lh: 1.25,
          shadow: true,
          sc: '#1a5cff',
          sd: 6,
        }),
        mk('rect', {fill: '#3fe0ff', w: W * 0.3, h: 10, x: W * 0.35, y: H * 0.74, px: 5}),
        mk('text', {
          text: '— A LAS 00:00',
          font: 'Silkscreen',
          size: Math.round(W * 0.03),
          fill: '#3fe0ff',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.79,
        }),
      );
      return p;
    },
  },
  {
    name: 'Concierto',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'stripes', c1: '#1a0a4a', c2: '#12063a'});
      p.els.push(
        mk('sprite', {spr: 'bolt', fill: '#ffd84a', w: W * 0.16, h: W * 0.2, x: W * 0.06, y: H * 0.1}),
        mk('sprite', {spr: 'bolt', fill: '#ffd84a', w: W * 0.16, h: W * 0.2, x: W * 0.78, y: H * 0.1}),
        mk('text', {
          text: 'LIVE\nTONIGHT',
          font: 'Press Start 2P',
          size: Math.round(W * 0.095),
          fill: '#ffd84a',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.3,
          lh: 1.3,
          shadow: true,
          sc: '#ff3d6e',
          sd: 10,
        }),
        mk('rect', {fill: '#ff3d6e', w: W * 0.8, h: H * 0.1, x: W * 0.1, y: H * 0.7, px: 8}),
        mk('text', {
          text: 'SÁB 22 · 21:00 · ENTRADA LIBRE',
          font: 'Silkscreen',
          size: Math.round(W * 0.032),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.76,
          x: W * 0.12,
          y: H * 0.725,
        }),
      );
      return p;
    },
  },
  {
    name: 'Cumpleaños',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'dots', c1: '#1a5cff', c2: '#3fe0ff'});
      p.els.push(
        mk('rect', {
          fill: '#f4fcff',
          w: W * 0.84,
          h: H * 0.5,
          x: W * 0.08,
          y: H * 0.25,
          px: 8,
          stroke: '#020821',
          sw: 10,
          shadow: true,
          sc: '#020821',
          sd: 14,
        }),
        mk('text', {
          text: '¡FELIZ\nCUMPLE!',
          font: 'Press Start 2P',
          size: Math.round(W * 0.085),
          fill: '#0b2a8a',
          align: 'center',
          w: W * 0.76,
          x: W * 0.12,
          y: H * 0.31,
          lh: 1.35,
        }),
        mk('sprite', {spr: 'heart', fill: '#ff3d6e', w: W * 0.12, h: W * 0.105, x: W * 0.2, y: H * 0.6}),
        mk('sprite', {spr: 'star', fill: '#ffd84a', w: W * 0.12, h: W * 0.12, x: W * 0.44, y: H * 0.59}),
        mk('sprite', {spr: 'heart', fill: '#ff3d6e', w: W * 0.12, h: W * 0.105, x: W * 0.68, y: H * 0.6}),
      );
      return p;
    },
  },
  {
    name: 'Ficha de stats',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'stripes', c1: '#0b2a8a', c2: '#0a2475'});
      p.els.push(
        mk('rect', {
          fill: '#020821',
          w: W * 0.86,
          h: H * 0.82,
          x: W * 0.07,
          y: H * 0.09,
          px: 8,
          stroke: '#3fe0ff',
          sw: 8,
          shadow: true,
          sc: '#1a5cff',
          sd: 14,
        }),
        mk('text', {
          text: 'TU NOMBRE',
          font: 'Press Start 2P',
          size: Math.round(W * 0.05),
          fill: '#ffffff',
          w: W * 0.7,
          x: W * 0.12,
          y: H * 0.14,
        }),
        mk('text', {
          text: 'NIVEL 7 · ESTUDIANTE',
          font: 'VT323',
          size: Math.round(W * 0.05),
          fill: '#3fe0ff',
          w: W * 0.7,
          x: W * 0.12,
          y: H * 0.23,
        }),
      );
      [
        ['ACADÉMICO', 0.8],
        ['CARISMA', 0.55],
        ['VALOR', 0.7],
        ['ARTE', 0.4],
      ].forEach(([l, v], i) => {
        const y = H * (0.35 + i * 0.14);
        p.els.push(
          mk('text', {
            text: l,
            font: 'Silkscreen',
            size: Math.round(W * 0.03),
            fill: '#d6f8ff',
            w: W * 0.5,
            x: W * 0.12,
            y,
          }),
          mk('rect', {fill: '#0b2a8a', w: W * 0.7, h: H * 0.04, x: W * 0.12, y: y + H * 0.05, px: 6}),
          mk('rect', {fill: '#3fe0ff', w: W * 0.7 * v, h: H * 0.04, x: W * 0.12, y: y + H * 0.05, px: 6}),
        );
      });
      return p;
    },
  },
  {
    name: 'Horario',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'checker', c1: '#061540', c2: '#050f38'});
      p.els.push(
        mk('text', {
          text: 'HORARIO',
          font: 'Press Start 2P',
          size: Math.round(W * 0.07),
          fill: '#3fe0ff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.05,
          shadow: true,
          sc: '#1a5cff',
          sd: 6,
        }),
      );
      [
        ['LUN', 'Matemáticas'],
        ['MAR', 'Arte'],
        ['MIÉ', 'Laboratorio'],
        ['JUE', 'Música'],
        ['VIE', 'Club'],
      ].forEach(([d, a], i) => {
        const y = H * (0.2 + i * 0.15);
        p.els.push(
          mk('rect', {
            fill: i % 2 ? '#1a5cff' : '#0b2a8a',
            w: W * 0.84,
            h: H * 0.11,
            x: W * 0.08,
            y,
            px: 8,
            stroke: '#3fe0ff',
            sw: 5,
          }),
          mk('text', {
            text: d,
            font: 'Silkscreen',
            bold: true,
            size: Math.round(W * 0.04),
            fill: '#ffd84a',
            w: W * 0.2,
            x: W * 0.11,
            y: y + H * 0.03,
          }),
          mk('text', {
            text: a,
            font: 'DotGothic16',
            size: Math.round(W * 0.045),
            fill: '#ffffff',
            w: W * 0.55,
            x: W * 0.3,
            y: y + H * 0.027,
          }),
        );
      });
      return p;
    },
  },
  {
    name: 'Título de presentación',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#020821', c2: '#1a5cff'});
      p.els.push(
        mk('rect', {fill: '#3fe0ff', w: W * 0.03, h: H * 0.5, x: W * 0.08, y: H * 0.25, px: 8}),
        mk('text', {
          text: 'TÍTULO DE\nTU PROYECTO',
          font: 'Press Start 2P',
          size: Math.round(W * 0.045),
          fill: '#ffffff',
          w: W * 0.7,
          x: W * 0.13,
          y: H * 0.28,
          lh: 1.4,
          shadow: true,
          sc: '#0b2a8a',
          sd: 6,
        }),
        mk('text', {
          text: 'Subtítulo · Nombre · 2026',
          font: 'VT323',
          size: Math.round(W * 0.04),
          fill: '#3fe0ff',
          w: W * 0.7,
          x: W * 0.13,
          y: H * 0.62,
        }),
        mk('sprite', {
          spr: 'clock',
          fill: '#d6f8ff',
          w: W * 0.16,
          h: W * 0.16,
          x: W * 0.74,
          y: H * 0.3,
          shadow: true,
          sc: '#0b2a8a',
          sd: 8,
        }),
      );
      return p;
    },
  },
  {
    name: 'Rank Up',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'checker', c1: '#1a5cff', c2: '#3fe0ff'});
      p.els.push(
        mk('rect', {
          fill: '#020821',
          w: W * 1.2,
          h: H * 0.26,
          x: -W * 0.1,
          y: H * 0.37,
          rot: -8,
          px: 8,
          shadow: true,
          sc: '#0b2a8a',
          sd: 12,
        }),
        mk('text', {
          text: 'RANK UP!',
          font: 'Pixelify Sans',
          bold: true,
          size: Math.round(W * 0.15),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.4,
          rot: -8,
          shadow: true,
          sc: '#1a5cff',
          sd: 8,
        }),
        mk('sprite', {spr: 'bolt', fill: '#ffd84a', w: W * 0.14, h: W * 0.18, x: W * 0.1, y: H * 0.12}),
        mk('sprite', {spr: 'star', fill: '#ffffff', w: W * 0.12, h: W * 0.12, x: W * 0.75, y: H * 0.7}),
      );
      return p;
    },
  },
  {
    name: 'Oferta',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'stripes', c1: '#ff3d6e', c2: '#e02a58'});
      p.els.push(
        mk('text', {
          text: 'SALE',
          font: 'Press Start 2P',
          size: Math.round(W * 0.16),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.18,
          shadow: true,
          sc: '#020821',
          sd: 12,
        }),
        mk('rect', {
          fill: '#ffd84a',
          w: W * 0.7,
          h: H * 0.2,
          x: W * 0.15,
          y: H * 0.5,
          px: 8,
          stroke: '#020821',
          sw: 8,
        }),
        mk('text', {
          text: '-50%',
          font: 'Pixelify Sans',
          bold: true,
          size: Math.round(W * 0.15),
          fill: '#020821',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.5,
        }),
        mk('text', {
          text: 'SOLO ESTA SEMANA',
          font: 'Silkscreen',
          size: Math.round(W * 0.034),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.8,
        }),
      );
      return p;
    },
  },
  {
    name: 'Miniatura YouTube',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'stripes', c1: '#ff3d6e', c2: '#e02a58'});
      p.els.push(
        mk('text', {
          text: 'NO LO\nCREERÁS',
          font: 'Anton',
          size: Math.round(H * 0.26),
          fill: '#ffd84a',
          w: W * 0.6,
          x: W * 0.04,
          y: H * 0.14,
          lh: 1.05,
          tsw: Math.round(H * 0.02),
          tsc: '#020821',
          shadow: true,
          sc: '#020821',
          sd: 10,
        }),
        mk('image', {
          src: null,
          x: W * 0.64,
          y: H * 0.12,
          w: W * 0.32,
          h: H * 0.76,
          px: 1,
          stroke: '#ffffff',
          sw: 8,
        }),
        mk('sprite', {
          spr: 'arrow',
          fill: '#ffffff',
          w: W * 0.12,
          h: W * 0.1,
          x: W * 0.5,
          y: H * 0.68,
          shadow: true,
          sc: '#020821',
          sd: 8,
        }),
        mk('sprite', {spr: 'star', fill: '#ffd84a', w: W * 0.08, h: W * 0.08, x: W * 0.05, y: H * 0.74}),
      );
      return p;
    },
  },
  {
    name: 'Cartel de evento',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#2a0b66', c2: '#ff3d6e'});
      p.els.push(
        mk('text', {
          text: 'FESTIVAL',
          font: 'Press Start 2P',
          size: Math.round(W * 0.1),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.92,
          x: W * 0.04,
          y: H * 0.18,
          shadow: true,
          sc: '#020821',
          sd: 10,
        }),
        mk('text', {
          text: 'DE LA LUNA',
          font: 'Bungee',
          size: Math.round(W * 0.09),
          fill: '#ffd84a',
          align: 'center',
          w: W * 0.92,
          x: W * 0.04,
          y: H * 0.3,
        }),
        mk('sprite', {spr: 'moon', fill: '#ffffff', w: W * 0.3, h: W * 0.3, x: W * 0.35, y: H * 0.46}),
        mk('text', {
          text: 'SÁB 12 · 8 PM · ENTRADA LIBRE',
          font: 'Silkscreen',
          size: Math.round(W * 0.032),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.86,
          tbg: true,
          tbc: '#020821',
        }),
      );
      return p;
    },
  },
  {
    name: 'Menú',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'solid', c1: '#050d2b', c2: '#050d2b'});
      p.els.push(
        mk('text', {
          text: 'MENÚ',
          font: 'Press Start 2P',
          size: Math.round(W * 0.08),
          fill: '#3fe0ff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.06,
          shadow: true,
          sc: '#1a5cff',
          sd: 8,
        }),
      );
      [
        ['Pizza pixel', '$9'],
        ['Burger 8-bit', '$8'],
        ['Ensalada verde', '$6'],
        ['Postre bonus', '$5'],
        ['Bebida', '$3'],
      ].forEach(([n, pr], i) => {
        const y = H * (0.24 + i * 0.14);
        p.els.push(
          mk('text', {
            text: n,
            font: 'DotGothic16',
            size: Math.round(W * 0.05),
            fill: '#ffffff',
            w: W * 0.55,
            x: W * 0.1,
            y,
          }),
          mk('text', {
            text: pr,
            font: 'VT323',
            size: Math.round(W * 0.07),
            fill: '#ffd84a',
            align: 'right',
            w: W * 0.25,
            x: W * 0.65,
            y: y - W * 0.01,
          }),
          mk('rect', {fill: '#1a5cff', w: W * 0.8, h: 6, x: W * 0.1, y: y + H * 0.08, px: 3}),
        );
      });
      return p;
    },
  },
  {
    name: 'Certificado',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'solid', c1: '#ffffff', c2: '#ffffff'});
      p.els.push(
        mk('ringrect', {
          fill: '#0b2a8a',
          x: W * 0.03,
          y: H * 0.04,
          w: W * 0.94,
          h: H * 0.92,
          th: Math.round(Math.min(W, H) * 0.016),
          px: 3,
        }),
        mk('ringrect', {
          fill: '#3fe0ff',
          x: W * 0.05,
          y: H * 0.06,
          w: W * 0.9,
          h: H * 0.88,
          th: Math.round(Math.min(W, H) * 0.006),
          px: 3,
        }),
        mk('text', {
          text: 'CERTIFICADO',
          font: 'Press Start 2P',
          size: Math.round(W * 0.055),
          fill: '#0b2a8a',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.17,
        }),
        mk('text', {
          text: 'DE RECONOCIMIENTO',
          font: 'Silkscreen',
          size: Math.round(W * 0.03),
          fill: '#1a5cff',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.3,
        }),
        mk('text', {
          text: 'Se otorga a',
          font: 'VT323',
          size: Math.round(W * 0.05),
          fill: '#050d2b',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.42,
        }),
        mk('text', {
          text: 'TU NOMBRE',
          font: 'Pixelify Sans',
          bold: true,
          size: Math.round(W * 0.08),
          fill: '#0b2a8a',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.5,
        }),
        mk('sprite', {
          spr: 'trophy',
          fill: '#ffd84a',
          w: W * 0.14,
          h: W * 0.14,
          x: W * 0.43,
          y: H * 0.7,
          shadow: true,
          sc: '#050d2b',
          sd: 6,
        }),
      );
      return p;
    },
  },
  {
    name: 'Meme',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'solid', c1: '#000000', c2: '#000000'});
      p.els.push(
        mk('image', {src: null, x: 0, y: H * 0.16, w: W, h: H * 0.68, px: 1}),
        mk('text', {
          text: 'TEXTO ARRIBA',
          font: 'Anton',
          size: Math.round(H * 0.1),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.96,
          x: W * 0.02,
          y: H * 0.03,
          upper: true,
          tsw: Math.round(H * 0.012),
          tsc: '#000000',
          lh: 1.05,
        }),
        mk('text', {
          text: 'TEXTO ABAJO',
          font: 'Anton',
          size: Math.round(H * 0.1),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.96,
          x: W * 0.02,
          y: H * 0.85,
          upper: true,
          tsw: Math.round(H * 0.012),
          tsc: '#000000',
          lh: 1.05,
        }),
      );
      return p;
    },
  },
  {
    name: 'Invitación',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#ff3d6e', c2: '#8a2be2'});
      p.els.push(
        mk('sprite', {
          spr: 'heart',
          fill: '#ffffff',
          w: W * 0.3,
          h: W * 0.26,
          x: W * 0.35,
          y: H * 0.1,
          shadow: true,
          sc: '#020821',
          sd: 10,
        }),
        mk('text', {
          text: 'TE INVITO',
          font: 'Press Start 2P',
          size: Math.round(W * 0.075),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.42,
          shadow: true,
          sc: '#020821',
          sd: 8,
        }),
        mk('text', {
          text: 'a mi fiesta de cumpleaños',
          font: 'DotGothic16',
          size: Math.round(W * 0.05),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.56,
        }),
        mk('text', {
          text: 'VIE 20 · 7 PM · CASA DE LUNA',
          font: 'Silkscreen',
          size: Math.round(W * 0.03),
          fill: '#020821',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.74,
          tbg: true,
          tbc: '#ffd84a',
        }),
      );
      return p;
    },
  },
  {
    name: 'Portada de libro',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#020821', c2: '#1a5cff'});
      p.els.push(
        mk('text', {
          text: 'EL LIBRO\nDE LAS\nSOMBRAS',
          font: 'Playfair Display',
          bold: true,
          size: Math.round(W * 0.11),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.86,
          x: W * 0.07,
          y: H * 0.1,
          lh: 1.1,
          shadow: true,
          sc: '#0b2a8a',
          sd: 8,
        }),
        mk('sprite', {
          spr: 'ghost',
          fill: '#d6f8ff',
          w: W * 0.3,
          h: W * 0.27,
          x: W * 0.35,
          y: H * 0.55,
          ol: 10,
          olc: '#3fe0ff',
        }),
        mk('text', {
          text: 'TU NOMBRE',
          font: 'Silkscreen',
          size: Math.round(W * 0.035),
          fill: '#3fe0ff',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.9,
        }),
      );
      return p;
    },
  },
  {
    name: 'Insignia (PNG)',
    build() {
      const W = S.w,
        H = S.h,
        m = Math.min(W, H),
        p = newPage({pat: 'none', c1: '#ffffff', c2: '#ffffff'});
      p.els.push(
        mk('ellipse', {
          fill: '#3fe0ff',
          x: (W - m * 0.88) / 2,
          y: (H - m * 0.88) / 2,
          w: m * 0.88,
          h: m * 0.88,
          stroke: '#020821',
          sw: Math.round(m * 0.03),
          px: Math.max(2, Math.round(m * 0.012)),
          ol: Math.round(m * 0.03),
          olc: '#ffffff',
        }),
        mk('sprite', {
          spr: 'star',
          fill: '#ffd84a',
          w: m * 0.36,
          h: m * 0.36,
          x: (W - m * 0.36) / 2,
          y: H / 2 - m * 0.3,
          shadow: true,
          sc: '#020821',
          sd: Math.round(m * 0.015),
        }),
        mk('text', {
          text: 'NIVEL 1',
          font: 'Press Start 2P',
          size: Math.round(m * 0.07),
          fill: '#020821',
          align: 'center',
          w: m * 0.7,
          x: (W - m * 0.7) / 2,
          y: H / 2 + m * 0.1,
        }),
      );
      return p;
    },
  },
  {
    name: 'Oferta moderna',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#ff7a18', c2: '#ec008c', smooth: true});
      p.els.push(
        mk('ellipse', {fill: '#ffffff', op: 0.14, px: 1, w: W * 0.8, h: W * 0.8, x: W * 0.55, y: -W * 0.25}),
        mk('ellipse', {fill: '#ffffff', op: 0.1, px: 1, w: W * 0.6, h: W * 0.6, x: -W * 0.2, y: H * 0.68}),
        mk('text', {
          text: 'GRAN VENTA',
          font: 'Montserrat',
          bold: true,
          size: Math.round(W * 0.055),
          ls: 8,
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.14,
        }),
        mk('text', {
          text: '50%',
          font: 'Bebas Neue',
          size: Math.round(W * 0.42),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.2,
          lh: 1,
        }),
        mk('text', {
          text: 'DE DESCUENTO',
          font: 'Poppins',
          bold: true,
          size: Math.round(W * 0.06),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.9,
          x: W * 0.05,
          y: H * 0.6,
        }),
        mk('pill', {fill: '#ffffff', px: 1, w: W * 0.4, h: H * 0.09, x: W * 0.3, y: H * 0.76}),
        mk('text', {
          text: 'COMPRAR AHORA',
          font: 'Montserrat',
          bold: true,
          size: Math.round(W * 0.03),
          fill: '#ec008c',
          align: 'center',
          w: W * 0.4,
          x: W * 0.3,
          y: H * 0.76 + (H * 0.09 - W * 0.03 * 1.3) / 2,
        }),
      );
      return p;
    },
  },
  {
    name: 'Frase inspiradora',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'solid', c1: '#fdf6ec', c2: '#fdf6ec'});
      p.els.push(
        mk('text', {
          text: '“',
          font: 'Playfair Display',
          bold: true,
          size: Math.round(W * 0.34),
          fill: '#f4b183',
          x: W * 0.1,
          y: H * 0.04,
          w: W * 0.3,
          lh: 1,
        }),
        mk('text', {
          text: 'El mejor momento\npara empezar\nes ahora.',
          font: 'Playfair Display',
          italic: true,
          size: Math.round(W * 0.085),
          fill: '#3b2a20',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.3,
          lh: 1.25,
        }),
        mk('rect', {fill: '#f4b183', px: 1, w: W * 0.12, h: 6, x: W * 0.44, y: H * 0.74}),
        mk('text', {
          text: 'TU NOMBRE AQUÍ',
          font: 'Montserrat',
          bold: true,
          size: Math.round(W * 0.026),
          ls: 6,
          fill: '#7a5c48',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.79,
        }),
      );
      return p;
    },
  },
  {
    name: 'Evento minimal',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'solid', c1: '#ffffff', c2: '#ffffff'});
      p.els.push(
        mk('ellipse', {fill: '#fde68a', px: 1, w: W * 0.5, h: W * 0.5, x: W * 0.5, y: H * 0.04}),
        mk('ellipse', {fill: '#a5b4fc', px: 1, w: W * 0.26, h: W * 0.26, x: W * 0.36, y: H * 0.22, op: 0.85}),
        mk('text', {
          text: 'EVENTO',
          font: 'Oswald',
          size: Math.round(W * 0.05),
          ls: 14,
          fill: '#6366f1',
          x: W * 0.08,
          y: H * 0.5,
          w: W * 0.8,
        }),
        mk('text', {
          text: 'Noche de\ndiseño',
          font: 'Montserrat',
          bold: true,
          size: Math.round(W * 0.105),
          fill: '#111827',
          x: W * 0.08,
          y: H * 0.56,
          w: W * 0.84,
          lh: 1.1,
        }),
        mk('pill', {fill: '#111827', px: 1, w: W * 0.42, h: H * 0.075, x: W * 0.08, y: H * 0.87}),
        mk('text', {
          text: 'SÁB 22 · 19:00',
          font: 'Montserrat',
          bold: true,
          size: Math.round(W * 0.03),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.42,
          x: W * 0.08,
          y: H * 0.87 + (H * 0.075 - W * 0.03 * 1.3) / 2,
        }),
      );
      return p;
    },
  },
  {
    name: 'Producto destacado',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#eef2ff', c2: '#c7d2fe', smooth: true});
      p.els.push(
        mk('rrect', {
          fill: '#ffffff',
          px: 1,
          w: W * 0.84,
          h: H * 0.84,
          x: W * 0.08,
          y: H * 0.08,
          shadow: true,
          sc: '#a5b4fc',
          sd: Math.round(W * 0.015),
        }),
        mk('ellipse', {fill: '#6366f1', px: 1, w: W * 0.44, h: W * 0.44, x: W * 0.28, y: H * 0.14}),
        mk('star5', {fill: '#fde68a', px: 1, w: W * 0.22, h: W * 0.22, x: W * 0.39, y: H * 0.25}),
        mk('text', {
          text: 'Nuevo lanzamiento',
          font: 'Poppins',
          bold: true,
          size: Math.round(W * 0.06),
          fill: '#111827',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.64,
        }),
        mk('text', {
          text: 'Descubre lo último en tu tienda favorita.',
          font: 'Nunito',
          size: Math.round(W * 0.034),
          fill: '#4b5563',
          align: 'center',
          w: W * 0.66,
          x: W * 0.17,
          y: H * 0.72,
          lh: 1.4,
        }),
        mk('text', {
          text: '$49',
          font: 'Montserrat',
          bold: true,
          size: Math.round(W * 0.07),
          fill: '#6366f1',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.81,
        }),
      );
      return p;
    },
  },
  {
    name: 'Portada de blog',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#1e1b4b', c2: '#7c3aed', smooth: true});
      p.els.push(
        mk('burst', {fill: '#ffffff', op: 0.08, px: 1, w: W * 0.7, h: W * 0.7, x: W * 0.52, y: -W * 0.12}),
        mk('pill', {fill: '#fbbf24', px: 1, w: W * 0.26, h: H * 0.06, x: W * 0.08, y: H * 0.14}),
        mk('text', {
          text: 'TUTORIAL',
          font: 'Montserrat',
          bold: true,
          size: Math.round(W * 0.024),
          ls: 4,
          fill: '#1e1b4b',
          align: 'center',
          w: W * 0.26,
          x: W * 0.08,
          y: H * 0.14 + (H * 0.06 - W * 0.024 * 1.3) / 2,
        }),
        mk('text', {
          text: 'Cómo diseñar\ntu primer post',
          font: 'Poppins',
          bold: true,
          size: Math.round(W * 0.1),
          fill: '#ffffff',
          x: W * 0.08,
          y: H * 0.28,
          w: W * 0.84,
          lh: 1.15,
        }),
        mk('text', {
          text: 'Guía rápida paso a paso',
          font: 'Nunito',
          size: Math.round(W * 0.04),
          fill: '#ddd6fe',
          x: W * 0.08,
          y: H * 0.66,
          w: W * 0.8,
        }),
        mk('arrowr', {fill: '#fbbf24', px: 1, w: W * 0.2, h: W * 0.1, x: W * 0.08, y: H * 0.78}),
      );
      return p;
    },
  },
  {
    name: 'Invitación elegante',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        m = Math.min(W, H),
        p = newPage({pat: 'solid', c1: '#fffaf0', c2: '#fffaf0'});
      p.els.push(
        mk('ringrect', {
          fill: '#c9a227',
          px: 1,
          w: W * 0.88,
          h: H * 0.88,
          x: W * 0.06,
          y: H * 0.06,
          th: Math.max(3, Math.round(m * 0.006)),
        }),
        mk('text', {
          text: 'Te invitamos a celebrar',
          font: 'Dancing Script',
          bold: true,
          size: Math.round(W * 0.07),
          fill: '#8a6d12',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.2,
        }),
        mk('text', {
          text: 'ANA & LUIS',
          font: 'Playfair Display',
          bold: true,
          size: Math.round(W * 0.1),
          ls: 4,
          fill: '#2d2a26',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.38,
        }),
        mk('rect', {fill: '#c9a227', px: 1, w: W * 0.2, h: 3, x: W * 0.4, y: H * 0.58}),
        mk('text', {
          text: '14 DE JUNIO · 18:00',
          font: 'Montserrat',
          size: Math.round(W * 0.03),
          ls: 5,
          fill: '#2d2a26',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.64,
        }),
        mk('text', {
          text: 'Jardín Las Lomas',
          font: 'Playfair Display',
          italic: true,
          size: Math.round(W * 0.036),
          fill: '#6b5d4a',
          align: 'center',
          w: W * 0.8,
          x: W * 0.1,
          y: H * 0.72,
        }),
      );
      return p;
    },
  },
  {
    name: 'Anuncio de promo',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'gradient', c1: '#10b981', c2: '#06b6d4', smooth: true});
      p.els.push(
        mk('bubble', {
          fill: '#ffffff',
          px: 1,
          w: W * 0.8,
          h: H * 0.46,
          x: W * 0.1,
          y: H * 0.14,
          shadow: true,
          sc: '#0f766e',
          sd: Math.round(W * 0.014),
        }),
        mk('text', {
          text: '2 × 1',
          font: 'Bebas Neue',
          size: Math.round(W * 0.2),
          fill: '#0f766e',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.2,
          lh: 1,
        }),
        mk('text', {
          text: 'En todo el menú, solo hoy',
          font: 'Nunito',
          bold: true,
          size: Math.round(W * 0.042),
          fill: '#134e4a',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.42,
        }),
        mk('text', {
          text: 'Ven con un amigo',
          font: 'Poppins',
          bold: true,
          size: Math.round(W * 0.07),
          fill: '#ffffff',
          align: 'center',
          w: W * 0.84,
          x: W * 0.08,
          y: H * 0.72,
        }),
        mk('text', {
          text: '@tu_negocio',
          font: 'Montserrat',
          size: Math.round(W * 0.034),
          fill: '#ecfeff',
          align: 'center',
          w: W * 0.84,
          x: W * 0.08,
          y: H * 0.83,
        }),
      );
      return p;
    },
  },
  {
    name: 'Cumpleaños moderno',
    style: 'normal',
    build() {
      const W = S.w,
        H = S.h,
        p = newPage({pat: 'solid', c1: '#fff1f2', c2: '#fff1f2'});
      [
        ['#fb7185', 0.08, 0.1, 0.12],
        ['#fbbf24', 0.78, 0.08, 0.1],
        ['#60a5fa', 0.1, 0.8, 0.08],
        ['#34d399', 0.8, 0.78, 0.11],
        ['#a78bfa', 0.46, 0.06, 0.06],
        ['#fb923c', 0.9, 0.42, 0.05],
        ['#f472b6', 0.04, 0.44, 0.06],
      ].forEach(([c, x, y, s]) =>
        p.els.push(mk('ellipse', {fill: c, px: 1, w: W * s, h: W * s, x: W * x, y: H * y})),
      );
      p.els.push(
        mk('text', {
          text: '¡Feliz\ncumple!',
          font: 'Lobster',
          size: Math.round(W * 0.2),
          fill: '#e11d48',
          align: 'center',
          w: W * 0.84,
          x: W * 0.08,
          y: H * 0.26,
          lh: 1.05,
        }),
        mk('text', {
          text: 'Que este año venga lleno de sorpresas',
          font: 'Nunito',
          size: Math.round(W * 0.038),
          fill: '#9f1239',
          align: 'center',
          w: W * 0.7,
          x: W * 0.15,
          y: H * 0.68,
          lh: 1.4,
        }),
      );
      return p;
    },
  },
];
