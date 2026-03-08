import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight } from 'lucide-react';

// ── True/False cards ──────────────────────────────────────────────────────────
const TF_CARDS = [
  { q: 'Helm safety wajib digunakan di seluruh area konstruksi tanpa terkecuali.', a: true },
  { q: 'APD adalah lapisan perlindungan PERTAMA dalam hierarki pengendalian.', a: false, hint: 'APD adalah TERAKHIR — setelah Eliminasi, Substitusi, Rekayasa, dan Admin.' },
  { q: 'H₂S dapat tercium baunya bahkan pada konsentrasi fatal.', a: false, hint: 'H₂S melumpuhkan indera penciuman pada konsentrasi tinggi.' },
  { q: 'Confined space boleh dimasuki langsung jika ruangan cukup terang.', a: false, hint: 'Gas testing dan izin masuk wajib dilakukan terlebih dahulu.' },
  { q: 'Risk Score dihitung dari Likelihood × Severity.', a: true },
  { q: 'Backup alarm alat berat wajib berbunyi saat mundur.', a: true },
  { q: 'Near miss tidak perlu dilaporkan karena tidak ada korban.', a: false, hint: 'Near miss harus dilaporkan sebagai peringatan dini bahaya.' },
  { q: 'PPE (APD) bisa digunakan bersama oleh beberapa pekerja secara bergantian.', a: false, hint: 'APD bersifat personal — tidak boleh dipinjam/bergantian.' },
  { q: 'Excavator memiliki blind spot yang besar di bagian belakang.', a: true },
  { q: 'Kalibrasi gas detector cukup dilakukan 1 kali saat beli saja.', a: false, hint: 'Gas detector harus dikalibrasi secara berkala (span gas).' },
  { q: 'Pekerja berhak menolak pekerjaan yang membahayakan jiwa (Stop Work Authority).', a: true },
  { q: 'Perancah dengan tag MERAH boleh digunakan jika terpaksa.', a: false, hint: 'Tag MERAH berarti JANGAN DIGUNAKAN — tidak ada pengecualian.' },
  { q: 'LOTO wajib dilakukan sebelum servis/perbaikan alat berat atau mesin.', a: true },
  { q: 'Ledakan pada Vapor Cloud bisa terjadi tanpa adanya percikan api.', a: false, hint: 'VCE memerlukan ignition source (percikan atau panas).' },
  { q: 'Silikosis adalah penyakit paru yang disebabkan debu silika bebas.', a: true },
];

// ── Hazard matching ───────────────────────────────────────────────────────────
const MATCH_ROUNDS = [
  {
    hazards: [
      { id: 'A', label: 'Jatuh dari scaffolding' },
      { id: 'B', label: 'Debu silika dari pemotongan beton' },
      { id: 'C', label: 'Gas H₂S bocor dari sumur' },
      { id: 'D', label: 'Dump truck mundur tanpa banksman' },
    ],
    controls: [
      { id: 'D', label: 'Wajibkan banksman saat mundur' },
      { id: 'A', label: 'Pasang guardrail + body harness' },
      { id: 'C', label: 'Gas detector personal + SCBA' },
      { id: 'B', label: 'Wet cutting + respirator P100' },
    ],
  },
  {
    hazards: [
      { id: 'A', label: 'Kebakaran dari hot work di migas' },
      { id: 'B', label: 'Banjir di tambang bawah tanah' },
      { id: 'C', label: 'Sengatan listrik dari kabel terbuka' },
      { id: 'D', label: 'Kelelahan operator alat berat' },
    ],
    controls: [
      { id: 'C', label: 'RCCB + LOTO + grounding' },
      { id: 'A', label: 'Hot Work Permit + Fire Watch' },
      { id: 'D', label: 'Rotasi shift + fatigue monitoring' },
      { id: 'B', label: 'Pompa dewatering + prosedur evakuasi' },
    ],
  },
];

