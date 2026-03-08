import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, CheckCircle, Star } from 'lucide-react';
import { GEO_TOPICS, STORAGE_KEY } from './GeonovaLearningPage';

// ── Slide Types ───────────────────────────────────────────────────────────────
type Slide =
  | { type: 'hook'; emoji: string; title: string; subtitle: string; teaser: string; bg: string }
  | { type: 'objective'; items: string[] }
  | { type: 'concept'; title: string; body: string; narrator: string }
  | { type: 'visual'; title: string; items: { label: string; value: string; color: string; icon: string }[] }
  | { type: 'characteristics'; title: string; points: { icon: string; text: string; highlight?: string }[] }
  | { type: 'insight'; title: string; fact: string; emoji: string }
  | { type: 'diagram'; title: string; rows: { left: string; center?: string; right: string; color: string }[] }
  | { type: 'minigame'; title: string; instruction: string; pairs: { term: string; def: string }[] }
  | { type: 'quiz'; question: string; options: string[]; correct: number; explanation: string }
  | { type: 'observation'; title: string; scenario: string; fieldtip: string }
  | { type: 'case'; emoji: string; location: string; title: string; body: string; takeaway: string }
  | { type: 'summary'; title: string; points: string[] }
  | { type: 'reward'; topicTitle: string; xp: number; message: string; badge: string };

