'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/* ============================================================================
   J'INFO TOURS — Portal B2B · Landing
   Concept: atlas editorial + panou de plecări mecanic (split-flap) ca semnătură.
   Comutator Soare / Lună (Zi / Noapte). Complet responsive.
   ========================================================================== */

interface Circuit {
  id: string;
  name: string;
  continent: string;
  main_image: string;
  nights?: string | null;
  slug?: string;
}

// Set curat, ales manual, salvat local în public/hero/ — sursa principală pentru landing page.
// Numele fișierelor corespund slug-urilor circuitelor din DB.
const CURATED: Circuit[] = [
  { id: 'c1', slug: 'circuit-coastadeazur', name: 'Coasta de Azur', continent: 'Europa', main_image: '/hero/circuit-coastadeazur.webp' },
  { id: 'c2', slug: 'circuit-etiopia', name: 'Etiopia', continent: 'Africa', main_image: '/hero/circuit-etiopia.webp' },
  { id: 'c3', slug: 'circuit-puglia', name: 'Puglia', continent: 'Europa', main_image: '/hero/circuit-puglia.webp' },
  { id: 'c4', slug: 'columbiapanama', name: 'Columbia & Panama', continent: 'America de Sud', main_image: '/hero/columbiapanama.webp' },
  { id: 'c5', slug: 'croaziera-pe-nil', name: 'Croazieră pe Nil', continent: 'Africa', main_image: '/hero/croaziera-pe-nil.webp' },
  { id: 'c6', slug: 'cubamexic', name: 'Cuba & Mexic', continent: 'America de Nord', main_image: '/hero/cubamexic.webp' },
  { id: 'c7', slug: 'incursiuneinparis', name: 'Incursiune în Paris', continent: 'Europa', main_image: '/hero/incursiuneinparis.webp' },
  { id: 'c8', slug: 'lisabonamadeira', name: 'Lisabona & Madeira', continent: 'Europa', main_image: '/hero/lisabonamadeira.webp' },
  { id: 'c9', slug: 'thailandasingaporemalayesia', name: 'Thailanda - Singapore - Malaezia', continent: 'Asia', main_image: '/hero/thailandasingaporemalayesia.webp' },
  { id: 'c10', slug: 'vivaspania', name: 'Viva Spania', continent: 'Europa', main_image: '/hero/vivaspania.webp' },
];

/* ---------- Split-flap ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-&Ă';

function Flap({ target, delay }: { target: string; delay: number }) {
  const [ch, setCh] = useState(' ');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setCh(target); return; }
    let frame = 0;
    const total = 6 + Math.floor(delay / 50);
    let iv: ReturnType<typeof setInterval>;
    const to = setTimeout(() => {
      iv = setInterval(() => {
        frame++;
        if (frame >= total) { setCh(target); setTick((t) => t + 1); clearInterval(iv); }
        else { setCh(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]); setTick((t) => t + 1); }
      }, 46);
    }, delay);
    return () => { clearTimeout(to); clearInterval(iv); };
  }, [target, delay]);
  return <div className="jt-flap"><span key={tick} className="jt-flapc">{ch === ' ' ? '\u00A0' : ch}</span></div>;
}

function SplitFlap({ text, length }: { text: string; length: number }) {
  const padded = (text || '').toUpperCase().slice(0, length).padEnd(length, ' ');
  return (
    <div className="jt-flaps">
      {Array.from({ length }).map((_, i) => <Flap key={i} target={padded[i]} delay={i * 42} />)}
    </div>
  );
}

/* ---------- Icons ---------- */
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </svg>
);
const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);