// ── Quick Quiz ────────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: 'Berapakah NAB kebisingan maksimum untuk paparan 8 jam kerja?', options: ['75 dB(A)', '85 dB(A)', '95 dB(A)', '105 dB(A)'], a: 1 },
  { q: 'Apa kepanjangan dari LOTO dalam K3?', options: ['Lock Out Tag Out', 'Lift Off Tag Off', 'Lock On Turn Off', 'Load Out Tag Out'], a: 0 },
  { q: 'Manakah urutan hierarki pengendalian yang BENAR dari yang paling efektif?', options: ['APD → Admin → Rekayasa → Substitusi → Eliminasi', 'Eliminasi → Substitusi → Rekayasa → Admin → APD', 'Rekayasa → APD → Admin → Eliminasi → Substitusi', 'Admin → APD → Rekayasa → Eliminasi → Substitusi'], a: 1 },
  { q: 'Gas apa yang menjadi penyebab utama kematian di confined space migas?', options: ['CO₂', 'CH₄', 'H₂S', 'N₂'], a: 2 },
  { q: 'Berapakah kadar O₂ minimum yang aman untuk masuk ruang terbatas?', options: ['15%', '17.5%', '19.5%', '21%'], a: 2 },
  { q: 'Metode HAZOP digunakan untuk...', options: ['Mengidentifikasi penyimpangan proses yang berbahaya', 'Menghitung biaya K3', 'Mendesain APD baru', 'Mengukur kebisingan di lapangan'], a: 0 },
  { q: 'Apa yang dimaksud dengan Near Miss?', options: ['Kecelakaan ringan dengan luka kecil', 'Kejadian hampir celaka tanpa korban', 'Kebakaran kecil yang berhasil dipadamkan', 'Kecelakaan fatal'], a: 1 },
  { q: 'FR Clothing digunakan untuk melindungi dari bahaya...', options: ['Hujan deras', 'Flash fire dan arc flash', 'Bahan kimia korosif', 'Radiasi UV'], a: 1 },
];

// ── Crossword / Word Search ───────────────────────────────────────────────────
const CW_WORDS = [
  { word: 'HAZOP', clue: 'Analisis penyimpangan proses' },
  { word: 'LOTO', clue: 'Lock Out Tag Out' },
  { word: 'HIRA', clue: 'Hazard & Risk Assessment' },
  { word: 'APD', clue: 'Alat Pelindung Diri' },
  { word: 'SCBA', clue: 'Alat bantu pernafasan mandiri' },
  { word: 'JSA', clue: 'Job Safety Analysis' },
  { word: 'PTW', clue: 'Permit To Work' },
  { word: 'HSE', clue: 'Health Safety Environment' },
  { word: 'SOP', clue: 'Prosedur operasi standar' },
  { word: 'NAB', clue: 'Nilai Ambang Batas' },
  { word: 'BBS', clue: 'Behavior Based Safety' },
  { word: 'ERP', clue: 'Emergency Response Plan' },
  { word: 'PPE', clue: 'Personal Protective Equipment' },
  { word: 'ALARP', clue: 'As Low As Reasonably Practicable' },
  { word: 'HIRAC', clue: 'Hazard ID Risk Assessment Control' },
];

const CW_COLS = 10, CW_ROWS = 10;

class SeededRNG {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next() { this.s = (Math.imul(1664525, this.s) + 1013904223) >>> 0; return this.s / 0x100000000; }
  int(min: number, max: number) { return Math.floor(this.next() * (max - min)) + min; }
  shuffle<T>(a: T[]): T[] {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) { const j = this.int(0, i + 1); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }
}

interface PlacedWord { word: string; clue: string; }

