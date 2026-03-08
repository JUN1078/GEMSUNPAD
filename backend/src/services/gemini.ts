import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Model Fallback Chain ──────────────────────────────────────────────────────
// Tries each model in order; skips on quota (429) or not-found (404) errors.
const FREE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

async function withFallback<T>(fn: (model: GenerativeModel) => Promise<T>): Promise<T> {
  let lastError: any;
  for (const name of FREE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await fn(model);
      return result;
    } catch (err: any) {
      const msg = String(err?.message ?? '');
      const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      const isNotFound = msg.includes('404') || msg.includes('not found') || msg.includes('fetch failed');
      if (isQuota || isNotFound) {
        console.warn(`[Gemini] Model "${name}" unavailable (${isQuota ? 'quota' : 'not found'}), trying next...`);
        lastError = err;
        continue;
      }
      throw err; // Other errors: fail immediately
    }
  }
  throw new Error(`All Gemini models unavailable. Last error: ${lastError?.message}`);
}

// ── Helper: parse JSON from model response ────────────────────────────────────
function parseJSON(text: string) {
  const match = text.trim().match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid AI response format');
  return JSON.parse(match[0]);
}

// ── Helper: prepare image data ────────────────────────────────────────────────
function prepareImage(imagePath: string) {
  const imageData = fs.readFileSync(path.resolve(imagePath));
  const base64 = imageData.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return { base64, mimeType };
}

// ── Hazard Image Analysis ─────────────────────────────────────────────────────
export async function analyzeHazardImage(imagePath: string, userDescription: string) {
  const { base64, mimeType } = prepareImage(imagePath);
  const prompt = `Kamu adalah AI Safety Expert untuk kegiatan lapangan Teknik Geologi. Analisis gambar bahaya K3 ini.
Konteks dari pelapor: "${userDescription}"

Berikan respons HANYA dalam format JSON valid berikut (tanpa markdown/backtick):
{
  "category": "salah satu dari: Bahaya Fisik | Bahaya Kimia | Bahaya Biologi | Bahaya Ergonomi | Bahaya Psikososial | Bahaya Mekanik | Bahaya Elektrik | Kondisi Tidak Aman | Tindakan Tidak Aman",
  "risk_level": "Low | Medium | High | Critical",
  "hazard_description": "deskripsi bahaya yang teridentifikasi dalam gambar (2-3 kalimat dalam Bahasa Indonesia)",
  "immediate_action": "tindakan segera yang harus dilakukan (1-2 kalimat)",
  "control_recommendation": "rekomendasi pengendalian jangka panjang menggunakan hierarchy of controls (2-4 poin)",
  "regulation_reference": "referensi peraturan K3 yang relevan (UU/PP/Permenaker)",
  "ppe_required": ["daftar", "APD", "yang", "dibutuhkan"]
}`;

  return withFallback(async (model) => {
    const result = await model.generateContent([{ inlineData: { mimeType, data: base64 } }, prompt]);
    return parseJSON(result.response.text());
  });
}

// ── JSA Generation ────────────────────────────────────────────────────────────
export async function generateJSA(input: {
  title: string; location: string; work_date: string;
  responsible_person: string; tools_equipment: string; description: string;
}) {
  const prompt = `Kamu adalah AI Safety Expert untuk kegiatan Teknik Geologi Universitas Padjadjaran.
Buat Job Safety Analysis (JSA) lengkap berdasarkan data berikut:

Judul Pekerjaan: ${input.title}
Lokasi: ${input.location}
Tanggal: ${input.work_date}
Penanggung Jawab: ${input.responsible_person}
Alat/Peralatan: ${input.tools_equipment}
Deskripsi Pekerjaan: ${input.description}

Berikan respons HANYA dalam format JSON valid (tanpa markdown):
{
  "steps": [
    {
      "step_number": 1,
      "step_description": "langkah kerja",
      "hazards": ["bahaya 1", "bahaya 2"],
      "risk_level": "Low | Medium | High | Critical",
      "likelihood": 1-5,
      "severity": 1-5,
      "risk_score": number,
      "controls": {
        "elimination": "...",
        "substitution": "...",
        "engineering": "...",
        "administrative": "...",
        "ppe": ["APD 1", "APD 2"]
      }
    }
  ],
  "general_ppe": ["APD umum yang wajib dipakai"],
  "emergency_contacts": ["Koordinator HSE", "Unit K3 Unpad", "IGD RS terdekat"],
  "approval_notes": "Catatan persetujuan JSA"
}`;

  return withFallback(async (model) => {
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  });
}

// ── MoM Summarization ─────────────────────────────────────────────────────────
export async function summarizeMoM(rawNotes: string) {
  const prompt = `Ringkas notulen rapat K3 berikut ke dalam format terstruktur. Berikan JSON valid:
{
  "summary_points": ["poin utama 1", "poin utama 2"],
  "decisions": ["keputusan 1", "keputusan 2"],
  "action_items": [
    {"task": "tugas", "pic": "PIC jika disebutkan", "deadline": "deadline jika ada"}
  ],
  "next_meeting_agenda": ["saran agenda rapat berikutnya"]
}

Notulen:
${rawNotes}`;

  return withFallback(async (model) => {
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  });
}