// ── Lesson Data ───────────────────────────────────────────────────────────────
const LESSONS: Record<string, Slide[]> = {

  'geo-1': [
    { type: 'hook', emoji: '🌍', title: 'Pengantar Geologi', subtitle: 'Bab 1 · Geologi Dasar', teaser: 'Geologi adalah bahasa yang digunakan Bumi untuk menceritakan sejarahnya selama 4,6 miliar tahun.', bg: 'from-blue-700 to-cyan-600' },
    { type: 'objective', items: ['Memahami definisi dan ruang lingkup ilmu geologi', 'Mengenal cabang-cabang ilmu geologi modern', 'Mengetahui tokoh-tokoh penting dan kontribusinya', 'Memahami metode kerja seorang geolog'] },
    { type: 'concept', title: 'Apa itu Geologi?', narrator: 'Geologi berasal dari bahasa Yunani: "geo" (bumi) + "logos" (ilmu). Geologi adalah ilmu yang mempelajari Bumi — komposisi, struktur, proses yang terjadi di dalamnya, dan sejarah evolusinya sejak terbentuk hingga kini.', body: 'Geologi mencakup studi tentang batuan, mineral, fosil, gunung berapi, gempa bumi, tanah longsor, dan sumber daya alam. Seorang geolog menggunakan pengamatan lapangan, analisis laboratorium, dan pemodelan komputer untuk memahami bagaimana Bumi bekerja.' },
    { type: 'characteristics', title: 'Cabang Utama Ilmu Geologi', points: [
      { icon: '🪨', text: 'Petrologi', highlight: 'Studi tentang batuan — asal-usul, komposisi, klasifikasi' },
      { icon: '💎', text: 'Mineralogi', highlight: 'Studi tentang mineral — sifat fisik, kimia, kristalografi' },
      { icon: '🐚', text: 'Paleontologi', highlight: 'Studi tentang fosil dan evolusi kehidupan purba' },
      { icon: '🗺️', text: 'Geologi Struktur', highlight: 'Studi deformasi batuan: lipatan, sesar, kekar' },
      { icon: '🌊', text: 'Stratigrafi', highlight: 'Studi perlapisan batuan dan sejarah pengendapan' },
      { icon: '🏗️', text: 'Geologi Teknik', highlight: 'Aplikasi geologi untuk rekayasa dan infrastruktur' },
    ]},
    { type: 'visual', title: 'Tokoh-Tokoh Penting Geologi', items: [
      { label: 'Nicolas Steno (1669)', value: 'Hukum Superposisi & Horisontalitas Asal', color: 'bg-blue-100 text-blue-800', icon: '📜' },
      { label: 'James Hutton (1785)', value: '"Bapak Geologi Modern" — Uniformitarianisme', color: 'bg-indigo-100 text-indigo-800', icon: '🔬' },
      { label: 'Charles Lyell (1830)', value: 'Principles of Geology — dasar geologi modern', color: 'bg-cyan-100 text-cyan-800', icon: '📚' },
      { label: 'Alfred Wegener (1912)', value: 'Teori Continental Drift — awal tektonik lempeng', color: 'bg-teal-100 text-teal-800', icon: '🌐' },
    ]},
    { type: 'insight', title: 'Prinsip Uniformitarianisme', fact: 'James Hutton merumuskan: "The present is the key to the past" — proses geologi yang kita amati sekarang (erosi, sedimentasi, vulkanisme) juga terjadi di masa lalu dengan intensitas dan cara yang sama. Ini adalah fondasi interpretasi geologi hingga kini.', emoji: '🤓' },
    { type: 'diagram', title: 'Metode Kerja Geolog', rows: [
      { left: '📍 Lapangan', center: '→', right: 'Pengamatan singkapan, pengukuran, sampling batuan & fosil', color: 'bg-blue-50' },
      { left: '🔬 Lab', center: '→', right: 'Petrografi, XRF, radiometri, analisis mikrofosil', color: 'bg-indigo-50' },
      { left: '💻 Kantor', center: '→', right: 'Pemetaan GIS, pemodelan 3D, penulisan laporan', color: 'bg-cyan-50' },
      { left: '📊 Integrasi', center: '→', right: 'Sintesis data → interpretasi geologi regional', color: 'bg-teal-50' },
    ]},
    { type: 'minigame', title: '🎮 Tebak Tokoh Geologi!', instruction: 'Cocokkan setiap tokoh dengan kontribusi utamanya. Tap nama tokoh, lalu tap kontribusinya!', pairs: [
      { term: 'Nicolas Steno', def: 'Hukum Superposisi batuan' },
      { term: 'James Hutton', def: 'Bapak Geologi Modern' },
      { term: 'Alfred Wegener', def: 'Teori Continental Drift' },
      { term: 'William Smith', def: 'Prinsip Faunal Succession' },
    ]},
    { type: 'quiz', question: 'Prinsip "The present is the key to the past" dirumuskan oleh siapa?', options: ['Nicolas Steno', 'James Hutton', 'Alfred Wegener', 'Charles Darwin'], correct: 1, explanation: 'James Hutton (1785) merumuskan prinsip Uniformitarianisme: proses geologi masa kini sama dengan yang terjadi di masa lalu. Prinsip ini menjadi dasar interpretasi rekaman batuan secara ilmiah.' },
    { type: 'observation', title: '👁️ Latihan Observasi', scenario: 'Kamu berdiri di tebing batuan berlapis di tepi jalan. Lapisan paling bawah berwarna merah, di atasnya abu-abu, paling atas kuning.', fieldtip: 'TIPS: Berdasarkan Hukum Superposisi (Steno), lapisan paling bawah (merah) adalah yang PALING TUA, dan lapisan paling atas (kuning) adalah yang PALING MUDA — kecuali ada bukti bahwa lapisan tersebut telah terbalik (overturned).' },
    { type: 'case', emoji: '🇮🇩', location: 'Indonesia · Ring of Fire', title: 'Mengapa Geologi Penting untuk Indonesia?', body: 'Indonesia duduk di atas pertemuan 3 lempeng tektonik besar: Eurasia, Indo-Australia, dan Pasifik. Ini menjadikan Indonesia memiliki 127 gunung api aktif (terbanyak di dunia), sumber gempa paling sering di dunia, sekaligus sumber daya mineral terbesar: nikel (terbesar ke-4 dunia), batubara, timah, emas-tembaga (Grasberg = deposit terbesar di dunia).', takeaway: 'Pemahaman geologi = kunci pengelolaan bencana DAN kekayaan alam Indonesia.' },
    { type: 'summary', title: 'Ringkasan Bab 1', points: [
      'Geologi = ilmu yang mempelajari komposisi, struktur, proses, dan sejarah Bumi',
      'Cabang utama: Petrologi, Mineralogi, Paleontologi, Geologi Struktur, Stratigrafi',
      'Tokoh kunci: Steno (Superposisi), Hutton (Uniformitarianisme), Lyell, Wegener (Continental Drift)',
      'Metode geolog: observasi lapangan → analisis lab → interpretasi komputer',
      'Indonesia = laboratorium geologi alami terlengkap di dunia',
    ]},
    { type: 'reward', topicTitle: 'Pengantar Geologi', xp: 60, message: 'Kamu sekarang memahami fondasi ilmu geologi dan mengapa ilmu ini penting!', badge: '🌍' },
  ],

  'geo-2': [
    { type: 'hook', emoji: '🔵', title: 'Struktur & Lapisan Bumi', subtitle: 'Bab 2 · Geologi Dasar', teaser: 'Jika Bumi dibelah menjadi dua, kamu akan melihat lapisan seperti bawang: keras di luar, cair di dalam, dan padat lagi di jantungnya.', bg: 'from-indigo-700 to-blue-600' },
    { type: 'objective', items: ['Mendeskripsikan 4 lapisan utama Bumi dan karakteristiknya', 'Memahami metode yang digunakan untuk mengetahui struktur dalam Bumi', 'Membedakan kerak samudera dan kerak benua', 'Menjelaskan astenosfer dan perannya dalam tektonik lempeng'] },
    { type: 'concept', title: 'Bagaimana Kita Tahu Struktur Dalam Bumi?', narrator: 'Manusia belum pernah menggali lebih dari ~12 km ke dalam Bumi (Kola Superdeep Borehole, Rusia). Jari-jari Bumi adalah 6.371 km! Lalu bagaimana kita tahu isi dalamnya?', body: 'Jawabannya: GELOMBANG SEISMIK. Saat terjadi gempa bumi, gelombang P (primer/kompresi) dan gelombang S (sekunder/geser) merambat ke seluruh Bumi. Gelombang-gelombang ini membelok, memantul, dan berubah kecepatan saat melewati lapisan berbeda — ini yang kita analisis untuk mencitrakan interior Bumi.' },
    { type: 'visual', title: 'Lapisan Bumi & Karakteristiknya', items: [
      { label: '🌿 Kerak (Crust)', value: '5–35 km tebal · Granit (benua) & Basalt (samudera)', color: 'bg-green-100 text-green-800', icon: '📏' },
      { label: '🟤 Mantel (Mantle)', value: '35–2.890 km · Peridotit · Padat tapi plastis (astenosfer)', color: 'bg-amber-100 text-amber-800', icon: '🌡️' },
      { label: '🔴 Inti Luar (Outer Core)', value: '2.890–5.150 km · Besi-Nikel CAIR · ~4.000–5.000°C', color: 'bg-red-100 text-red-800', icon: '💧' },
      { label: '⚫ Inti Dalam (Inner Core)', value: '5.150–6.371 km · Besi-Nikel PADAT · ~5.000–6.000°C', color: 'bg-gray-200 text-gray-800', icon: '⚡' },
    ]},
    { type: 'characteristics', title: 'Kerak Benua vs Kerak Samudera', points: [
      { icon: '🏔️', text: 'Kerak Benua', highlight: 'Tebal: 25–70 km · Komposisi: Granit (SiAl) · Densitas: 2,7 g/cm³ · Usia: hingga 4,4 miliar tahun' },
      { icon: '🌊', text: 'Kerak Samudera', highlight: 'Tebal: 5–10 km · Komposisi: Basalt (SiMa) · Densitas: 3,0 g/cm³ · Usia: max ~200 juta tahun' },
      { icon: '🔥', text: 'Mantel Atas (Litosfir)', highlight: 'Padat dan kaku — bersama kerak membentuk Lempeng Tektonik yang bergerak' },
      { icon: '🌊', text: 'Astenosfer', highlight: 'Bagian mantel plastis (partial melt) pada ~100–350 km kedalaman — lempeng bergerak di atasnya' },
    ]},
    { type: 'insight', title: 'Fakta Mengejutkan: Inti Dalam Bumi', fact: 'Inti dalam Bumi terbuat dari besi padat meski suhunya mencapai ~5.700°C — lebih panas dari permukaan Matahari! Mengapa tidak meleleh? Karena tekanan yang luar biasa besar (~360 GPa = 3,6 juta kali tekanan atmosfer) memaksa atom besi tetap dalam struktur padat.', emoji: '😲' },
    { type: 'diagram', title: 'Penampang Bumi (Skema)', rows: [
      { left: '0–35 km', center: 'KERAK', right: 'Granit / Basalt · SiO₂-kaya', color: 'bg-green-50 border-green-200' },
      { left: '35–2.890 km', center: 'MANTEL', right: 'Peridotit · MgO-FeO-kaya · Astenosfer 100-350 km', color: 'bg-amber-50 border-amber-200' },
      { left: '2.890–5.150 km', center: 'INTI LUAR', right: 'Fe-Ni CAIR · Menghasilkan medan magnet Bumi', color: 'bg-red-50 border-red-200' },
      { left: '5.150–6.371 km', center: 'INTI DALAM', right: 'Fe-Ni PADAT · Tekanan ekstrem · ~5.700°C', color: 'bg-gray-50 border-gray-300' },
    ]},
    { type: 'minigame', title: '🎮 Cocokkan Lapisan Bumi!', instruction: 'Pasangkan nama lapisan dengan karakteristik utamanya!', pairs: [
      { term: 'Kerak Benua', def: 'Granit, 25-70 km tebal' },
      { term: 'Astenosfer', def: 'Mantel plastis, lempeng bergerak di atasnya' },
      { term: 'Inti Luar', def: 'Besi-Nikel cair, sumber medan magnet' },
      { term: 'Inti Dalam', def: 'Besi-Nikel padat, terpanas di Bumi' },
    ]},
    { type: 'quiz', question: 'Lapisan Bumi mana yang dalam keadaan CAIR?', options: ['Kerak samudera', 'Astenosfer', 'Inti luar', 'Inti dalam'], correct: 2, explanation: 'Inti luar (2.890–5.150 km) terdiri dari besi-nikel dalam keadaan CAIR. Gerakannya menghasilkan arus konveksi yang menciptakan medan magnet Bumi. Inti dalam juga besi-nikel tetapi dalam keadaan PADAT karena tekanan yang sangat besar.' },
    { type: 'observation', title: '👁️ Seismik = X-Ray Bumi', scenario: 'Stasiun seismik mencatat gelombang P (primer) dari gempa di Pasifik. Gelombang S (sekunder) tidak terdeteksi di stasiun yang ada di sisi berlawanan Bumi.', fieldtip: 'INTERPRETASI: Gelombang S tidak bisa merambat melalui material cair. Ketidakhadiran gelombang S di zona "shadow zone" inilah yang membuktikan inti luar Bumi bersifat CAIR. Ini adalah contoh bagaimana seismologi "melihat" interior Bumi.' },
    { type: 'case', emoji: '🌋', location: 'Indonesia · Sistem Gunung Api', title: 'Astenosfer dan 127 Gunung Api Indonesia', body: 'Astenosfer yang plastis memungkinkan lempeng tektonik bergerak. Di zona subduksi bawah Indonesia, lempeng Indo-Australia menujam ke bawah lempeng Eurasia, masuk ke mantel, dan meleleh menghasilkan magma. Magma ini naik ke permukaan membentuk deretan gunung api Sunda Arc dari Sumatera–Jawa–Bali–Lombok–Sumbawa.', takeaway: '127 gunung api aktif Indonesia = langsung manifestasi dari astenosfer dan proses subduksi di bawah kepulauan!' },
    { type: 'summary', title: 'Ringkasan Bab 2', points: [
      'Interior Bumi diketahui melalui analisis gelombang seismik (P dan S)',
      '4 lapisan: Kerak (0-35km) → Mantel (35-2.890km) → Inti Luar cair (2.890-5.150km) → Inti Dalam padat (5.150-6.371km)',
      'Kerak benua: granit, tebal 25-70 km. Kerak samudera: basalt, tipis 5-10 km',
      'Astenosfer (~100-350 km) = zona mantel plastis tempat lempeng tektonik bergerak',
      'Inti luar yang cair menghasilkan medan magnet Bumi pelindung kehidupan',
    ]},
    { type: 'reward', topicTitle: 'Struktur & Lapisan Bumi', xp: 70, message: 'Luar biasa! Kamu kini memahami "anatomi" Bumi dari permukaan hingga jantungnya!', badge: '🔵' },
  ],

  'geo-3': [
    { type: 'hook', emoji: '💎', title: 'Mineral & Identifikasinya', subtitle: 'Bab 3 · Geologi Dasar', teaser: 'Setiap batuan adalah kumpulan mineral. Mineral adalah "atom penyusun" semua batuan — menguasai mineral berarti menguasai segalanya.', bg: 'from-purple-700 to-violet-600' },
    { type: 'objective', items: ['Mendefinisikan mineral secara ilmiah dengan 5 syarat', 'Menguasai 8 sifat fisik untuk identifikasi mineral di lapangan', 'Mengenali mineral pembentuk batuan paling umum (kuarsa, feldspar, mika, dll)', 'Membedakan mineral silikat dan non-silikat berdasarkan komposisi kimia'] },
    { type: 'concept', title: 'Apa itu Mineral?', narrator: 'Tidak semua "batu" adalah mineral, dan tidak semua yang mengkilap adalah emas! Mineral memiliki 5 syarat yang sangat spesifik. Memahaminya akan mengubah cara kamu melihat setiap batu yang kamu pegang.', body: 'Mineral adalah: (1) ALAMI — terbentuk oleh proses alam, bukan buatan manusia; (2) ANORGANIK — bukan senyawa organik/karbon organik; (3) PADAT — dalam kondisi normal; (4) KOMPOSISI KIMIA TERTENTU — dapat dinyatakan dengan rumus kimia; (5) STRUKTUR KRISTAL TERTENTU — atom tersusun dalam pola teratur berulang. Contoh: Kuarsa (SiO₂) ✓ | Es Batu (H₂O) ✓ | Plastik ✗ | Gula ✗ | Minyak bumi ✗' },
    { type: 'visual', title: '8 Sifat Identifikasi Mineral', items: [
      { label: '1. Warna (Color)', value: 'Warna tampak — TIDAK SELALU konsisten (berubah karena pengotor)', color: 'bg-red-100 text-red-800', icon: '🎨' },
      { label: '2. Streak (Goresan)', value: 'Warna serbuk di keramik putih — LEBIH KONSISTEN dari warna', color: 'bg-orange-100 text-orange-800', icon: '✏️' },
      { label: '3. Kilap (Luster)', value: 'Metalik (logam) | Vitreous (kaca) | Resinous | Pearly | Silky | Dull', color: 'bg-yellow-100 text-yellow-800', icon: '✨' },
      { label: '4. Kekerasan (Hardness)', value: 'Skala Mohs 1-10: Talk→Gipsum→Kalsit→Fluorit→Apatit→Ortoklas→Kuarsa→Topas→Korundum→Intan', color: 'bg-green-100 text-green-800', icon: '💪' },
      { label: '5. Belahan (Cleavage)', value: 'Kecenderungan pecah mengikuti bidang kristal: sempurna (mika), baik (feldspar), tidak ada (kuarsa)', color: 'bg-teal-100 text-teal-800', icon: '✂️' },
      { label: '6. Pecahan (Fracture)', value: 'Cara mineral pecah di luar bidang belahan: konkoidal (kuarsa), tidak teratur, fibrosa', color: 'bg-blue-100 text-blue-800', icon: '🔨' },
      { label: '7. Berat Jenis (SG)', value: 'Ratio massa/volume air setara: kuarsa=2,65; galena=7,6; emas=15-19', color: 'bg-indigo-100 text-indigo-800', icon: '⚖️' },
      { label: '8. Sifat Khusus', value: 'Reaksi HCl (kalsit), magnetik (magnetit), fluoresen UV, rasa (halit=asin)', color: 'bg-purple-100 text-purple-800', icon: '⚗️' },
    ]},
    { type: 'characteristics', title: 'Mineral Pembentuk Batuan Utama', points: [
      { icon: '⬜', text: 'Kuarsa (SiO₂)', highlight: 'Kekerasan 7 · Vitreous · Tidak bereaksi HCl · Tidak ada belahan · PALING TAHAN lapuk' },
      { icon: '🩷', text: 'Feldspar (>60% kerak)', highlight: 'K-Feldspar (ortoklas) & Plagioklas · Kekerasan 6 · 2 arah belahan ~90° · warna merah muda/putih/abu' },
      { icon: '⬛', text: 'Mika (Biotit & Muskovit)', highlight: 'Belahan SEMPURNA 1 arah · Biotit: hitam · Muskovit: putih-silver · lembaran tipis elastis' },
      { icon: '🟢', text: 'Piroksen (Augit)', highlight: 'Mineral mafik gelap · Belahan 2 arah ~87-93° · Kilap vitreous-resinous · Mudah lapuk' },
      { icon: '💚', text: 'Olivin ((Mg,Fe)₂SiO₄)', highlight: 'Mineral mantel · Hijau-kuning · Tidak ada belahan · Pertama kristalisasi dari magma (Seri Bowen)' },
      { icon: '⬜', text: 'Kalsit (CaCO₃)', highlight: 'Kekerasan 3 · BEREAKSI HCl dingin dengan busa! · Belahan 3 arah sempurna · Penyusun batugamping' },
    ]},
    { type: 'insight', title: 'Emas vs Pirit — "Emas Palsu"', fact: 'Pirit (FeS₂) sering disebut "Fool\'s Gold" karena kilap kuning metaliknya mirip emas. Cara membedakan: (1) Kekerasan: Pirit 6-6,5 vs Emas 2,5-3 — pirit menggores kaca, emas tidak; (2) Streak: Pirit = hitam, Emas = kuning; (3) Berat jenis: Pirit 5, Emas 15-19 — emas jauh lebih berat; (4) Kelenturan: pirit rapuh, emas lunak dan bisa ditempa.', emoji: '💰' },
    { type: 'diagram', title: 'Klasifikasi Mineral Silikat', rows: [
      { left: 'Neosilikat', center: 'SiO₄ terisolasi', right: 'Olivin, Garnet → kekerasan tinggi, tahan', color: 'bg-green-50' },
      { left: 'Inosilikat', center: 'Rantai tunggal/ganda', right: 'Piroksen (87-93°), Amfibol (56-124°)', color: 'bg-blue-50' },
      { left: 'Filosilikat', center: 'Lembaran 2D', right: 'Mika, Klorit, Talk → belahan sempurna 1 arah', color: 'bg-purple-50' },
      { left: 'Tektosilikat', center: 'Kerangka 3D', right: 'Kuarsa, Feldspar → paling stabil, tahan lapuk', color: 'bg-amber-50' },
    ]},
    { type: 'minigame', title: '🎮 Uji Kekerasan Mineral!', instruction: 'Pasangkan mineral dengan nilai kekerasannya di skala Mohs!', pairs: [
      { term: 'Talk', def: 'Mohs 1 — paling lunak' },
      { term: 'Kalsit', def: 'Mohs 3 — bereaksi HCl' },
      { term: 'Kuarsa', def: 'Mohs 7 — tidak bereaksi HCl' },
      { term: 'Intan', def: 'Mohs 10 — paling keras di alam' },
    ]},
    { type: 'quiz', question: 'Kamu menemukan mineral kuning metalik berkilau di sungai. Cara paling TEPAT membedakan emas asli dari pirit adalah...', options: ['Warna dan kilap yang lebih cerah', 'Uji kekerasan — emas lebih lunak, pirit lebih keras', 'Ukuran kristal yang lebih besar', 'Lokasi ditemukannya'], correct: 1, explanation: 'Emas memiliki kekerasan 2,5-3 (digores oleh koin), sedangkan pirit 6-6,5 (menggores kaca). Emas juga jauh lebih berat (BJ 15-19 vs pirit 5), dan streak-nya kuning vs streak pirit yang hitam.' },
    { type: 'observation', title: '👁️ Identifikasi Mineral Cepat di Lapangan', scenario: 'Kamu menemukan mineral putih, kilap kaca, tidak ada belahan jelas, dan menggores kaca dengan mudah. Tes HCl tidak bereaksi.', fieldtip: 'JAWABAN: Ini kemungkinan besar KUARSA (SiO₂)! Kekerasan 7 (menggores kaca, kaca=6), tidak bereaksi HCl, tidak ada belahan, pecahan konkoidal. Kuarsa adalah mineral paling umum di kerak bumi dan paling tahan pelapukan.' },
    { type: 'case', emoji: '⛏️', location: 'Sulawesi Tenggara · Deposit Nikel', title: 'Mineral Olivin → Bijih Nikel Indonesia', body: 'Olivin ((Mg,Fe)₂SiO₄) dalam batuan peridotit mengandung nikel. Di Sulawesi Tenggara (Sorowako, Pomalaa) dan Maluku Utara (Halmahera), pelapukan intensif tropikal mengubah olivin menjadi mineral lateriit kaya nikel (garnierit, limonit). Indonesia adalah produsen nikel terbesar dunia berkat proses ini.', takeaway: 'Olivin — mineral mantel sederhana — setelah melewati jutaan tahun pelapukan di iklim tropis Indonesia, menjadi harta karun nikel senilai triliunan rupiah!' },
    { type: 'summary', title: 'Ringkasan Bab 3', points: [
      'Mineral = alami + anorganik + padat + komposisi kimia tertentu + struktur kristal tertentu',
      '8 sifat identifikasi: warna, streak, kilap, kekerasan, belahan, pecahan, BJ, sifat khusus',
      'Mineral silikat >90% kerak bumi: kuarsa(7), feldspar(6), mika, piroksen, olivin, kalsit(3)',
      'Emas vs pirit: bedakan dengan kekerasan (3 vs 6,5) dan streak (kuning vs hitam)',
      'Uji HCl 10% = cara tercepat mengidentifikasi kalsit/dolomit di lapangan',
    ]},
    { type: 'reward', topicTitle: 'Mineral & Identifikasinya', xp: 75, message: 'Hebat! Sekarang kamu bisa mengidentifikasi mineral di lapangan seperti seorang geolog profesional!', badge: '💎' },
  ],

  'geo-4': [
    { type: 'hook', emoji: '🌋', title: 'Tektonik Lempeng', subtitle: 'Bab 4 · Geologi Dasar', teaser: 'Bumi tidak diam. Setiap tahun, lempeng-lempeng raksasa bergerak sejauh pertumbuhan kukumu — dan itu cukup untuk mengubah muka Bumi dalam jutaan tahun.', bg: 'from-red-700 to-orange-600' },
    { type: 'objective', items: ['Memahami sejarah teori: dari Continental Drift hingga Tektonik Lempeng', 'Mendeskripsikan 3 jenis batas lempeng dan kenampakan geologisnya', 'Menjelaskan mekanisme penggerak lempeng (konveksi mantel)', 'Menganalisis posisi Indonesia di pertemuan 3 lempeng'] },
    { type: 'concept', title: 'Dari Continental Drift ke Tektonik Lempeng', narrator: 'Pada 1912, Alfred Wegener mengajukan hipotesis kontroversial: benua-benua pernah menyatu menjadi satu superbenua (Pangaea) dan kemudian terpisah. Buktinya: bentuk Afrika dan Amerika Selatan yang cocok seperti puzzle, fosil reptil Mesosaurus di kedua sisi Atlantik, dan kecocokan rangkaian pegunungan.', body: 'Ide Wegener ditolak keras selama 50 tahun karena tidak ada mekanisme yang bisa menjelaskan bagaimana benua bisa bergerak. Barulah pada 1960-an, penemuan Sea-Floor Spreading (Harry Hess) dan anomali magnetik di dasar laut membuktikan dasar samudera muda dan terus terbentuk di mid-ocean ridge — melahirkan teori TEKTONIK LEMPENG modern.' },
    { type: 'visual', title: 'Data Tektonik Lempeng', items: [
      { label: '🌍 Jumlah Lempeng Mayor', value: '~15 lempeng utama + banyak lempeng minor', color: 'bg-red-100 text-red-800', icon: '🗺️' },
      { label: '⏱️ Kecepatan Lempeng', value: '1–15 cm/tahun (setara pertumbuhan kuku)', color: 'bg-orange-100 text-orange-800', icon: '📏' },
      { label: '🇮🇩 Lempeng Indo-Australia', value: '~7 cm/tahun ke arah Utara-Timur', color: 'bg-yellow-100 text-yellow-800', icon: '↗️' },
      { label: '🌊 Kedalaman subduksi max', value: '~670 km (zona Wadati-Benioff)', color: 'bg-green-100 text-green-800', icon: '📉' },
    ]},
    { type: 'characteristics', title: '3 Jenis Batas Lempeng', points: [
      { icon: '↔️', text: 'Batas DIVERGEN', highlight: 'Lempeng bergerak menjauh → Rift valley, Mid-Ocean Ridge, magma basaltik. Contoh: Mid-Atlantic Ridge, Rift Afrika Timur' },
      { icon: '↗️', text: 'Batas KONVERGEN', highlight: 'Lempeng bertumbukan → Subduksi (palung laut), Orogeni (pegunungan), Vulkanisme andesitik. Contoh: Palung Jawa, Himalaya, Pegunungan Andes' },
      { icon: '↕️', text: 'Batas TRANSFORM', highlight: 'Lempeng bergeser secara lateral (strike-slip) → Sesar geser besar, gempa superfisial. Contoh: Sesar San Andreas (USA), Sesar Palu-Koro (Sulawesi)' },
      { icon: '🔄', text: 'Mekanisme Penggerak', highlight: 'Arus konveksi mantel: material panas naik di mid-ocean ridge (divergen), mendingin, tenggelam di zona subduksi. Juga: Ridge push + Slab pull' },
    ]},
    { type: 'insight', title: 'Superbenua Pangaea', fact: '~300 juta tahun lalu, semua benua bergabung menjadi Pangaea. Sebelumnya ada Gondwana (Amerika Selatan+Afrika+India+Australia+Antarktika) dan Laurasia (Amerika Utara+Eropa+Asia). Pangaea mulai terpisah ~200 juta tahun lalu. Di masa depan (~250 juta tahun ke depan), lempeng-lempeng akan bergabung lagi membentuk Amasia (Amerika+Asia)!', emoji: '🌏' },
    { type: 'diagram', title: 'Indonesia: Pertemuan 3 Lempeng', rows: [
      { left: '🟦 Lempeng Eurasia', center: 'Bergerak ke tenggara', right: 'Kalimantan, Jawa, Sumatera', color: 'bg-blue-50' },
      { left: '🟩 Lempeng Indo-Australia', center: '~7 cm/tahun ke utara', right: 'Menyubduksi di bawah Sunda Arc', color: 'bg-green-50' },
      { left: '🟥 Lempeng Pasifik', center: 'Bergerak ke barat', right: 'Menabrak Papua dari timur', color: 'bg-red-50' },
      { left: '⚠️ Hasil Pertemuan', center: '→', right: '127 gunung api + gempa + tsunami + kekayaan mineral', color: 'bg-orange-50' },
    ]},
    { type: 'minigame', title: '🎮 Batas Lempeng & Kenampakan!', instruction: 'Cocokkan jenis batas lempeng dengan kenampakan geologis yang dihasilkannya!', pairs: [
      { term: 'Batas Divergen', def: 'Mid-Ocean Ridge & Rift Valley' },
      { term: 'Batas Konvergen', def: 'Palung laut & Pegunungan lipatan' },
      { term: 'Batas Transform', def: 'Sesar geser besar & gempa superfisial' },
      { term: 'Zona Subduksi', def: 'Gunung api andesitik & Palung dalam' },
    ]},
    { type: 'quiz', question: 'Apa mekanisme UTAMA yang menggerakkan lempeng tektonik?', options: ['Rotasi Bumi', 'Arus konveksi di mantel + ridge push + slab pull', 'Tarikan gravitasi Bulan', 'Ledakan vulkanik'], correct: 1, explanation: 'Lempeng bergerak karena kombinasi: (1) Arus konveksi mantel — material panas naik di mid-ocean ridge, dingin tenggelam di subduksi; (2) Ridge push — lempeng baru yang terbentuk mendorong lempeng lama; (3) Slab pull — ujung lempeng yang dingin dan berat menarik sisa lempeng ke zona subduksi.' },
    { type: 'observation', title: '👁️ Bukti Continental Drift di Lapangan', scenario: 'Di sepanjang pantai Afrika Barat kamu menemukan fosil reptil air tawar Mesosaurus berumur ~280 juta tahun. Fosil yang identik juga ditemukan di Brasil. Saat ini, kedua wilayah dipisahkan Samudera Atlantik selebar 3.000 km.', fieldtip: 'INTERPRETASI WEGENER: Mesosaurus tidak bisa menyeberangi samudera. Ditemukannya di kedua sisi Atlantik berarti dua benua ini dulunya menyatu (Gondwana). Ini adalah salah satu bukti paling kuat untuk Continental Drift yang Wegener kumpulkan.' },
    { type: 'case', emoji: '⚠️', location: 'Sumatera · Megathrust', title: 'Megathrust Sumatera — Bom Waktu Tektonik', body: 'Lempeng Indo-Australia menghunjam ke bawah lempeng Eurasia di Palung Sunda dengan kecepatan 7 cm/tahun. Tekanan yang terakumulasi selama ratusan tahun dilepaskan dalam gempa megathrust besar. Gempa 2004 (M 9,1–9,3) memicu tsunami Aceh yang menewaskan >230.000 jiwa. Segmen Mentawai masih "terkunci" dan diperkirakan menyimpan energi untuk gempa M >8,5.', takeaway: 'Tektonik lempeng bukan hanya teori abstrak — ini adalah ancaman nyata yang menuntut pemahaman geologi untuk mitigasi bencana Indonesia.' },
    { type: 'summary', title: 'Ringkasan Bab 4', points: [
      'Continental Drift (Wegener 1912) → Sea-Floor Spreading (Hess 1960s) → Tektonik Lempeng modern',
      '3 batas lempeng: Divergen (mid-ocean ridge), Konvergen (subduksi+pegunungan), Transform (sesar geser)',
      'Penggerak: konveksi mantel + ridge push + slab pull — 1-15 cm/tahun',
      'Indonesia = pertemuan 3 lempeng (Eurasia + Indo-Australia + Pasifik) → 127 gunung api aktif',
      'Megathrust Sumatera = ancaman nyata yang dipahami melalui ilmu tektonik lempeng',
    ]},
    { type: 'reward', topicTitle: 'Tektonik Lempeng', xp: 80, message: 'Kamu telah memahami gaya yang menggerakkan Bumi dan membentuk kepulauan Indonesia!', badge: '🌋' },
  ],

  'geo-5': [
    { type: 'hook', emoji: '🪨', title: 'Siklus Batuan', subtitle: 'Bab 5 · Geologi Dasar', teaser: 'Granit di Puncak Jaya hari ini bisa menjadi pasir pantai Lombok jutaan tahun ke depan, lalu menjadi batu metamorf di kedalaman Bumi, lalu meleleh dan menjadi lava baru. Batuan tidak pernah benar-benar mati.', bg: 'from-stone-700 to-amber-700' },
    { type: 'objective', items: ['Mendeskripsikan siklus batuan dan 3 jenis batuan utama', 'Menjelaskan proses penghubung antar jenis batuan', 'Mengidentifikasi batuan ekonomis penting di Indonesia', 'Membedakan batuan beku, sedimen, dan metamorf dari ciri lapangan'] },
    { type: 'concept', title: 'Siklus Batuan: Tak Ada yang Abadi', narrator: 'Bayangkan sebuah granit di pegunungan. Hujan dan angin mengikisnya menjadi butiran pasir. Pasir mengalir ke sungai, terbawa ke laut, menumpuk berlapis-lapis, dan menjadi batupasir setelah jutaan tahun. Batupasir itu mungkin terseret ke zona subduksi, terpanaskan dan tertekan, berubah menjadi kuarsit. Dan kuarsit itu, jika turun semakin dalam, akan meleleh menjadi magma baru...', body: 'Itulah siklus batuan. Tidak ada satupun material batuan yang "hilang" — semuanya terus bertransformasi. Prosesnya bisa sangat lambat (jutaan tahun untuk sedimentasi) atau sangat cepat (hitungan hari untuk pembekuan lava).' },
    { type: 'characteristics', title: '3 Kelompok Batuan Utama', points: [
      { icon: '🔥', text: 'Batuan Beku (Igneous)', highlight: 'Terbentuk dari pembekuan magma/lava. Intrusi (dalam: granit) vs Ekstrusi (permukaan: basalt). Tekstur tergantung kecepatan pendinginan.' },
      { icon: '🌊', text: 'Batuan Sedimen (Sedimentary)', highlight: 'Terbentuk dari akumulasi, pemadatan, dan sementasi sedimen. Klastik (detrital) atau kimia/biokimia. Paling umum di permukaan bumi (75% permukaan).' },
      { icon: '💜', text: 'Batuan Metamorf (Metamorphic)', highlight: 'Terbentuk dari batuan asal (protolith) yang berubah akibat tekanan+panas tinggi TANPA meleleh. Ciri khas: foliasi, rekristalisasi.' },
      { icon: '🔄', text: 'Proses Penghubung', highlight: 'Kristalisasi (magma→beku) · Erosi+Sedimentasi+Litifikasi (→sedimen) · Metamorfisme (→metamorf) · Anateksis (→magma baru)' },
    ]},
    { type: 'visual', title: 'Batuan Ekonomis Indonesia', items: [
      { label: '⚫ Batubara (Sedimen)', value: 'Kalimantan+Sumatera · 3° terbesar dunia · >500 juta ton/tahun', color: 'bg-gray-200 text-gray-800', icon: '⚡' },
      { label: '🟡 Emas-Tembaga (Beku/Hidrothermal)', value: 'Grasberg Papua · Deposit terbesar di dunia · 3,5 miliar ton bijih', color: 'bg-yellow-100 text-yellow-800', icon: '💰' },
      { label: '🟢 Nikel (Pelapukan Batuan Beku)', value: 'Sulawesi+Halmahera · Produsen terbesar ke-1 dunia (2023)', color: 'bg-green-100 text-green-800', icon: '🔋' },
      { label: '⚪ Batugamping (Sedimen)', value: 'Seluruh Indonesia · Semen+Industri · 28 miliar ton cadangan', color: 'bg-stone-100 text-stone-800', icon: '🏭' },
    ]},
    { type: 'insight', title: 'Waktu dalam Siklus Batuan', fact: 'Siklus batuan berlangsung pada skala waktu yang sulit dibayangkan: Pembentukan granit batholit → 10-100 juta tahun. Erosi pegunungan → 10-50 juta tahun. Sedimentasi dan litifikasi → 1-100 juta tahun. Metamorfisme regional → 10-100 juta tahun. Namun lava bisa membeku menjadi basalt dalam hitungan HARI di permukaan. Kita hanya melihat "foto sesaat" dari proses yang berlangsung miliaran tahun.', emoji: '⏳' },
    { type: 'diagram', title: 'Siklus Batuan — Proses & Produk', rows: [
      { left: 'Magma/Lava', center: 'Pembekuan', right: '→ Batuan BEKU (granit, basalt, andesit)', color: 'bg-red-50' },
      { left: 'Semua Batuan', center: 'Erosi→Transport→Sedimentasi→Litifikasi', right: '→ Batuan SEDIMEN (batupasir, serpih, batugamping)', color: 'bg-amber-50' },
      { left: 'Semua Batuan', center: 'Tekanan+Panas (tanpa meleleh)', right: '→ Batuan METAMORF (marmer, kuarsit, gneis)', color: 'bg-purple-50' },
      { left: 'Semua Batuan', center: 'Panas ekstrem (anateksis)', right: '→ kembali menjadi MAGMA', color: 'bg-orange-50' },
    ]},
    { type: 'minigame', title: '🎮 Batuan & Proses Pembentukannya!', instruction: 'Pasangkan nama batuan dengan proses pembentukannya!', pairs: [
      { term: 'Granit', def: 'Pembekuan magma intrusi (dalam bumi)' },
      { term: 'Batugamping', def: 'Akumulasi cangkang organisme CaCO₃' },
      { term: 'Marmer', def: 'Metamorfisme batugamping oleh panas' },
      { term: 'Basalt', def: 'Pembekuan lava cepat di permukaan' },
    ]},
    { type: 'quiz', question: 'Batuan sedimen mengcover ~75% permukaan Bumi. Mengapa, padahal volumenya hanya ~8% dari kerak bumi?', options: ['Karena batuan sedimen paling keras', 'Karena diendapkan di permukaan dan menutupi batuan beku yang ada di bawahnya', 'Karena proses sedimentasi sangat cepat', 'Karena batuan sedimen terbentuk dari air laut'], correct: 1, explanation: 'Batuan sedimen terbentuk DI PERMUKAAN BUMI (pantai, dasar sungai, dasar laut) dari material yang telah tererosi dari batuan lebih tua. Karena proses ini terus berlangsung, batuan sedimen menutupi hampir seluruh permukaan seperti "selimut", meski secara volume total jauh lebih sedikit dari batuan beku dan metamorf di bawahnya.' },
    { type: 'observation', title: '👁️ Identifikasi 3 Jenis Batuan di Lapangan', scenario: 'Di sebuah tebing, kamu melihat: (A) batuan berlapis dengan cangkang fosil kerang, (B) batuan yang kristalnya saling mengunci kasar seperti granit merah muda, (C) batuan berlapis-lapis tipis mengkilap (foliasi).', fieldtip: 'JAWABAN: (A) = Batugamping SEDIMEN — berlapis, ada fosil, tes HCl bereaksi. (B) = Granit BEKU — tekstur faneritik, kristal interlocking, tidak berlapis. (C) = Sekis/Gneis METAMORF — foliasi dari orientasi mineral (terutama mika), tidak mengandung fosil.' },
    { type: 'case', emoji: '⛏️', location: 'Kalimantan Timur · Batubara', title: 'Batubara Indonesia: Hutan Purba yang Tersimpan', body: 'Batubara adalah batuan sedimen organik — sisa hutan tropis purba yang tertimbun 60-300 juta tahun lalu. Di Kalimantan Timur, lapisan batubara terbentuk di rawa-rawa delta dan cekungan tepi benua Eosen-Oligosen. Timbunan lumpur mengubur kayu → gambut → lignit → bituminus seiring waktu dan tekanan. Indonesia adalah eksportir batubara thermal terbesar dunia.', takeaway: 'Setiap ton batubara yang dibakar adalah jutaan ton CO₂ dari karbon yang sudah "tersimpan aman" selama ratusan juta tahun — ini mengapa pembakaran batubara percepat perubahan iklim.' },
    { type: 'summary', title: 'Ringkasan Bab 5', points: [
      'Siklus batuan: magma → beku → erosi → sedimen → metamorf → magma (terus berulang)',
      'Batuan Beku: dari magma/lava, tekstur tergantung kecepatan pendinginan',
      'Batuan Sedimen: 75% permukaan bumi, klastik atau kimia/biokimia',
      'Batuan Metamorf: protolith + P+T tinggi (tanpa meleleh) → foliasi, rekristalisasi',
      'Indonesia kaya batubara (Kalimantan), emas-tembaga (Papua), nikel (Sulawesi), batugamping (nasional)',
    ]},
    { type: 'reward', topicTitle: 'Siklus Batuan', xp: 70, message: 'Selamat! Kamu sekarang memahami bagaimana semua batuan di Bumi saling terhubung dalam siklus abadi!', badge: '🪨' },
  ],

  'geo-6': [
    { type: 'hook', emoji: '🔥', title: 'Batuan Beku', subtitle: 'Bab 6 · Geologi Dasar', teaser: 'Di kedalaman Bumi, suhu 700-1300°C melelehkan batuan menjadi magma — cairan panas yang membawa mineral paling berharga di dunia. Saat naik ke permukaan, ia menciptakan pulau, gunung, dan peradaban.', bg: 'from-orange-700 to-red-600' },
    { type: 'objective', items: ['Membedakan magma dan lava serta jenis-jenis magma berdasarkan SiO₂', 'Menjelaskan perbedaan batuan intrusi dan ekstrusi serta teksturnya', 'Memahami Seri Reaksi Bowen dan urutan kristalisasi mineral', 'Mengklasifikasikan batuan beku menggunakan diagram QAPF'] },
    { type: 'concept', title: 'Magma: Asal Muasal Batuan Beku', narrator: 'Magma adalah cairan batuan (silicate melt) yang mengandung gas terlarut dan mineral kristal, tersimpan di kerak dan mantel bumi. Ketika magma keluar ke permukaan, ia disebut lava. Magma terbentuk dari partial melting (pelelehan sebagian) mantel atau kerak bawah, dipicu oleh kenaikan suhu, penurunan tekanan, atau penambahan air.', body: 'Komposisi magma sangat menentukan sifat dan jenisnya:\n• BASALTIK (Mafik, SiO₂ <52%): cair, encer, gas sedikit, letusan efusif (Hawaiian)\n• ANDESIIK (Intermediet, SiO₂ 52-63%): viskositas sedang, letusan Strombolian-Vulkanian\n• RIOLITIK (Felsik, SiO₂ >63%): kental, kaya gas, letusan eksplosif Plinian' },
    { type: 'visual', title: 'Klasifikasi Batuan Beku berdasarkan SiO₂', items: [
      { label: '⚫ Ultramafik (<45% SiO₂)', value: 'Peridotit, Dunit, Komatiit → Mantel Bumi', color: 'bg-gray-700 text-white', icon: '🌑' },
      { label: '🟤 Mafik (45-52% SiO₂)', value: 'Gabro (intrusi) / Basalt (ekstrusi) → Kerak samudera', color: 'bg-stone-200 text-stone-800', icon: '🌊' },
      { label: '🟣 Intermediet (52-63%)', value: 'Diorit (intrusi) / Andesit (ekstrusi) → Busur vulkanik', color: 'bg-purple-100 text-purple-800', icon: '🏔️' },
      { label: '⬜ Felsik (>63% SiO₂)', value: 'Granit (intrusi) / Riolit (ekstrusi) → Kerak benua', color: 'bg-pink-100 text-pink-800', icon: '🗻' },
    ]},
    { type: 'characteristics', title: 'Intrusi vs Ekstrusi — Tekstur & Contoh', points: [
      { icon: '🏔️', text: 'Batuan INTRUSI (Plutonik)', highlight: 'Membeku perlahan DALAM bumi → kristal BESAR (faneritik). Contoh: Granit, Diorit, Gabro, Peridotit' },
      { icon: '🌋', text: 'Batuan EKSTRUSI (Vulkanik)', highlight: 'Membeku cepat di PERMUKAAN → kristal HALUS/GELAS (afanitik/glassy). Contoh: Riolit, Andesit, Basalt, Obsidian' },
      { icon: '🔀', text: 'Batuan HIPABISAL', highlight: 'Intrusi dangkal (dike, sill) → tekstur PORFIRITIK: fenokris besar dalam masa dasar halus. Contoh: Mikrogranit, Diabas' },
      { icon: '💨', text: 'Tekstur VESIKULAR', highlight: 'Gelembung gas terperangkap saat lava membeku cepat → rongga bulat. Contoh: Basal vesikular, Scoria, Pumis (batu apung)' },
    ]},
    { type: 'insight', title: 'Seri Reaksi Bowen — Urutan Kristalisasi', fact: 'N.L. Bowen (1922) menemukan bahwa mineral tidak semua kristalisasi serentak dari magma. Ada URUTAN yang pasti berdasarkan titik lebur: Olivin dan Ca-Plagioklas (pertama, T tinggi) → Piroksen → Amfibol → Biotit → K-Feldspar → Muskovit → Kuarsa (terakhir, T rendah). Ini menjelaskan mengapa granit (kuarsa+feldspar) terbentuk dari magma yang sudah "tua", dan mengapa peridotit (olivin) dari magma segar.', emoji: '🧪' },
    { type: 'diagram', title: 'Diagram QAPF (Streckeisen) — Skema', rows: [
      { left: 'Q > 90%', center: 'Quartzolite', right: 'Hampir murni kuarsa', color: 'bg-blue-50' },
      { left: 'Q=20-60% A>P', center: 'Granite', right: 'Kuarsa+K-feldspar dominan · Kerak benua', color: 'bg-pink-50' },
      { left: 'Q=5-20% A≈P', center: 'Granodiorite', right: 'Transisi granit-diorit · Umum di batholit', color: 'bg-purple-50' },
      { left: 'Q<5% P>A', center: 'Tonalite / Diorite', right: 'Plagioklas dominan · Zona subduksi', color: 'bg-indigo-50' },
      { left: 'Q≈0 Mafik', center: 'Gabbro', right: 'Plagioklas+piroksen · Kerak samudera', color: 'bg-gray-100' },
    ]},
    { type: 'minigame', title: '🎮 Granit atau Basalt?', instruction: 'Pasangkan nama batuan beku dengan karakteristik utamanya!', pairs: [
      { term: 'Granit', def: 'Felsik, kristal besar (faneritik), intrusi dalam' },
      { term: 'Basalt', def: 'Mafik, kristal halus/afanitik, ekstrusi' },
      { term: 'Andesit', def: 'Intermediet, porfiritik, busur vulkanik' },
      { term: 'Obsidian', def: 'Gelas vulkanik, riolit tanpa kristal, hitam' },
    ]},
    { type: 'quiz', question: 'Tekstur faneritik (kristal besar-besar dan terlihat mata) pada granit menunjukkan bahwa batuan ini terbentuk...', options: ['Dari letusan gunung api eksplosif', 'Dari pembekuan lava cepat di permukaan', 'Dari pembekuan magma lambat jauh di dalam bumi', 'Dari metamorfisme batugamping'], correct: 2, explanation: 'Tekstur faneritik = kristal cukup besar untuk terlihat mata telanjang, terbentuk karena magma mendingin SANGAT LAMBAT di kedalaman (ribuan tahun). Semakin lambat pendinginan, semakin besar kristal yang tumbuh. Batuan ekstrusi (basalt) yang mendingin cepat di permukaan memiliki tekstur afanitik (kristal sangat halus, tidak terlihat mata).' },
    { type: 'observation', title: '👁️ Identifikasi Batuan Beku di Lapangan', scenario: 'Kamu menemukan dua batuan: (A) abu-abu gelap, kristal tidak terlihat, padat dan berat, ada rongga kecil-kecil (vesikular). (B) merah muda, kristal besar interlocking (ortoklas merah muda + kuarsa abu bening + mika hitam).', fieldtip: 'JAWABAN: (A) = BASALT VESIKULAR — ekstrusi mafik, afanitik, vesikular = gas terperangkap saat lava membeku cepat. Sangat umum di Indonesia (Jawa, Bali). (B) = GRANIT MERAH (Pink Granite) — intrusi felsik, faneritik, komponen QAPF jelas: ortoklas + kuarsa + biotit. Umum di Bangka-Belitung dan Kalimantan.' },
    { type: 'case', emoji: '🌋', location: 'Jawa · Busur Vulkanik Sunda', title: 'Andesit: Batuan Paling Umum di Indonesia', body: 'Gunung Merapi, Semeru, Bromo, Rinjani — hampir semua gunung api Indonesia menghasilkan batuan ANDESIT. Mengapa? Karena zona subduksi Indo-Australia menghasilkan magma intermediet yang kaya air dan volatil. Andesit (52-63% SiO₂) memiliki viskositas sedang → cukup kental untuk menampung gas → letusan eksplosif Merapi yang fenomenal. Lebih dari 65% batuan erupsi gunung api Indonesia adalah andesit dan dasit.', takeaway: 'Andesit = identitas batuan vulkanik Indonesia. Nama "andesit" sendiri berasal dari Andes, Amerika Selatan — keduanya adalah zona subduksi aktif!' },
    { type: 'summary', title: 'Ringkasan Bab 6', points: [
      'Magma = silicate melt; lava = magma di permukaan. Jenis: basaltik/mafik, andesitik/intermediet, riolitik/felsik',
      'Intrusi (plutonik): membeku lambat di dalam → faneritik (kristal besar). Contoh: granit, diorit, gabro',
      'Ekstrusi (vulkanik): membeku cepat di permukaan → afanitik/glassy. Contoh: basalt, andesit, riolit',
      'Seri Bowen: olivin → piroksen → amfibol → biotit → K-feldspar → kuarsa (urutan kristalisasi dari T tinggi ke rendah)',
      'QAPF (Streckeisen): klasifikasi berdasarkan % Quartz-Alkali feldspar-Plagioklas-Feldspathoid',
    ]},
    { type: 'reward', topicTitle: 'Batuan Beku', xp: 85, message: 'LUAR BIASA! Kamu telah menyelesaikan seluruh kursus Geologi Dasar! Selamat, GeoMaster!', badge: '🔥' },
  ],
};