function generatePuzzle(seed: number) {
  const rng = new SeededRNG(seed);
  const grid: string[][] = Array.from({ length: CW_ROWS }, () => Array(CW_COLS).fill(''));
  const pool = rng.shuffle([...CW_WORDS]);
  const placed: PlacedWord[] = [];

  for (const item of pool) {
    if (placed.length >= 6) break;
    const { word } = item;
    const dirs: ('H' | 'V')[] = rng.shuffle(['H', 'V'] as ('H' | 'V')[]);
    let ok = false;
    for (const dir of dirs) {
      if (ok) break;
      const maxR = CW_ROWS - (dir === 'V' ? word.length : 1);
      const maxC = CW_COLS - (dir === 'H' ? word.length : 1);
      let positions: [number, number][] = [];
      for (let r = 0; r <= maxR; r++) for (let c = 0; c <= maxC; c++) positions.push([r, c]);
      positions = rng.shuffle(positions);
      for (const [r, c] of positions) {
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const gr = r + (dir === 'V' ? i : 0), gc = c + (dir === 'H' ? i : 0);
          if (grid[gr][gc] !== '' && grid[gr][gc] !== word[i]) { fits = false; break; }
        }
        if (fits) {
          for (let i = 0; i < word.length; i++) {
            const gr = r + (dir === 'V' ? i : 0), gc = c + (dir === 'H' ? i : 0);
            grid[gr][gc] = word[i];
          }
          placed.push({ word: item.word, clue: item.clue });
          ok = true; break;
        }
      }
    }
  }

  const FILL = 'BCDFGHJKLMNPQRSTVWXYZ';
  for (let r = 0; r < CW_ROWS; r++)
    for (let c = 0; c < CW_COLS; c++)
      if (!grid[r][c]) grid[r][c] = FILL[rng.int(0, FILL.length)];

  return { grid, placed };
}

type Game = 'menu' | 'tf' | 'match' | 'quiz' | 'crossword';
type SwipeDir = 'left' | 'right' | null;