/* ---------- Pagina ---------- */
export default function LandingPage() {
  const [theme, setTheme] = useState<'night' | 'day'>('night');
  const [pool, setPool] = useState<Circuit[]>(CURATED);
  const [slide, setSlide] = useState(0);
  const [boardRows, setBoardRows] = useState<Circuit[]>(CURATED.slice(0, 6));
  const [destLen, setDestLen] = useState(18);
  const [stats, setStats] = useState({ circuits: 0, continents: 0, departures: 0 });
  const [loaded, setLoaded] = useState(false);
  const [boardIn, setBoardIn] = useState(false);
  const [hovered, setHovered] = useState(0);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const poolRef = useRef<Circuit[]>(CURATED);

  useEffect(() => { try { const s = localStorage.getItem('jt-theme'); if (s === 'day' || s === 'night') setTheme(s); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem('jt-theme', theme); } catch {} }, [theme]);

  // lungime flaps pe mobil
  useEffect(() => {
    const mq = window.matchMedia('(max-width:560px)');
    const apply = () => setDestLen(mq.matches ? 14 : 18);
    apply(); mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Imaginile pentru hero/board/galerie sunt fixe (CURATED, din public/hero/) —
  // alese manual ca să garantăm rezoluție bună. Din DB luăm doar statisticile.
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: all } = await supabase.from('circuits').select('id, continent').eq('is_active', true);
        const { data: deps } = await supabase.from('departures').select('id').eq('status', 'disponibil');
        if (all) setStats({ circuits: all.length, continents: new Set(all.map((c) => c.continent)).size, departures: deps?.length || 0 });
      } catch {}
      setTimeout(() => setLoaded(true), 80);
    })();
  }, []);

  useEffect(() => {
    if (pool.length === 0) return;
    const iv = setInterval(() => setSlide((s) => (s + 1) % Math.min(pool.length, 10)), 6000);
    return () => clearInterval(iv);
  }, [pool]);

  const rotateBoard = useCallback(() => {
    const p = poolRef.current;
    if (p.length <= 6) return;
    setBoardRows((rows) => {
      const next = [...rows];
      const ri = Math.floor(Math.random() * next.length);
      const used = new Set(next.map((r) => r.id));
      const cand = p.filter((c) => !used.has(c.id));
      if (cand.length) next[ri] = cand[Math.floor(Math.random() * cand.length)];
      return next;
    });
  }, []);

  useEffect(() => { if (!boardIn) return; const iv = setInterval(rotateBoard, 3600); return () => clearInterval(iv); }, [boardIn, rotateBoard]);

  useEffect(() => {
    const el = boardRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setBoardIn(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const heroImages = pool.slice(0, Math.min(pool.length, 10));
  const current = heroImages[slide];
  const gallery = pool.slice(0, 6);
  const benefits = [
    { n: 'I', t: 'Comision pe agenția ta', d: 'Procentul tău se aplică automat la fiecare circuit și se actualizează în timp real. Fără negocieri repetate, fără calcule manuale.' },
    { n: 'II', t: 'Acces la tot portofoliul', d: `100+ de circuite pe ${stats.continents || 5} continente, vizibile exclusiv agențiilor partenere autentificate.` },
    { n: 'III', t: 'Validare în 24 de ore', d: 'Fiecare pre-rezervare e verificată de un om din echipa J\u2019Info Tours — niciun răspuns automat, nicio așteptare nesfârșită.' },
    { n: 'IV', t: 'O singură evidență', d: 'Rezervări, plăți și documente, toate într-un cont, accesibile oricând din dashboard-ul agenției.' },
  ];

  return (
    <div className={`jt-site theme-${theme}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;0,6..96,900;1,6..96,400;1,6..96,500&family=Hanken+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

        .jt-site{--board-frame:#0b0b0e;--board-char:#f3efe6;min-height:100vh;font-family:'Hanken Grotesk',system-ui,sans-serif;background:var(--bg);color:var(--ink);transition:background .6s ease,color .6s ease;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        .jt-site.theme-night{--bg:#0A0E16;--bg2:#10151f;--bg3:#0d121b;--ink:#F3ECDD;--ink-soft:rgba(243,236,221,.76);--ink-faint:rgba(243,236,221,.5);--line:rgba(243,236,221,.16);--line-strong:rgba(243,236,221,.26);--accent:#F2741F;--accent-2:#F8B06A;--teal:#5BB3AC;--gold:#D6B36A;--eyebrow:#F8B06A;color-scheme:dark;}
        .jt-site.theme-day{--bg:#EEE6D4;--bg2:#F6F0E2;--bg3:#E6DCC6;--ink:#211B11;--ink-soft:rgba(33,27,17,.74);--ink-faint:rgba(33,27,17,.52);--line:rgba(33,27,17,.18);--line-strong:rgba(33,27,17,.3);--accent:#C84E14;--accent-2:#9E3D0B;--teal:#2C6662;--gold:#8C6E26;--eyebrow:#C84E14;color-scheme:light;}

        .jt-serif{font-family:'Bodoni Moda',Georgia,serif;}
        .jt-mono{font-family:'Space Mono',ui-monospace,monospace;}
        .jt-wrap{max-width:1200px;margin:0 auto;padding:0 28px;}
        @media(max-width:640px){.jt-wrap{padding:0 18px;}}
        .jt-site a{text-decoration:none;color:inherit;}
        .jt-site button:focus-visible,.jt-site a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px;}

        .jt-eyebrow{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--eyebrow);text-shadow:0 1px 16px color-mix(in srgb,var(--bg) 70%,transparent);}
        @media(max-width:560px){.jt-eyebrow{font-size:10px;letter-spacing:.2em;}}
        .jt-rule{display:inline-block;width:42px;height:1px;background:var(--accent);vertical-align:middle;}

        /* logo */
        .jt-logo{position:relative;display:block;width:150px;height:38px;}
        @media(max-width:560px){.jt-logo{width:122px;height:32px;}}
        .jt-logo-chip{position:relative;display:inline-flex;align-items:center;border-radius:10px;padding:6px 10px;background:rgba(255,255,255,.92);box-shadow:0 6px 18px -8px rgba(0,0,0,.35);}
        .theme-day .jt-logo-chip{background:transparent;box-shadow:none;padding:0;}

        /* TOGGLE sun/moon */
        .jt-toggle{display:inline-flex;gap:2px;border:1px solid var(--line-strong);border-radius:40px;padding:3px;background:color-mix(in srgb,var(--bg2) 72%,transparent);backdrop-filter:blur(10px);}
        .jt-toggle button{width:36px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:30px;background:transparent;color:var(--ink-faint);cursor:pointer;transition:.25s;}
        .jt-toggle button.on{background:var(--accent);color:#fff;}

        /* buttons */
        .jt-btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;border-radius:46px;transition:.25s;cursor:pointer;}
        .jt-btn-primary{background:var(--accent);color:#fff;padding:12px 20px;font-size:14px;box-shadow:0 14px 32px -12px color-mix(in srgb,var(--accent) 75%,transparent);}
        .jt-btn-primary:hover{transform:translateY(-1px);filter:brightness(1.05);}
        .jt-btn-big{padding:16px 26px;font-size:16px;}
        .jt-ghost{font-weight:700;font-size:16px;color:var(--ink);display:inline-flex;align-items:center;gap:8px;padding:16px 6px;border-bottom:1px solid transparent;transition:.25s;}
        .jt-ghost:hover{border-color:var(--accent);}
        .jt-link{font-size:14px;font-weight:600;color:var(--ink-soft);padding:10px 12px;transition:.25s;}
        .jt-link:hover{color:var(--ink);}
        @media(max-width:560px){.jt-login-link{display:none;}}

        /* HERO */
        .jt-hero{position:relative;min-height:100svh;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}
        .jt-hero-bg{position:absolute;inset:0;z-index:0;}
        .jt-hero-bg .img{position:absolute;inset:0;transition:opacity 1.6s ease,transform 7s ease;}
        .jt-hero-bg .img.on{opacity:1;transform:scale(1.06);}
        .jt-hero-bg .img.off{opacity:0;transform:scale(1);}
        .jt-vig1{position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 60%,transparent) 0%,color-mix(in srgb,var(--bg) 18%,transparent) 38%,var(--bg) 100%);}
        .jt-vig2{position:absolute;inset:0;background:radial-gradient(130% 80% at 50% 26%,transparent 30%,var(--bg) 100%);opacity:.92;}

        .jt-nav{position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:24px 0;}
        .jt-nav-cta{display:flex;align-items:center;gap:8px;}
        .jt-hero-body{position:relative;z-index:5;flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;}
        .jt-hero-eye{display:flex;align-items:center;gap:14px;margin-bottom:24px;}
        .jt-hero-h1{font-family:'Bodoni Moda',serif;font-weight:500;line-height:.95;letter-spacing:-.02em;color:var(--ink);font-size:clamp(42px,8.5vw,112px);max-width:14ch;text-shadow:0 2px 40px color-mix(in srgb,var(--bg) 55%,transparent);}
        .jt-hero-h1 .it{font-style:italic;color:var(--accent);}
        .jt-hero-sub{font-size:clamp(16px,2vw,20px);color:var(--ink-soft);max-width:36ch;margin-top:26px;line-height:1.55;text-shadow:0 1px 20px color-mix(in srgb,var(--bg) 60%,transparent);}
        .jt-hero-actions{display:flex;flex-wrap:wrap;gap:12px 16px;margin-top:36px;align-items:center;}
        .jt-hero-foot{position:relative;z-index:5;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:16px;padding-bottom:28px;}
        .jt-caption .c{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;}
        .jt-caption .n{font-family:'Bodoni Moda',serif;font-style:italic;font-size:clamp(17px,2.4vw,25px);color:var(--ink);text-shadow:0 1px 20px color-mix(in srgb,var(--bg) 60%,transparent);}
        .jt-dots{display:flex;gap:7px;align-items:center;}
        .jt-dots button{height:3px;border-radius:3px;border:0;padding:0;cursor:pointer;background:var(--line-strong);transition:.3s;}
        .jt-dots button.on{background:var(--accent);}

        /* COORDS */
        .jt-coords{border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
        .jt-coords-grid{display:grid;grid-template-columns:repeat(2,1fr);}
        @media(min-width:820px){.jt-coords-grid{grid-template-columns:repeat(4,1fr);}}
        .jt-coord{padding:24px 18px;border-top:1px solid var(--line);border-left:1px solid var(--line);}
        .jt-coord:nth-child(1),.jt-coord:nth-child(2){border-top:0;}
        .jt-coord:nth-child(odd){border-left:0;}
        @media(min-width:820px){.jt-coord{padding:30px 26px;border-top:0;}.jt-coord:nth-child(odd){border-left:1px solid var(--line);}.jt-coord:first-child{border-left:0;padding-left:0;}}
        .jt-coord .l{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
        .jt-coord .v{font-family:'Bodoni Moda',serif;font-weight:500;font-size:clamp(30px,4vw,46px);line-height:1;color:var(--ink);}

        /* SECTION */
        .jt-section{position:relative;padding:clamp(70px,11vw,140px) 0;}
        .jt-sec-eye{margin-bottom:16px;}
        .jt-sec-title{font-family:'Bodoni Moda',serif;font-weight:500;line-height:1;letter-spacing:-.01em;color:var(--ink);font-size:clamp(34px,6.5vw,74px);}
        .jt-sec-title .it{font-style:italic;color:var(--accent);}

        /* BOARD */
        .jt-board-top{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:18px;margin-bottom:32px;}
        .jt-board-note{max-width:300px;color:var(--ink-soft);font-size:15px;line-height:1.6;}
        @media(max-width:760px){.jt-board-note{display:none;}}
        .jt-board{background:var(--board-frame);border-radius:16px;padding:20px 16px 14px;position:relative;overflow:hidden;box-shadow:0 50px 90px -42px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.05);}
        .jt-board::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(transparent 0 2px,rgba(0,0,0,.2) 2px 3px);mix-blend-mode:overlay;opacity:.45;pointer-events:none;}
        .jt-board-hd{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#b6afa1;font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;padding:0 4px 13px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:11px;}
        .jt-board-hd .live{display:flex;align-items:center;gap:8px;white-space:nowrap;}
        .jt-board-hd .live .d{width:7px;height:7px;border-radius:50%;background:#5BB3AC;box-shadow:0 0 10px #5BB3AC;animation:jt-pulse 1.6s infinite;}
        @keyframes jt-pulse{0%,100%{opacity:1}50%{opacity:.4}}

        .jt-row{display:grid;align-items:center;gap:9px 14px;padding:11px 5px;grid-template-columns:1fr auto;grid-template-areas:"code status" "dest dest";}
        .jt-row + .jt-row{border-top:1px solid rgba(255,255,255,.05);}
        .jt-row .code{grid-area:code;font-family:'Space Mono',monospace;font-size:12px;color:#8b8678;letter-spacing:.06em;}
        .jt-row .dest{grid-area:dest;}
        .jt-row .cont{grid-area:cont;display:none;}
        .jt-row .jt-status{grid-area:status;justify-self:end;}
        @media(min-width:870px){
          .jt-row{grid-template-columns:58px 1fr 150px 132px;grid-template-areas:"code dest cont status";gap:16px;}
          .jt-row .cont{display:block;}
        }

        .jt-flaps{display:flex;gap:2px;flex-wrap:wrap;}
        .jt-flap{position:relative;width:14px;height:22px;border-radius:3px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(#27272c 0 49%,#09090b 49% 51%,#161619 51%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.03);}
        .jt-flapc{font-family:'Space Mono',monospace;font-weight:700;font-size:12px;line-height:1;color:var(--board-char);display:block;animation:jt-flip .12s ease;}
        @media(min-width:870px){.jt-flap{width:17px;height:25px;}.jt-flapc{font-size:14px;}}
        .jt-row .cont .jt-flap{width:12px;height:20px;}.jt-row .cont .jt-flapc{font-size:10.5px;}
        @keyframes jt-flip{0%{transform:translateY(-42%) scaleY(.55);opacity:.25}100%{transform:translateY(0) scaleY(1);opacity:1}}

        .jt-status{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;padding:6px 10px;border-radius:5px;white-space:nowrap;}
        @media(min-width:870px){.jt-status{font-size:10px;}}
        .jt-st-ok{color:#8fd9d0;background:rgba(91,179,172,.15);border:1px solid rgba(91,179,172,.32);}
        .jt-st-go{color:#f8b06a;background:rgba(242,116,31,.14);border:1px solid rgba(242,116,31,.34);}

        /* TOPO */
        .jt-topo{position:absolute;inset:0;pointer-events:none;color:var(--line);opacity:.8;}

        /* BENEFITS */
        .jt-benefits{display:grid;grid-template-columns:1fr;gap:40px 60px;position:relative;}
        @media(min-width:760px){.jt-benefits{grid-template-columns:1fr 1fr;}}
        .jt-benefit{position:relative;padding-left:60px;}
        .jt-benefit .num{position:absolute;left:0;top:-4px;font-family:'Bodoni Moda',serif;font-style:italic;font-weight:500;font-size:36px;color:var(--gold);line-height:1;}
        .jt-benefit h3{font-family:'Bodoni Moda',serif;font-weight:500;font-size:23px;color:var(--ink);margin-bottom:10px;}
        .jt-benefit p{color:var(--ink-soft);line-height:1.6;font-size:15.5px;}

        /* EXPAND GALLERY (desktop) */
        .jt-expand{display:none;gap:10px;height:60vh;min-height:430px;}
        @media(min-width:880px){.jt-expand{display:flex;}}
        .jt-exp{position:relative;flex:1;min-width:0;border-radius:14px;overflow:hidden;cursor:pointer;filter:grayscale(.9) brightness(.6);transition:flex .8s cubic-bezier(.25,1,.5,1),filter .8s ease;}
        .jt-exp.active{flex:4.4;filter:grayscale(0) brightness(1);}
        .jt-exp .grad{position:absolute;inset:0;background:linear-gradient(180deg,transparent 38%,rgba(0,0,0,.85));opacity:.65;transition:opacity .6s;}
        .jt-exp.active .grad{opacity:1;}
        .jt-exp .idx{position:absolute;top:18px;left:50%;transform:translateX(-50%);font-family:'Space Mono',monospace;font-size:17px;color:rgba(255,255,255,.55);transition:opacity .4s;}
        .jt-exp.active .idx{opacity:0;}
        .jt-exp .meta{position:absolute;left:26px;right:26px;bottom:26px;opacity:0;transform:translateY(14px);transition:opacity .5s ease .15s,transform .5s ease .15s;}
        .jt-exp.active .meta{opacity:1;transform:none;}
        .jt-exp .meta .c{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-2);margin-bottom:8px;white-space:nowrap;}
        .jt-exp .meta .n{font-family:'Bodoni Moda',serif;font-size:30px;color:#fff;line-height:1.05;white-space:nowrap;}
        .jt-exp .meta .go{margin-top:14px;font-weight:700;font-size:14px;color:#fff;display:inline-flex;gap:8px;}

        /* STACK GALLERY (mobile) */
        .jt-stack{display:grid;grid-template-columns:1fr;gap:14px;}
        @media(min-width:880px){.jt-stack{display:none;}}
        .jt-card{position:relative;height:300px;border-radius:14px;overflow:hidden;background:var(--bg3);}
        .jt-card .grad{position:absolute;inset:0;background:linear-gradient(180deg,transparent 34%,rgba(0,0,0,.82));}
        .jt-card .meta{position:absolute;left:20px;right:20px;bottom:20px;color:#fff;}
        .jt-card .meta .c{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-2);margin-bottom:6px;}
        .jt-card .meta .n{font-family:'Bodoni Moda',serif;font-size:23px;}
        .jt-card .idx{position:absolute;top:14px;left:16px;font-family:'Space Mono',monospace;font-size:11px;color:rgba(255,255,255,.6);}

        /* CTA */
        .jt-cta{border-radius:20px;overflow:hidden;background:var(--bg2);border:1px solid var(--line);display:grid;grid-template-columns:1fr;}
        @media(min-width:820px){.jt-cta{grid-template-columns:1.5fr 1fr;}}
        .jt-cta-main{padding:clamp(32px,5vw,62px);}
        .jt-cta-main h2{font-family:'Bodoni Moda',serif;font-weight:500;line-height:1;color:var(--ink);font-size:clamp(32px,5vw,58px);margin-bottom:18px;}
        .jt-cta-main h2 .it{font-style:italic;color:var(--accent);}
        .jt-cta-main p{color:var(--ink-soft);font-size:16px;line-height:1.6;max-width:44ch;margin-bottom:30px;}
        .jt-cta-stub{position:relative;padding:clamp(32px,5vw,62px);display:flex;flex-direction:column;justify-content:center;gap:16px;background:var(--bg3);}
        .jt-cta-stub::before{content:'';position:absolute;left:0;right:0;top:-1px;height:2px;background-image:repeating-linear-gradient(to right,var(--line-strong) 0 6px,transparent 6px 13px);}
        @media(min-width:820px){.jt-cta-stub::before{left:-1px;right:auto;top:0;bottom:0;width:2px;height:auto;background-image:repeating-linear-gradient(to bottom,var(--line-strong) 0 6px,transparent 6px 13px);}}
        .jt-stub-row .k{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:2px;}
        .jt-stub-row .v{font-family:'Bodoni Moda',serif;font-size:20px;color:var(--ink);}
        .jt-stamp{align-self:flex-start;transform:rotate(-7deg);display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:92px;height:92px;border-radius:50%;border:2px solid color-mix(in srgb,var(--accent) 72%,transparent);color:var(--accent);text-align:center;margin-top:8px;font-family:'Space Mono',monospace;}
        .jt-stamp .a{font-size:7.5px;letter-spacing:.16em;}
        .jt-stamp .b{font-family:'Bodoni Moda',serif;font-size:15px;font-weight:700;margin:3px 0;}

        /* FOOTER */
        .jt-footer{border-top:1px solid var(--line);padding:52px 0 38px;}
        .jt-foot-grid{display:grid;grid-template-columns:1fr;gap:32px;margin-bottom:38px;}
        @media(min-width:680px){.jt-foot-grid{grid-template-columns:2fr 1fr 1fr;}}
        .jt-foot-grid h4{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:16px;}
        .jt-foot-grid a,.jt-foot-grid li,.jt-foot-grid span.fl{color:var(--ink-soft);font-size:14px;line-height:2;display:block;}
        .jt-foot-grid a:hover{color:var(--accent);}
        .jt-foot-bottom{border-top:1px solid var(--line);padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:11.5px;color:var(--ink-faint);font-family:'Space Mono',monospace;letter-spacing:.05em;}

        @media (prefers-reduced-motion: reduce){
          .jt-hero-bg .img.on{transform:none;}
          .jt-flapc,.jt-dot,.jt-board-hd .live .d{animation:none;}
        }
      `}</style>

      {/* HERO */}
      <section className="jt-hero">
        <div className="jt-hero-bg">
          {heroImages.map((img, i) => (
            <div key={img.id} className={`img ${i === slide ? 'on' : 'off'}`}>
              <Image src={img.main_image} alt={img.name} fill priority={i === 0} className="object-cover" sizes="100vw" />
            </div>
          ))}
          <div className="jt-vig1" />
          <div className="jt-vig2" />
        </div>

        <div className="jt-wrap" style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
          <nav className="jt-nav">
            <Link href="/circuits" className="jt-logo-chip" aria-label="J'Info Tours">
              <span className="jt-logo">
                <Image src="/logo-jinfotours.svg" alt="J'Info Tours" fill className="object-contain" priority />
              </span>
            </Link>
            <div className="jt-nav-cta">
              <div className="jt-toggle" role="group" aria-label="Comutator temă">
                <button className={theme === 'night' ? 'on' : ''} onClick={() => setTheme('night')} aria-pressed={theme === 'night'} aria-label="Mod noapte"><MoonIcon /></button>
                <button className={theme === 'day' ? 'on' : ''} onClick={() => setTheme('day')} aria-pressed={theme === 'day'} aria-label="Mod zi"><SunIcon /></button>
              </div>
              <Link href="/auth/login" className="jt-link jt-login-link">Login</Link>
              <Link href="/auth/register" className="jt-btn jt-btn-primary">Solicită acces →</Link>
            </div>
          </nav>

          <div className="jt-hero-body" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(34px)', transition: 'opacity 1s ease, transform 1s cubic-bezier(.16,1,.3,1)' }}>
            <div className="jt-hero-eye">
              <span className="jt-rule" />
              <span className="jt-eyebrow">Portal B2B · exclusiv pentru agenții de turism</span>
            </div>
            <h1 className="jt-hero-h1">Circuitele noastre,<br /><span className="it">comisionul tău.</span></h1>
            <p className="jt-hero-sub">Portalul prin care agențiile partenere accesează tot portofoliul J'Info Tours — cu comision pe agenție și pre-rezervări validate în 24 de ore.</p>
            <div className="jt-hero-actions">
              <Link href="/auth/register" className="jt-btn jt-btn-primary jt-btn-big">Deschide cont de agenție →</Link>
              <Link href="/auth/login" className="jt-ghost">Am deja cont ↗</Link>
            </div>
          </div>

          <div className="jt-hero-foot">
            <div className="jt-caption">
              {current && (<><div className="c">Destinație în focus</div><div className="n">{current.name}</div></>)}
            </div>
            <div className="jt-dots">
              {heroImages.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Imagine ${i + 1}`} className={i === slide ? 'on' : ''} style={{ width: i === slide ? 30 : 8 }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COORDS */}
      <section className="jt-coords">
        <div className="jt-wrap">
          <div className="jt-coords-grid">
            {[
              { l: 'Circuite în portofoliu', v: '100+' },
              { l: 'Continente acoperite', v: stats.continents || '—' },
              { l: 'Plecări disponibile', v: '380+' },
              { l: 'Validare pre-rezervări', v: '24H' },
            ].map((c, i) => (
              <div className="jt-coord" key={i}><div className="l">{c.l}</div><div className="v jt-serif">{c.v}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* BOARD */}
      <section className="jt-section" ref={boardRef}>
        <div className="jt-wrap">
          <div className="jt-board-top">
            <div>
              <div className="jt-sec-eye jt-eyebrow">Panou de plecări · actualizat live</div>
              <h2 className="jt-sec-title">Următoarele <span className="it">plecări.</span></h2>
            </div>
            <p className="jt-board-note">Un eșantion din rutele active. Agențiile partenere văd întreg orarul după autentificare.</p>
          </div>
          <div className="jt-board">
            <div className="jt-board-hd">
              <span>J'INFO TOURS · ORAR B2B</span>
              <span className="live"><span className="d" /> LIVE · {boardRows.length} RUTE</span>
            </div>
            {boardIn && boardRows.map((c, i) => (
              <div className="jt-row" key={`${c.id}-${i}`}>
                <span className="code">JT·{String(i + 1).padStart(2, '0')}</span>
                <div className="dest"><SplitFlap text={c.name} length={destLen} /></div>
                <div className="cont"><SplitFlap text={c.continent} length={11} /></div>
                <span className={`jt-status ${i % 3 === 0 ? 'jt-st-go' : 'jt-st-ok'}`}>{i % 3 === 0 ? 'ultimele locuri' : 'disponibil'}</span>
              </div>
            ))}
            {!boardIn && <div style={{ height: 6 * 56 }} />}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="jt-section" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <svg className="jt-topo" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} fill="none" stroke="currentColor" strokeWidth="1" d={`M -50 ${120 + i * 62} C 250 ${60 + i * 62}, 450 ${200 + i * 62}, 700 ${130 + i * 62} S 1100 ${40 + i * 62}, 1260 ${150 + i * 62}`} />
          ))}
        </svg>
        <div className="jt-wrap" style={{ position: 'relative' }}>
          <div style={{ marginBottom: 50 }}>
            <div className="jt-sec-eye jt-eyebrow">Condiții de parteneriat</div>
            <h2 className="jt-sec-title">Ce primește <span className="it">agenția ta</span></h2>
          </div>
          <div className="jt-benefits">
            {benefits.map((b) => (
              <div className="jt-benefit" key={b.n}><span className="num">{b.n}</span><h3>{b.t}</h3><p>{b.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* ATLAS — expand gallery */}
      <section className="jt-section">
        <div className="jt-wrap" style={{ marginBottom: 34 }}>
          <div className="jt-sec-eye jt-eyebrow">Atlas · eșantion din portofoliu</div>
          <h2 className="jt-sec-title">Lumea, <span className="it">filă cu filă.</span></h2>
        </div>
        <div className="jt-wrap">
          <div className="jt-expand">
            {gallery.map((c, i) => (
              <div key={c.id} className={`jt-exp ${hovered === i ? 'active' : ''}`} onMouseEnter={() => setHovered(i)}>
                <Image src={c.main_image} alt={c.name} fill className="object-cover" sizes="(max-width:880px) 0px, 60vw" />
                <div className="grad" />
                <span className="idx jt-mono">{String(i + 1).padStart(2, '0')}</span>
                <div className="meta">
                  <div className="c">{c.continent}{c.nights ? ` · ${c.nights}` : ''}</div>
                  <div className="n">{c.name}</div>
                  <span className="go">Disponibil pentru parteneri →</span>
                </div>
              </div>
            ))}
          </div>

          <div className="jt-stack">
            {gallery.slice(0, 4).map((c, i) => (
              <article className="jt-card" key={c.id}>
                <Image src={c.main_image} alt={c.name} fill className="object-cover" sizes="100vw" />
                <div className="grad" />
                <span className="idx jt-mono">{String(i + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span>
                <div className="meta"><div className="c">{c.continent}{c.nights ? ` · ${c.nights}` : ''}</div><div className="n">{c.name}</div></div>
              </article>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <span className="jt-mono" style={{ fontSize: 13, color: 'var(--ink-faint)', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span className="jt-rule" style={{ background: 'var(--gold)' }} />
              + {Math.max(stats.circuits - gallery.length, 0)} alte rute disponibile după autentificare
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="jt-section" style={{ paddingTop: 0 }}>
        <div className="jt-wrap">
          <div className="jt-cta">
            <div className="jt-cta-main">
              <h2>Următoarea destinație<br /><span className="it">e a clientului tău.</span></h2>
              <p>Deschide un cont de agenție și primești acces la portofoliul complet J'Info Tours, cu comision personalizat și suport direct din partea echipei.</p>
              <div className="jt-hero-actions" style={{ marginTop: 0 }}>
                <Link href="/auth/register" className="jt-btn jt-btn-primary jt-btn-big">Înregistrează agenția →</Link>
                <Link href="/auth/login" className="jt-ghost">Intră în cont ↗</Link>
              </div>
            </div>
            <div className="jt-cta-stub">
              <div className="jt-stub-row"><div className="k">Acces</div><div className="v jt-serif">Exclusiv B2B</div></div>
              <div className="jt-stub-row"><div className="k">Validare</div><div className="v jt-serif">24 ore</div></div>
              <div className="jt-stub-row"><div className="k">Comision</div><div className="v jt-serif">Pe agenție</div></div>
              <div className="jt-stamp"><span className="a">PORTAL B2B</span><span className="b">J'INFO</span><span className="a">ACCES VALIDAT</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="jt-footer">
        <div className="jt-wrap">
          <div className="jt-foot-grid">
            <div>
              <div className="jt-logo" style={{ marginBottom: 16 }}>
                <Image src="/logo-jinfotours.svg" alt="J'Info Tours" fill className="object-contain" />
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, maxWidth: '34ch' }}>
                Platforma B2B exclusivă pentru profesioniștii din turism. Operăm circuite de grup pe cinci continente.
              </p>
            </div>
            <div>
              <h4>Platformă</h4>
              <Link href="/auth/login">Autentificare</Link>
              <Link href="/auth/register">Creare cont nou</Link>
              <a href="mailto:office@jinfotours.ro">Suport B2B</a>
            </div>
            <div>
              <h4>Contact</h4>
              <a href="mailto:office@jinfotours.ro">office@jinfotours.ro</a>
              <span className="fl">Str. Jules Michelet, nr. 1, sector 1, București</span>
              <a href="tel:0742220643">0742 220 643</a>
            </div>
          </div>
          <div className="jt-foot-bottom">
            <span>© {new Date().getFullYear()} J'INFO TOURS · TOATE DREPTURILE REZERVATE</span>
            <span>PORTAL B2B</span>
          </div>
        </div>
      </footer>
    </div>
  );
}