// ── Mini Game Component ────────────────────────────────────────────────────────
function MinigameSlide({ slide, onComplete }: {
  slide: Extract<Slide, { type: 'minigame' }>;
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const shuffledDefs = useRef(
    [...slide.pairs].map(p => p.def).sort(() => Math.random() - 0.5)
  ).current;

  const allMatched = Object.keys(matched).length === slide.pairs.length;

  const handleTermClick = (term: string) => {
    if (matched[term]) return;
    setSelected(selected === term ? null : term);
    setWrong(null);
  };

  const handleDefClick = (def: string) => {
    if (!selected) return;
    const correct = slide.pairs.find(p => p.term === selected)?.def === def;
    if (correct) {
      setMatched(prev => ({ ...prev, [selected]: def }));
      setScore(s => s + 1);
      setSelected(null);
    } else {
      setWrong(def);
      setTimeout(() => { setWrong(null); setSelected(null); }, 900);
    }
  };

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      <div className="text-center">
        <p className="text-xl font-black text-gray-800">{slide.title}</p>
        <p className="text-sm text-gray-500 mt-1">{slide.instruction}</p>
        <p className="text-xs text-orange-600 font-bold mt-1">✓ {score}/{slide.pairs.length} pasangan benar</p>
      </div>

      {allMatched ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-6xl">🎉</div>
          <p className="text-2xl font-black text-green-600">Sempurna!</p>
          <p className="text-gray-500 text-sm">Semua pasangan berhasil dicocokkan!</p>
          <button
            onClick={onComplete}
            className="bg-green-500 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform"
          >
            Lanjut →
          </button>
        </div>
      ) : (
        <div className="flex-1 flex gap-3">
          {/* Terms column */}
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs font-black text-gray-400 uppercase text-center mb-1">ISTILAH</p>
            {slide.pairs.map(p => {
              const isMatched = !!matched[p.term];
              const isSelected = selected === p.term;
              return (
                <button
                  key={p.term}
                  onClick={() => handleTermClick(p.term)}
                  disabled={isMatched}
                  className={`rounded-xl p-2.5 text-xs font-bold text-left transition-all ${
                    isMatched ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                    isSelected ? 'bg-orange-100 text-orange-700 border-2 border-orange-400 scale-105' :
                    'bg-gray-100 text-gray-700 border-2 border-transparent active:scale-95'
                  }`}
                >
                  {isMatched ? '✓ ' : ''}{p.term}
                </button>
              );
            })}
          </div>

          {/* Defs column */}
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs font-black text-gray-400 uppercase text-center mb-1">DEFINISI</p>
            {shuffledDefs.map(def => {
              const isMatched = Object.values(matched).includes(def);
              const isWrong = wrong === def;
              return (
                <button
                  key={def}
                  onClick={() => handleDefClick(def)}
                  disabled={isMatched}
                  className={`rounded-xl p-2.5 text-xs font-semibold text-left transition-all leading-tight ${
                    isMatched ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                    isWrong ? 'bg-red-100 text-red-700 border-2 border-red-400 scale-95' :
                    selected ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 active:scale-95' :
                    'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  {def}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quiz Component ─────────────────────────────────────────────────────────────
function QuizSlide({ slide, onComplete }: {
  slide: Extract<Slide, { type: 'quiz' }>;
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === slide.correct;

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <p className="text-xs font-black text-orange-500 uppercase mb-2">❓ KUIS</p>
        <p className="text-gray-800 font-bold text-sm leading-relaxed">{slide.question}</p>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {slide.options.map((opt, i) => {
          let cls = 'bg-white border-2 border-gray-200 text-gray-700';
          if (answered) {
            if (i === slide.correct) cls = 'bg-green-100 border-2 border-green-400 text-green-800';
            else if (i === selected) cls = 'bg-red-100 border-2 border-red-400 text-red-700 line-through';
            else cls = 'bg-gray-50 border-2 border-gray-100 text-gray-400';
          } else if (selected === i) {
            cls = 'bg-orange-100 border-2 border-orange-400 text-orange-800';
          }
          return (
            <button
              key={i}
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
              className={`${cls} rounded-xl p-3.5 text-left text-sm font-semibold transition-all active:scale-[0.98]`}
            >
              <span className="mr-2 font-black">{['A', 'B', 'C', 'D'][i]}.</span>{opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`rounded-2xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm font-black mb-1 ${isCorrect ? 'text-green-700' : 'text-blue-700'}`}>
            {isCorrect ? '🎉 Benar!' : '💡 Penjelasan:'}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">{slide.explanation}</p>
          <button
            onClick={onComplete}
            className="mt-3 w-full bg-gray-800 text-white rounded-xl py-2.5 text-sm font-black active:scale-95 transition-transform"
          >
            Lanjut →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Reward Component ──────────────────────────────────────────────────────────
function RewardSlide({ slide, onFinish }: {
  slide: Extract<Slide, { type: 'reward' }>;
  onFinish: () => void;
}) {
  return (
    <div className="flex flex-col h-full items-center justify-center p-6 gap-5 text-center">
      <div className="relative">
        <div className="text-8xl mb-2 animate-bounce">{slide.badge}</div>
        <div className="absolute -top-2 -right-2 text-3xl animate-spin" style={{ animationDuration: '3s' }}>⭐</div>
      </div>
      <div>
        <p className="text-3xl font-black text-yellow-500">+{slide.xp} XP</p>
        <p className="text-xl font-black text-gray-800 mt-1">{slide.topicTitle}</p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs">{slide.message}</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center text-2xl">
        {['🌟', '✨', '💫', '🎊', '🏆'].map((e, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
        ))}
      </div>
      <button
        onClick={onFinish}
        className="bg-gradient-to-r from-orange-500 to-amber-400 text-white px-10 py-4 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-transform"
      >
        Kembali ke Daftar Topik
      </button>
    </div>
  );
}

// ── Slide Renderer ─────────────────────────────────────────────────────────────
function SlideContent({ slide, onNext, onMinigameComplete, onQuizComplete, onRewardFinish }: {
  slide: Slide;
  onNext: () => void;
  onMinigameComplete: () => void;
  onQuizComplete: () => void;
  onRewardFinish: () => void;
}) {
  switch (slide.type) {
    case 'hook':
      return (
        <div className={`flex flex-col h-full bg-gradient-to-br ${slide.bg} text-white p-7 items-center justify-center text-center gap-5`}>
          <div className="text-8xl">{slide.emoji}</div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/70 mb-2">{slide.subtitle}</p>
            <h1 className="text-3xl font-black leading-tight">{slide.title}</h1>
          </div>
          <p className="text-white/85 text-sm leading-relaxed max-w-xs italic">"{slide.teaser}"</p>
          <button
            onClick={onNext}
            className="mt-4 bg-white/20 border border-white/40 text-white px-8 py-3 rounded-2xl font-black text-sm backdrop-blur-sm active:scale-95 transition-transform"
          >
            Mulai Belajar →
          </button>
        </div>
      );

    case 'objective':
      return (
        <div className="flex flex-col h-full p-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-black text-sm">🎯</span>
            </div>
            <p className="font-black text-gray-800">Tujuan Pembelajaran</p>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {slide.items.map((item, i) => (
              <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-black text-xs">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Lanjut →
          </button>
        </div>
      );

    case 'concept':
      return (
        <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
          <p className="font-black text-gray-800 text-lg">{slide.title}</p>
          {/* Visual novel narrator */}
          <div className="flex gap-3 bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl">🤓</div>
            <div>
              <p className="text-xs font-black text-blue-500 mb-1">Dr. Geo berkata:</p>
              <p className="text-sm text-blue-800 italic leading-relaxed">"{slide.narrator}"</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex-1">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{slide.body}</p>
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Pahami →
          </button>
        </div>
      );

    case 'visual':
      return (
        <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
          <p className="font-black text-gray-800">{slide.title}</p>
          <div className="flex flex-col gap-3 flex-1">
            {slide.items.map((item, i) => (
              <div key={i} className={`${item.color} rounded-2xl p-4 flex gap-3 items-start`}>
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-black text-sm">{item.label}</p>
                  <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Lanjut →
          </button>
        </div>
      );

    case 'characteristics':
      return (
        <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
          <p className="font-black text-gray-800">{slide.title}</p>
          <div className="flex flex-col gap-2.5 flex-1">
            {slide.points.map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 flex gap-3">
                <span className="text-xl flex-shrink-0">{p.icon}</span>
                <div>
                  <p className="font-black text-gray-800 text-sm">{p.text}</p>
                  {p.highlight && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.highlight}</p>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Lanjut →
          </button>
        </div>
      );

    case 'insight':
      return (
        <div className="flex flex-col h-full p-5 gap-4 justify-center">
          <div className="text-center">
            <span className="text-5xl">{slide.emoji}</span>
            <p className="text-xs font-black text-amber-500 uppercase tracking-widest mt-3 mb-2">💡 TAHUKAH KAMU?</p>
            <p className="font-black text-gray-800 text-base">{slide.title}</p>
          </div>
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{slide.fact}</p>
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Keren! Lanjut →
          </button>
        </div>
      );

    case 'diagram':
      return (
        <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
          <p className="font-black text-gray-800">{slide.title}</p>
          <div className="flex flex-col gap-2 flex-1">
            {slide.rows.map((row, i) => (
              <div key={i} className={`${row.color} rounded-xl p-3 flex items-center gap-3 border`}>
                <div className="text-xs font-black text-gray-600 w-20 flex-shrink-0 leading-tight">{row.left}</div>
                <div className="text-gray-400 font-black flex-shrink-0">{row.center}</div>
                <div className="text-xs text-gray-700 flex-1 leading-relaxed">{row.right}</div>
              </div>
            ))}
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Lanjut →
          </button>
        </div>
      );

    case 'minigame':
      return <MinigameSlide slide={slide} onComplete={onMinigameComplete} />;

    case 'quiz':
      return <QuizSlide slide={slide} onComplete={onQuizComplete} />;

    case 'observation':
      return (
        <div className="flex flex-col h-full p-5 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👁️</span>
            <p className="font-black text-gray-800">{slide.title}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-black text-blue-500 uppercase mb-2">SKENARIO LAPANGAN</p>
            <p className="text-sm text-blue-800 leading-relaxed">{slide.scenario}</p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-400 rounded-r-2xl p-4 flex-1">
            <p className="text-xs font-black text-green-600 uppercase mb-1">🏔️ TIPS LAPANGAN</p>
            <p className="text-sm text-gray-700 leading-relaxed">{slide.fieldtip}</p>
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Siap! Lanjut →
          </button>
        </div>
      );

    case 'case':
      return (
        <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{slide.emoji}</span>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase">{slide.location}</p>
              <p className="font-black text-gray-800 text-sm leading-tight">{slide.title}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex-1">
            <p className="text-xs font-black text-gray-400 uppercase mb-2">📍 STUDI KASUS INDONESIA</p>
            <p className="text-sm text-gray-700 leading-relaxed">{slide.body}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5">
            <p className="text-xs font-black text-orange-600 uppercase mb-1">💡 Pelajaran</p>
            <p className="text-sm text-gray-700 leading-relaxed">{slide.takeaway}</p>
          </div>
          <button onClick={onNext} className="bg-gray-800 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform">
            Lanjut →
          </button>
        </div>
      );

    case 'summary':
      return (
        <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
            <p className="font-black text-gray-800">{slide.title}</p>
          </div>
          <div className="flex flex-col gap-2.5 flex-1">
            {slide.points.map((p, i) => (
              <div key={i} className="flex gap-3 bg-green-50 rounded-xl p-3.5 border border-green-100">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-black">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
          <button onClick={onNext} className="bg-gradient-to-r from-orange-500 to-amber-400 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform shadow-md">
            🎉 Selesai! →
          </button>
        </div>
      );

    case 'reward':
      return <RewardSlide slide={slide} onFinish={onRewardFinish} />;

    default:
      return null;
  }
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function GeonovaLessonPage() {
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const topic = GEO_TOPICS.find(t => t.id === topicId);
  const slides = topicId ? LESSONS[topicId] : null;

  useEffect(() => { window.scrollTo(0, 0); }, [topicId]);

  const markComplete = useCallback(() => {
    if (!topicId) return;
    try {
      const existing = new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
      existing.add(topicId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
    } catch { /* ignore */ }
  }, [topicId]);

  if (!slides || !topic) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-6 text-center">
        <div>
          <p className="text-4xl mb-3">🤷</p>
          <p className="font-black text-gray-700">Materi tidak ditemukan</p>
          <button onClick={() => navigate('/app/geonova/learning')} className="mt-4 text-orange-600 font-bold text-sm">
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;
  const canGoBack = currentSlide > 0 && slide.type !== 'reward';
  const isInteractive = slide.type === 'minigame' || slide.type === 'quiz';

  const goNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(i => i + 1);
  };
  const goPrev = () => {
    if (canGoBack) setCurrentSlide(i => i - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isInteractive) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goNext(); else goPrev();
    }
  };

  const handleRewardFinish = () => {
    markComplete();
    navigate('/app/geonova/learning');
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className={`bg-gradient-to-r ${topic.gradient} px-4 pt-5 pb-4`}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/app/geonova/learning')}
            className="p-2 bg-white/20 rounded-xl text-white flex-shrink-0"
          >
            <X size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm truncate">{topic.title}</p>
            <p className="text-white/70 text-xs">Slide {currentSlide + 1} dari {slides.length}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
            <Star size={12} className="text-yellow-300" />
            <span className="text-white text-xs font-black">+{topic.xp} XP</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="bg-white/30 rounded-full h-1.5">
          <div className="bg-white h-1.5 rounded-full transition-all duration-400" style={{ width: `${progress}%` }} />
        </div>
        {/* Slide dots */}
        <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-shrink-0 transition-all ${
                i === currentSlide ? 'bg-white w-4' :
                i < currentSlide ? 'bg-white/60 w-2' :
                'bg-white/30 w-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide content */}
      <div
        className="flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-full">
          <SlideContent
            slide={slide}
            onNext={goNext}
            onMinigameComplete={goNext}
            onQuizComplete={goNext}
            onRewardFinish={handleRewardFinish}
          />
        </div>
      </div>

      {/* Bottom nav (only for non-interactive non-reward slides) */}
      {!isInteractive && slide.type !== 'reward' && slide.type !== 'hook' && (
        <div className="px-4 pb-6 pt-2 flex gap-3">
          <button
            onClick={goPrev}
            disabled={!canGoBack}
            className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 disabled:opacity-30 active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={goNext}
            disabled={currentSlide >= slides.length - 1}
            className="flex-1 h-12 bg-gray-800 rounded-xl flex items-center justify-center gap-2 text-white font-black text-sm disabled:opacity-30 active:scale-95 transition-transform"
          >
            <span>Swipe atau tekan lanjut</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