// ── Crossword component ───────────────────────────────────────────────────────
function CrosswordGame({ onBack }: { onBack: () => void }) {
  const today = Math.floor(Date.now() / 86400000);
  const puzzle = useRef(generatePuzzle(today)).current;
  const [found, setFound] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [selCells, setSelCells] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState('');
  const dragStart = useRef<[number, number] | null>(null);
  const dragEnd = useRef<[number, number] | null>(null);
  const cellSize = Math.min(Math.floor((Math.min(window.innerWidth, 420) - 32) / CW_COLS), 38);

  const getLineCells = (s: [number, number], e: [number, number]): [number, number][] => {
    let [er, ec] = e;
    const dr = er - s[0], dc = ec - s[1];
    if (dr !== 0 && dc !== 0) { if (Math.abs(dr) >= Math.abs(dc)) ec = s[1]; else er = s[0]; }
    const stepR = er > s[0] ? 1 : er < s[0] ? -1 : 0;
    const stepC = ec > s[1] ? 1 : ec < s[1] ? -1 : 0;
    const cells: [number, number][] = [];
    let r = s[0], c = s[1];
    while (true) { cells.push([r, c]); if (r === er && c === ec) break; r += stepR; c += stepC; }
    return cells;
  };

  const checkWord = useCallback(() => {
    if (!dragStart.current || !dragEnd.current) return;
    const cells = getLineCells(dragStart.current, dragEnd.current);
    const word = cells.map(([r, c]) => puzzle.grid[r][c]).join('');
    const match = puzzle.placed.find(pw => !found.has(pw.word) && pw.word === word);
    if (match) {
      const newFound = new Set(found); newFound.add(match.word);
      const newFoundCells = new Set(foundCells);
      cells.forEach(([r, c]) => newFoundCells.add(`${r},${c}`));
      setFound(newFound); setFoundCells(newFoundCells);
      setFlash(`✓ ${match.word} ditemukan!`);
      setTimeout(() => setFlash(''), 1200);
      if (newFound.size >= puzzle.placed.length) setTimeout(() => setDone(true), 600);
    }
    setSelCells(new Set());
  }, [found, foundCells, puzzle]);

  const getCellFromTouch = (touch: React.Touch, gridEl: HTMLElement): [number, number] | null => {
    const rect = gridEl.getBoundingClientRect();
    const x = touch.clientX - rect.left, y = touch.clientY - rect.top;
    const col = Math.floor(x / cellSize), row = Math.floor(y / cellSize);
    if (row < 0 || row >= CW_ROWS || col < 0 || col >= CW_COLS) return null;
    return [row, col];
  };

  const gridRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!gridRef.current) return;
    const cell = getCellFromTouch(e.touches[0], gridRef.current);
    if (!cell) return;
    dragStart.current = cell; dragEnd.current = cell;
    setSelCells(new Set([`${cell[0]},${cell[1]}`]));
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gridRef.current || !dragStart.current) return;
    const cell = getCellFromTouch(e.touches[0], gridRef.current);
    if (!cell) return;
    dragEnd.current = cell;
    const cells = getLineCells(dragStart.current, cell);
    setSelCells(new Set(cells.map(([r, c]) => `${r},${c}`)));
  };
  const handleTouchEnd = () => { checkWord(); dragStart.current = null; dragEnd.current = null; };

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-gray-900">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-white text-2xl font-black mb-1">Selamat!</p>
        <p className="text-gray-300 text-base mb-2">Semua {puzzle.placed.length} kata K3 ditemukan!</p>
        <p className="text-gray-500 text-sm mb-8">Kamu adalah ahli K3!</p>
        <button onClick={onBack} className="bg-green-500 text-white rounded-2xl px-8 py-3 font-bold flex items-center gap-2"><RotateCcw size={18} /> Menu</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-900 safe-bottom">
      <div className="bg-purple-700 px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <p className="text-white font-black">Teka-Teki K3 Harian</p>
          <p className="text-purple-200 text-xs">{dateStr}</p>
        </div>
        <span className="text-white font-black text-lg">{found.size}/{puzzle.placed.length}</span>
      </div>

      {flash && <div className="bg-green-500 text-white text-center text-sm font-bold py-1.5 px-4">{flash}</div>}

      {/* Grid */}
      <div className="flex justify-center px-4 pt-4">
        <div
          ref={gridRef}
          className="select-none"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${CW_COLS}, ${cellSize}px)`, gap: 1, touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {puzzle.grid.flat().map((letter, idx) => {
            const r = Math.floor(idx / CW_COLS), c = idx % CW_COLS;
            const key = `${r},${c}`;
            const isFound = foundCells.has(key);
            const isSel = selCells.has(key);
            return (
              <div
                key={idx}
                style={{ width: cellSize, height: cellSize }}
                className={`flex items-center justify-center font-black text-sm rounded-sm transition-colors
                  ${isFound ? 'bg-green-500 text-white' : isSel ? 'bg-blue-400 text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </div>

      {/* Word list */}
      <div className="px-4 pt-4 pb-4">
        <p className="text-gray-500 text-xs font-bold uppercase mb-2">Temukan kata-kata ini:</p>
        <div className="grid grid-cols-2 gap-1.5">
          {puzzle.placed.map(pw => (
            <div key={pw.word} className={`rounded-xl px-3 py-2 text-xs ${found.has(pw.word) ? 'bg-green-900/60 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
              <span className="font-black mr-1">{found.has(pw.word) ? '✓' : '○'}</span>
              <span className="font-bold text-white">{pw.word}</span>
              <span className="text-gray-500 ml-1">— {pw.clue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MiniGamesPage() {
  const navigate = useNavigate();
  const [game, setGame] = useState<Game>('menu');

  // TF state
  const [tfIdx, setTfIdx] = useState(0);
  const [tfScore, setTfScore] = useState(0);
  const [tfResult, setTfResult] = useState<boolean | null>(null);
  const [tfDone, setTfDone] = useState(false);
  const [swipe, setSwipe] = useState<SwipeDir>(null);
  const startX = useRef(0);

  // Match state
  const [matchRound, setMatchRound] = useState(0);
  const [selectedHazard, setSelectedHazard] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [matchErr, setMatchErr] = useState<string | null>(null);
  const [matchDone, setMatchDone] = useState(false);

  // Quiz state
  const [qIdx, setQIdx] = useState(0);
  const [qScore, setQScore] = useState(0);
  const [qSelected, setQSelected] = useState<number | null>(null);
  const [qDone, setQDone] = useState(false);

  const resetAll = () => {
    setTfIdx(0); setTfScore(0); setTfResult(null); setTfDone(false); setSwipe(null);
    setMatchRound(0); setSelectedHazard(null); setMatched({}); setMatchErr(null); setMatchDone(false);
    setQIdx(0); setQScore(0); setQSelected(null); setQDone(false);
    setGame('menu');
  };

  // ── TF handlers
  const answerTF = (ans: boolean) => {
    if (tfResult !== null) return;
    const correct = ans === TF_CARDS[tfIdx].a;
    setSwipe(ans ? 'right' : 'left');
    setTfResult(correct);
    if (correct) setTfScore(s => s + 1);
    setTimeout(() => {
      setSwipe(null); setTfResult(null);
      if (tfIdx + 1 >= TF_CARDS.length) setTfDone(true);
      else setTfIdx(i => i + 1);
    }, 1200);
  };
  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => { const diff = e.changedTouches[0].clientX - startX.current; if (Math.abs(diff) > 60) answerTF(diff > 0); };

  // ── Match handlers
  const round = MATCH_ROUNDS[matchRound] || MATCH_ROUNDS[0];
  const handleHazardSelect = (id: string) => { if (matched[id]) return; setSelectedHazard(id); setMatchErr(null); };
  const handleControlSelect = (id: string) => {
    if (!selectedHazard) return;
    if (id === selectedHazard) {
      const newMatched = { ...matched, [id]: true };
      setMatched(newMatched); setSelectedHazard(null);
      if (Object.keys(newMatched).length >= round.hazards.length) {
        if (matchRound + 1 >= MATCH_ROUNDS.length) setMatchDone(true);
        else setTimeout(() => { setMatchRound(r => r + 1); setMatched({}); setSelectedHazard(null); }, 700);
      }
    } else { setMatchErr('Salah! Coba lagi.'); setSelectedHazard(null); }
  };

  // ── Quiz handlers
  const handleQuizAnswer = (idx: number) => {
    if (qSelected !== null) return;
    setQSelected(idx);
    if (idx === QUIZ_QUESTIONS[qIdx].a) setQScore(s => s + 1);
    setTimeout(() => { setQSelected(null); if (qIdx + 1 >= QUIZ_QUESTIONS.length) setQDone(true); else setQIdx(i => i + 1); }, 1400);
  };

  // ── Crossword
  if (game === 'crossword') return <CrosswordGame onBack={resetAll} />;

  // ── Menu
  if (game === 'menu') {
    const menuItems = [
      { key: 'tf' as Game, icon: '👈👉', title: 'Swipe Benar/Salah', desc: `${TF_CARDS.length} pernyataan K3 — geser kanan (Benar) atau kiri (Salah)`, color: 'from-blue-500 to-blue-600' },
      { key: 'match' as Game, icon: '🔗', title: 'Cocokkan Bahaya', desc: 'Pasangkan bahaya dengan pengendalian yang tepat', color: 'from-orange-500 to-amber-600' },
      { key: 'quiz' as Game, icon: '⚡', title: 'Quick Quiz K3', desc: `${QUIZ_QUESTIONS.length} soal pilihan ganda — uji pengetahuanmu`, color: 'from-green-500 to-emerald-600' },
      { key: 'crossword' as Game, icon: '🔡', title: 'Teka-Teki K3 Harian', desc: 'Temukan kata K3 tersembunyi — puzzle baru setiap hari!', color: 'from-purple-500 to-indigo-600' },
    ];
    return (
      <div className="min-h-dvh safe-bottom fade-in">
        <div className="bg-primary-600 relative overflow-hidden px-5 pt-6 pb-6">
          <div className="blob w-40 h-40 bg-primary-400 opacity-25 -top-10 -right-10 absolute" />
          <div className="flex items-center gap-3 relative z-10">
            <button onClick={() => navigate('/app/learning')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2"><Gamepad2 size={20} /> K3 Mini Games</h1>
              <p className="text-primary-100 text-xs">Belajar K3 sambil bermain</p>
            </div>
          </div>
        </div>
        <div className="px-5 pt-5 pb-6 space-y-4">
          {menuItems.map(m => (
            <button key={m.key} onClick={() => setGame(m.key)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left active:scale-98 transition-all hover:border-primary-200">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${m.color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>{m.icon}</div>
                <div className="flex-1">
                  <p className="font-black text-gray-800">{m.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── TF Game
  if (game === 'tf') {
    const card = TF_CARDS[tfIdx];
    return (
      <div className="min-h-dvh safe-bottom fade-in flex flex-col bg-gray-900">
        <div className="bg-blue-600 px-5 pt-6 pb-4 flex items-center gap-3">
          <button onClick={resetAll} className="p-2 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <p className="text-white font-black">Swipe Benar/Salah</p>
            <p className="text-blue-200 text-xs">{tfIdx + 1}/{TF_CARDS.length} · Skor: {tfScore}</p>
          </div>
        </div>
        {tfDone ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <Trophy size={64} className="text-yellow-400 mb-4" />
            <p className="text-white text-2xl font-black mb-1">Selesai!</p>
            <p className="text-gray-300 text-lg mb-6">Skor: {tfScore}/{TF_CARDS.length}</p>
            <p className="text-gray-400 text-sm mb-8">{tfScore >= TF_CARDS.length * 0.8 ? '🎉 Luar biasa!' : tfScore >= TF_CARDS.length * 0.6 ? '👍 Bagus!' : '📚 Pelajari lagi materi K3.'}</p>
            <button onClick={resetAll} className="bg-blue-600 text-white rounded-2xl px-8 py-3 font-bold flex items-center gap-2"><RotateCcw size={18} /> Menu</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div
              className={`w-full bg-white rounded-3xl p-6 shadow-2xl transition-all duration-300 select-none
                ${swipe === 'right' ? 'translate-x-20 rotate-6 opacity-0' : ''}
                ${swipe === 'left' ? '-translate-x-20 -rotate-6 opacity-0' : ''}
                ${tfResult === true ? 'ring-4 ring-green-400' : tfResult === false ? 'ring-4 ring-red-400' : ''}`}
              onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
              <p className="text-gray-800 text-lg font-bold text-center leading-snug mb-4">{card.q}</p>
              {tfResult !== null && (
                <div className={`rounded-xl p-3 text-center text-sm font-semibold ${tfResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {tfResult ? '✓ Benar!' : `✗ Salah! ${card.hint || (card.a ? 'Jawabannya BENAR.' : 'Jawabannya SALAH.')}`}
                </div>
              )}
            </div>
            <div className="flex items-center gap-8 mt-8">
              <button onClick={() => answerTF(false)} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
                <XCircle size={32} className="text-white" />
              </button>
              <p className="text-gray-400 text-xs text-center">Geser atau tekan<br/>Benar / Salah</p>
              <button onClick={() => answerTF(true)} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
                <CheckCircle size={32} className="text-white" />
              </button>
            </div>
            <div className="mt-4 flex gap-1">
              {TF_CARDS.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all ${i < tfIdx ? 'bg-green-400 w-4' : i === tfIdx ? 'bg-blue-400 w-6' : 'bg-gray-600 w-2'}`} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Match Game
  if (game === 'match') {
    return (
      <div className="min-h-dvh safe-bottom fade-in bg-gray-50">
        <div className="bg-orange-500 px-5 pt-6 pb-4 flex items-center gap-3">
          <button onClick={resetAll} className="p-2 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <p className="text-white font-black">Cocokkan Bahaya</p>
            <p className="text-orange-100 text-xs">Ronde {matchRound + 1}/{MATCH_ROUNDS.length}</p>
          </div>
        </div>
        {matchDone ? (
          <div className="flex flex-col items-center justify-center px-8 text-center pt-24">
            <Trophy size={64} className="text-yellow-500 mb-4" />
            <p className="text-gray-800 text-2xl font-black mb-2">Semua Tepat!</p>
            <p className="text-gray-500 mb-8">Kamu berhasil mencocokkan semua bahaya dengan pengendaliannya.</p>
            <button onClick={resetAll} className="bg-orange-500 text-white rounded-2xl px-8 py-3 font-bold flex items-center gap-2"><RotateCcw size={18} /> Menu</button>
          </div>
        ) : (
          <div className="px-5 pt-5 pb-6">
            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Pilih Bahaya</p>
            <div className="space-y-2 mb-4">
              {round.hazards.map(h => (
                <button key={h.id} onClick={() => handleHazardSelect(h.id)} disabled={matched[h.id]}
                  className={`w-full text-left rounded-xl p-3 font-semibold text-sm transition-all border-2
                    ${matched[h.id] ? 'bg-green-50 border-green-300 text-green-700 opacity-60'
                      : selectedHazard === h.id ? 'bg-orange-50 border-orange-400 text-orange-700'
                        : 'bg-white border-gray-200 text-gray-700'}`}>
                  {matched[h.id] && '✓ '}{h.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Pilih Pengendalian</p>
            {matchErr && <p className="text-red-500 text-xs font-semibold mb-2">{matchErr}</p>}
            <div className="space-y-2">
              {round.controls.map(c => (
                <button key={c.id} onClick={() => handleControlSelect(c.id)} disabled={matched[c.id] || !selectedHazard}
                  className={`w-full text-left rounded-xl p-3 font-semibold text-sm transition-all border-2
                    ${matched[c.id] ? 'bg-green-50 border-green-300 text-green-700 opacity-60'
                      : !selectedHazard ? 'bg-gray-50 border-gray-200 text-gray-400'
                        : 'bg-white border-blue-200 text-gray-700 hover:border-blue-400'}`}>
                  {matched[c.id] && '✓ '}{c.label}
                </button>
              ))}
            </div>
            {selectedHazard && <p className="text-center text-xs text-orange-600 font-semibold mt-3">Sekarang pilih pengendalian yang tepat →</p>}
          </div>
        )}
      </div>
    );
  }

  // ── Quiz Game
  if (game === 'quiz') {
    const q = QUIZ_QUESTIONS[qIdx];
    return (
      <div className="min-h-dvh safe-bottom fade-in bg-gray-50">
        <div className="bg-green-600 px-5 pt-6 pb-4 flex items-center gap-3">
          <button onClick={resetAll} className="p-2 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <p className="text-white font-black">Quick Quiz K3</p>
            <p className="text-green-100 text-xs">{qIdx + 1}/{QUIZ_QUESTIONS.length} · Skor: {qScore}</p>
          </div>
        </div>
        {qDone ? (
          <div className="flex flex-col items-center justify-center px-8 text-center pt-24">
            <Trophy size={64} className="text-yellow-500 mb-4" />
            <p className="text-gray-800 text-2xl font-black mb-1">Quiz Selesai!</p>
            <p className="text-gray-600 text-lg mb-2">{qScore}/{QUIZ_QUESTIONS.length} Benar</p>
            <p className="text-gray-400 text-sm mb-8">{qScore >= QUIZ_QUESTIONS.length * 0.8 ? '🎉 Hebat!' : qScore >= QUIZ_QUESTIONS.length * 0.6 ? '👍 Cukup bagus!' : '📚 Baca kembali materi modul K3.'}</p>
            <button onClick={resetAll} className="bg-green-600 text-white rounded-2xl px-8 py-3 font-bold flex items-center gap-2"><RotateCcw size={18} /> Menu</button>
          </div>
        ) : (
          <div className="px-5 pt-5 pb-6">
            <div className="flex gap-1 mb-5">
              {QUIZ_QUESTIONS.map((_, i) => <div key={i} className={`flex-1 h-1.5 rounded-full ${i < qIdx ? 'bg-green-500' : i === qIdx ? 'bg-green-300' : 'bg-gray-200'}`} />)}
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <p className="text-gray-800 font-bold text-base leading-snug">{q.q}</p>
            </div>
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => handleQuizAnswer(i)} disabled={qSelected !== null}
                  className={`w-full text-left rounded-xl p-4 font-semibold text-sm border-2 transition-all
                    ${qSelected === null ? 'bg-white border-gray-200 text-gray-700 active:scale-98'
                      : i === q.a ? 'bg-green-50 border-green-400 text-green-700'
                        : qSelected === i ? 'bg-red-50 border-red-400 text-red-700'
                          : 'bg-white border-gray-100 text-gray-400 opacity-50'}`}>
                  <span className="inline-block w-6 h-6 rounded-full bg-gray-100 text-center text-xs font-black mr-2 leading-6">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