// ── Geonova: Image Analysis ───────────────────────────────────────────────────
async function analyzeImageWithGemini(imagePath: string, prompt: string) {
  const { base64, mimeType } = prepareImage(imagePath);
  return withFallback(async (model) => {
    const result = await model.generateContent([{ inlineData: { mimeType, data: base64 } }, prompt]);
    return parseJSON(result.response.text());
  });
}

export async function analyzeRockImage(imagePath: string, context = '') {
  return analyzeImageWithGemini(imagePath, `You are an expert geologist and petrologist at Universitas Padjadjaran. Analyze this rock specimen image.
${context ? `Additional context: "${context}"` : ''}

Respond ONLY in valid JSON (no markdown):
{
  "rock_type": "specific rock name (e.g., Sandstone, Granite, Basalt, Limestone, Marble, Quartzite, Coal, Andesite, etc.)",
  "rock_class": "Igneous | Sedimentary | Metamorphic",
  "confidence": 0-100,
  "color": "fresh color and weathered color",
  "texture": "grain size, crystallinity, fabric description",
  "mineral_composition": ["mineral1 (%)","mineral2 (%)"],
  "structure": "massive | foliated | banded | etc.",
  "grain_size": "coarse | medium | fine | very fine | glassy",
  "sorting": "well sorted | moderately sorted | poorly sorted | N/A",
  "formation_process": "how this rock formed (2-3 sentences)",
  "geological_setting": "typical geological environment where this rock is found",
  "economic_significance": "any economic or engineering importance",
  "field_notes": "key field identification features"
}`);
}

export async function analyzePetrographicImage(imagePath: string, context = '') {
  return analyzeImageWithGemini(imagePath, `You are an expert petrographer and mineralogist. Analyze this thin section image under polarized light microscope.
${context ? `Context: "${context}"` : ''}

Respond ONLY in valid JSON (no markdown):
{
  "rock_type": "petrographic rock name",
  "rock_class": "Igneous | Sedimentary | Metamorphic",
  "minerals": [
    {"name": "mineral name", "percentage": 0-100, "optical_properties": "color, pleochroism, cleavage, extinction angle"}
  ],
  "texture": "porphyritic | granular | foliated | ophitic | etc.",
  "fabric": "isotropic | anisotropic | preferred orientation",
  "alteration": "fresh | slightly altered | moderately altered | highly altered",
  "alteration_products": ["secondary mineral 1", "secondary mineral 2"],
  "grain_size_mm": "average grain size in mm",
  "classification": "QAPF classification or Folk/Dunham classification",
  "diagenesis": "diagenetic features observed (for sedimentary rocks)",
  "petrogenesis": "interpretation of rock origin and history (2-3 sentences)",
  "confidence": 0-100
}`);
}

export async function analyzeFossilImage(imagePath: string, context = '') {
  return analyzeImageWithGemini(imagePath, `You are an expert paleontologist and biostratigrapher. Analyze this fossil specimen image.
${context ? `Context: "${context}"` : ''}

Respond ONLY in valid JSON (no markdown):
{
  "fossil_type": "specific fossil name or group",
  "kingdom": "Animalia | Plantae | Protista | Unknown",
  "phylum": "phylum name",
  "class": "class name",
  "order_family": "order/family if identifiable",
  "confidence": 0-100,
  "preservation": "excellent | good | moderate | poor",
  "preservation_type": "body fossil | trace fossil | mold | cast | permineralized | etc.",
  "estimated_age": "geological age (e.g., Jurassic, Cretaceous 65-145 Ma)",
  "stratigraphic_range": "range from - to (geological periods)",
  "paleoenvironment": "marine shallow water | deep marine | terrestrial | freshwater | etc.",
  "paleoecology": "feeding strategy, habitat, lifestyle (2-3 sentences)",
  "biostratigraphic_value": "index fossil | zone fossil | facies fossil | limited value",
  "key_features": ["observable feature 1", "observable feature 2"],
  "similar_taxa": ["potentially confused with 1", "potentially confused with 2"]
}`);
}

export async function aiEnhanceFieldDescription(rawDescription: string, rockType = '') {
  const prompt = `You are an expert field geologist. Enhance this raw field description into proper geological terminology.

Raw description: "${rawDescription}"
${rockType ? `Rock type: ${rockType}` : ''}

Respond ONLY in valid JSON (no markdown):
{
  "enhanced_description": "Professional geological description in Indonesian (3-5 sentences covering color, texture, mineral composition, structure, degree of weathering)",
  "rock_name_suggestion": "suggested rock name based on description",
  "structure_features": ["identified structure 1", "identified structure 2"],
  "suggested_ppe": ["safety equipment needed for this outcrop"],
  "hazard_notes": "any geological hazards to note at this outcrop"
}`;

  return withFallback(async (model) => {
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  });
}

export async function suggestSafetyMomentTopic(recentHazards: string[]) {
  const prompt = `Berdasarkan bahaya K3 yang baru-baru ini dilaporkan di kampus Geologi Unpad:
${recentHazards.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Berikan JSON saran topik safety moment (dalam Bahasa Indonesia):
{
  "suggested_topics": [
    {
      "title": "Judul topik safety moment",
      "reason": "Alasan mengapa topik ini relevan",
      "key_points": ["poin materi 1", "poin materi 2", "poin materi 3"],
      "duration_minutes": 5
    }
  ]
}`;

  return withFallback(async (model) => {
    const result = await model.generateContent(prompt);
    try { return parseJSON(result.response.text()); }
    catch { return { suggested_topics: [] }; }
  });
}
