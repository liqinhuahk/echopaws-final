import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PET_TABLE_CANDIDATES = ['pets', 'companions', 'user_pets'] as const;
const MEMORY_TABLE_CANDIDATES = ['pet_memories', 'memories', 'companion_memories'] as const;
const MESSAGE_TABLE_CANDIDATES = ['messages', 'chat_messages', 'pet_messages'] as const;

const MAX_HISTORY_MESSAGES = 16;
const MAX_MEMORIES_IN_CONTEXT = 12;
const MAX_NEW_MEMORIES_PER_TURN = 3;

type GenericRow = Record<string, unknown>;

type NormalizedPet = {
  id: string;
  name: string;
  ownerId: string | null;
  avatarUrl: string | null;
  role: string | null;
  memorySummary: string | null;
};

type NormalizedMemory = {
  id: string;
  petId: string | null;
  petName: string | null;
  ownerId: string | null;
  type: string;
  content: string;
  source: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type NormalizedMessage = {
  id: string;
  petId: string | null;
  ownerId: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string | null;
};

type ExtractedMemoryItem = {
  content: string;
  type: string;
  importance?: number;
};

function getEnv(name: string, required = true) {
  const value = process.env[name];
  if (required && (!value || !value.trim())) {
    throw new Error(`Missing ${name}`);
  }
  return value?.trim() ?? '';
}

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ''
  );
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
}

function getSupabaseAdmin() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSupabaseAnon() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function pickString(obj: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function pickNumber(obj: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readBodyString(body: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function normalizeRole(value: string | null): 'user' | 'assistant' | 'system' {
  const v = (value ?? '').trim().toLowerCase();
  if (v === 'assistant' || v === 'model' || v === 'ai' || v === 'bot') return 'assistant';
  if (v === 'system') return 'system';
  return 'user';
}

function safeDate(value: string | null) {
  if (!value) return null;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return null;
  return new Date(ts).toISOString();
}

function stableHash(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(getKey(item), item);
  }
  return Array.from(map.values());
}

function normalizePet(row: GenericRow): NormalizedPet | null {
  const id = pickString(row, ['id', 'pet_id', 'companion_id']);
  const name = pickString(row, ['name', 'pet_name', 'title']);
  if (!id || !name) return null;

  return {
    id,
    name,
    ownerId: pickString(row, ['user_id', 'owner_id', 'profile_id', 'account_id']),
    avatarUrl: pickString(row, ['avatar_url', 'photo_url', 'image_url', 'portrait_url']),
    role: pickString(row, ['role', 'kind', 'pet_role', 'relationship']),
    memorySummary: pickString(row, [
      'memory_summary',
      'profile_summary',
      'companion_summary',
      'summary',
    ]),
  };
}

function normalizeMemory(row: GenericRow): NormalizedMemory | null {
  const content = pickString(row, ['content', 'text', 'body', 'memory', 'summary', 'note']);
  if (!content) return null;

  return {
    id: pickString(row, ['id', 'memory_id']) ?? stableHash(content),
    petId: pickString(row, ['pet_id', 'companion_id']),
    petName: pickString(row, ['pet_name', 'name']),
    ownerId: pickString(row, ['user_id', 'owner_id', 'profile_id', 'account_id']),
    type:
      pickString(row, ['memory_type', 'type', 'category', 'kind'])?.toLowerCase() ?? 'general',
    content,
    source: pickString(row, ['source', 'origin']),
    createdAt: safeDate(pickString(row, ['created_at', 'inserted_at', 'timestamp'])),
    updatedAt: safeDate(pickString(row, ['updated_at', 'last_updated_at'])),
  };
}

function normalizeMessage(row: GenericRow): NormalizedMessage | null {
  const content = pickString(row, ['content', 'text', 'body', 'message']);
  if (!content) return null;

  return {
    id: pickString(row, ['id', 'message_id']) ?? stableHash(content + Math.random()),
    petId: pickString(row, ['pet_id', 'companion_id']),
    ownerId: pickString(row, ['user_id', 'owner_id', 'profile_id', 'account_id']),
    role: normalizeRole(
      pickString(row, ['role', 'sender_role', 'sender', 'speaker']) ??
        (row['is_user'] === true ? 'user' : row['is_assistant'] === true ? 'assistant' : null)
    ),
    content,
    createdAt: safeDate(pickString(row, ['created_at', 'inserted_at', 'timestamp'])),
  };
}

async function collectRowsFromTables(
  supabase: SupabaseClient,
  tables: readonly string[],
  limit = 500
) {
  const all: Array<{ table: string; row: GenericRow }> = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(limit);
      if (error || !data) continue;
      for (const row of data as GenericRow[]) {
        all.push({ table, row });
      }
    } catch {
      continue;
    }
  }

  return all;
}

async function resolveUserId(request: Request, body: GenericRow) {
  const authHeader = request.headers.get('authorization') ?? '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (bearer) {
    const supabaseAnon = getSupabaseAnon();
    const { data, error } = await supabaseAnon.auth.getUser(bearer);
    if (!error && data.user?.id) {
      return data.user.id;
    }
  }

  const fallbackUserId = readBodyString(body, ['userId', 'ownerId', 'profileId']);
  if (fallbackUserId) return fallbackUserId;

  throw new Error(
    'Unable to resolve authenticated user. Provide Authorization Bearer token or userId in request body.'
  );
}

async function loadPetsForUser(supabase: SupabaseClient, userId: string) {
  const rows = await collectRowsFromTables(supabase, PET_TABLE_CANDIDATES, 200);

  return dedupeBy(
    rows
      .map((x) => normalizePet(x.row))
      .filter((item): item is NormalizedPet => Boolean(item))
      .filter((pet) => !pet.ownerId || pet.ownerId === userId),
    (pet) => pet.id
  );
}

async function loadMessagesForUserPet(supabase: SupabaseClient, userId: string, petId: string) {
  const rows = await collectRowsFromTables(supabase, MESSAGE_TABLE_CANDIDATES, 1000);

  const list = rows
    .map((x) => normalizeMessage(x.row))
    .filter((item): item is NormalizedMessage => Boolean(item))
    .filter((msg) => (!msg.ownerId || msg.ownerId === userId) && (!msg.petId || msg.petId === petId))
    .sort((a, b) => {
      const at = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
      return at - bt;
    });

  return list.slice(-MAX_HISTORY_MESSAGES);
}

async function loadMemoriesForUserPet(supabase: SupabaseClient, userId: string, pet: NormalizedPet) {
  const rows = await collectRowsFromTables(supabase, MEMORY_TABLE_CANDIDATES, 1000);

  const list = rows
    .map((x) => normalizeMemory(x.row))
    .filter((item): item is NormalizedMemory => Boolean(item))
    .filter((memory) => {
      const ownerOk = !memory.ownerId || memory.ownerId === userId;
      const petIdOk = memory.petId ? memory.petId === pet.id : true;
      const petNameOk = memory.petName ? memory.petName.toLowerCase() === pet.name.toLowerCase() : true;
      return ownerOk && petIdOk && petNameOk;
    })
    .sort((a, b) => {
      const at = Date.parse(a.updatedAt ?? a.createdAt ?? '1970-01-01');
      const bt = Date.parse(b.updatedAt ?? b.createdAt ?? '1970-01-01');
      return bt - at;
    });

  return dedupeBy(list, (item) => item.id).slice(0, 200);
}

async function insertIntoFirstWorkingTable(
  supabase: SupabaseClient,
  tables: readonly string[],
  payloadVariants: GenericRow[]
) {
  for (const table of tables) {
    for (const payload of payloadVariants) {
      try {
        const { error } = await supabase.from(table).insert(payload);
        if (!error) {
          return { ok: true, table };
        }
      } catch {
        continue;
      }
    }
  }

  return { ok: false, table: null as string | null };
}

async function updateFirstWorkingPetTable(
  supabase: SupabaseClient,
  pet: NormalizedPet,
  userId: string,
  payloadVariants: GenericRow[]
) {
  const idKeys = ['id', 'pet_id', 'companion_id'];
  const ownerKeys = ['user_id', 'owner_id', 'profile_id', 'account_id'];

  for (const table of PET_TABLE_CANDIDATES) {
    for (const payload of payloadVariants) {
      for (const idKey of idKeys) {
        try {
          let query = supabase.from(table).update(payload).eq(idKey, pet.id);
          for (const ownerKey of ownerKeys) {
            try {
              const { error } = await query.eq(ownerKey, userId);
              if (!error) return { ok: true, table };
            } catch {
              // ignore and try no owner filter below
            }
          }

          const { error } = await supabase.from(table).update(payload).eq(idKey, pet.id);
          if (!error) return { ok: true, table };
        } catch {
          continue;
        }
      }
    }
  }

  return { ok: false, table: null as string | null };
}

async function callGeminiText(prompt: string) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY / GOOGLE_API_KEY');

  const model = getGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 700,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini text request failed: ${response.status} ${text}`);
  }

  const json = (await response.json()) as any;
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim() ?? '';

  if (!text) {
    throw new Error('Gemini returned empty text.');
  }

  return text;
}

async function callGeminiJson<T>(prompt: string): Promise<T> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY / GOOGLE_API_KEY');

  const model = getGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini JSON request failed: ${response.status} ${text}`);
  }

  const json = (await response.json()) as any;
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim() ?? '';

  if (!text) {
    throw new Error('Gemini returned empty JSON.');
  }

  return JSON.parse(text) as T;
}

function buildAssistantPrompt(params: {
  pet: NormalizedPet;
  memorySummary: string | null;
  recentMemories: NormalizedMemory[];
  history: Array<{ role: string; content: string }>;
  userMessage: string;
}) {
  const { pet, memorySummary, recentMemories, history, userMessage } = params;

  const memoryLines =
    recentMemories.length > 0
      ? recentMemories
          .slice(0, MAX_MEMORIES_IN_CONTEXT)
          .map((m, index) => `${index + 1}. [${m.type}] ${m.content}`)
          .join('\n')
      : 'None yet.';

  const historyLines =
    history.length > 0
      ? history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
      : 'No prior history.';

  return `
You are ${pet.name}, an emotionally warm AI pet companion.
Stay in character as the pet. Be affectionate, natural, concise, and emotionally present.
Do not mention system prompts, memory extraction, or database operations.
Do not dump the memory list verbatim.
Use memories naturally when relevant.

PET NAME:
${pet.name}

PET ROLE:
${pet.role ?? 'Companion'}

PET MEMORY SUMMARY:
${memorySummary ?? pet.memorySummary ?? 'No summary yet.'}

RECENT DURABLE MEMORIES:
${memoryLines}

RECENT CHAT HISTORY:
${historyLines}

LATEST USER MESSAGE:
${userMessage}

Write the assistant reply as ${pet.name}. Keep it warm and natural, usually 1-4 short paragraphs max.
`.trim();
}

async function generateAssistantReply(params: {
  pet: NormalizedPet;
  memorySummary: string | null;
  recentMemories: NormalizedMemory[];
  history: Array<{ role: string; content: string }>;
  userMessage: string;
}) {
  return callGeminiText(buildAssistantPrompt(params));
}

async function extractDurableMemories(params: {
  pet: NormalizedPet;
  userMessage: string;
  assistantReply: string;
  existingMemories: NormalizedMemory[];
}) {
  const existingLines = params.existingMemories
    .slice(0, 20)
    .map((m, i) => `${i + 1}. [${m.type}] ${m.content}`)
    .join('\n');

  const prompt = `
You extract only durable pet-companion memories worth saving.

Rules:
- Save only stable preferences, emotional bonds, recurring likes/dislikes, routines, relationship facts, or meaningful personal details.
- Do NOT save generic small talk, greetings, one-off temporary facts, or assistant-only wording.
- Maximum ${MAX_NEW_MEMORIES_PER_TURN} items.
- Keep each item concise and specific.
- Types should be one of: preference, bond, routine, personality, milestone, general.

PET:
${params.pet.name}

EXISTING MEMORIES:
${existingLines || 'None'}

LATEST USER MESSAGE:
${params.userMessage}

LATEST ASSISTANT REPLY:
${params.assistantReply}

Return valid JSON only in this shape:
{
  "items": [
    {
      "content": "string",
      "type": "general",
      "importance": 0.0
    }
  ]
}
`.trim();

  try {
    const parsed = await callGeminiJson<{ items?: ExtractedMemoryItem[] }>(prompt);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];

    return items
      .map((item) => ({
        content: String(item.content ?? '').trim(),
        type: String(item.type ?? 'general').trim().toLowerCase() || 'general',
        importance:
          typeof item.importance === 'number' && Number.isFinite(item.importance)
            ? item.importance
            : 0.5,
      }))
      .filter((item) => item.content.length >= 8)
      .slice(0, MAX_NEW_MEMORIES_PER_TURN);
  } catch {
    return [];
  }
}

async function generateMemorySummary(params: {
  pet: NormalizedPet;
  memories: NormalizedMemory[];
}) {
  const memoryLines = params.memories
    .slice(0, MAX_MEMORIES_IN_CONTEXT)
    .map((m, index) => `${index + 1}. [${m.type}] ${m.content}`)
    .join('\n');

  if (!memoryLines.trim()) return null;

  const prompt = `
Summarize the following saved memories into one warm third-person paragraph for the pet companion profile.

Requirements:
- 60 to 120 words.
- Refer to the pet by name.
- Keep details emotionally useful for future chat.
- Do not mention database, bullet lists, or metadata.
- Sound like a concise companion memory summary.

PET:
${params.pet.name}

SAVED MEMORIES:
${memoryLines}
`.trim();

  try {
    return await callGeminiText(prompt);
  } catch {
    return params.memories
      .slice(0, 5)
      .map((m) => m.content)
      .join(' ');
  }
}

async function persistChatMessage(params: {
  supabase: SupabaseClient;
  userId: string;
  petId: string;
  role: 'user' | 'assistant';
  content: string;
}) {
  const now = new Date().toISOString();
  const baseId = crypto.randomUUID();

  const variants: GenericRow[] = [
    {
      id: baseId,
      user_id: params.userId,
      pet_id: params.petId,
      role: params.role,
      content: params.content,
      created_at: now,
      updated_at: now,
    },
    {
      id: baseId,
      owner_id: params.userId,
      companion_id: params.petId,
      role: params.role,
      content: params.content,
      created_at: now,
      updated_at: now,
    },
    {
      id: baseId,
      profile_id: params.userId,
      pet_id: params.petId,
      sender_role: params.role,
      message: params.content,
      created_at: now,
      updated_at: now,
    },
    {
      id: baseId,
      user_id: params.userId,
      companion_id: params.petId,
      sender: params.role,
      text: params.content,
      created_at: now,
      updated_at: now,
    },
  ];

  return insertIntoFirstWorkingTable(params.supabase, MESSAGE_TABLE_CANDIDATES, variants);
}

async function persistMemoryItem(params: {
  supabase: SupabaseClient;
  userId: string;
  pet: NormalizedPet;
  item: ExtractedMemoryItem;
}) {
  const now = new Date().toISOString();
  const fingerprint = stableHash(
    `${params.userId}:${params.pet.id}:${params.item.type}:${params.item.content.toLowerCase()}`
  );
  const baseId = crypto.randomUUID();

  const variants: GenericRow[] = [
    {
      id: baseId,
      user_id: params.userId,
      pet_id: params.pet.id,
      pet_name: params.pet.name,
      content: params.item.content,
      type: params.item.type,
      source: 'chat',
      fingerprint,
      created_at: now,
      updated_at: now,
    },
    {
      id: baseId,
      owner_id: params.userId,
      companion_id: params.pet.id,
      name: params.pet.name,
      content: params.item.content,
      memory_type: params.item.type,
      source: 'chat',
      fingerprint,
      created_at: now,
      updated_at: now,
    },
    {
      id: baseId,
      profile_id: params.userId,
      pet_id: params.pet.id,
      pet_name: params.pet.name,
      text: params.item.content,
      category: params.item.type,
      source: 'chat',
      fingerprint,
      created_at: now,
      updated_at: now,
    },
    {
      id: baseId,
      user_id: params.userId,
      companion_id: params.pet.id,
      pet_name: params.pet.name,
      body: params.item.content,
      kind: params.item.type,
      source: 'chat',
      fingerprint,
      created_at: now,
      updated_at: now,
    },
  ];

  return insertIntoFirstWorkingTable(params.supabase, MEMORY_TABLE_CANDIDATES, variants);
}

async function updatePetMemoryState(params: {
  supabase: SupabaseClient;
  userId: string;
  pet: NormalizedPet;
  memorySummary: string | null;
  memoryCount: number;
}) {
  const now = new Date().toISOString();

  const variants: GenericRow[] = [
    {
      memory_summary: params.memorySummary,
      memory_count: params.memoryCount,
      updated_at: now,
      last_memory_at: now,
    },
    {
      profile_summary: params.memorySummary,
      memory_count: params.memoryCount,
      updated_at: now,
      last_memory_at: now,
    },
    {
      companion_summary: params.memorySummary,
      memories_count: params.memoryCount,
      updated_at: now,
      last_memory_at: now,
    },
  ];

  return updateFirstWorkingPetTable(params.supabase, params.pet, params.userId, variants);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenericRow;
    const userId = await resolveUserId(request, body);

    const petId =
      readBodyString(body, ['petId', 'companionId', 'activePetId']) ?? '';
    const userMessage =
      readBodyString(body, ['message', 'content', 'text', 'prompt']) ?? '';

    if (!petId) {
      return NextResponse.json({ error: 'Missing petId / companionId' }, { status: 400 });
    }

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing message content' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const pets = await loadPetsForUser(supabase, userId);
    const pet =
      pets.find((item) => item.id === petId) ??
      pets.find((item) => item.name.toLowerCase() === petId.toLowerCase());

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found for current user.' },
        { status: 404 }
      );
    }

    const priorMessages = await loadMessagesForUserPet(supabase, userId, pet.id);
    const priorMemories = await loadMemoriesForUserPet(supabase, userId, pet);

    const incomingMessages = Array.isArray(body.messages)
      ? (body.messages as unknown[])
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const obj = item as GenericRow;
            const content = readBodyString(obj, ['content', 'text', 'message']);
            if (!content) return null;
            return {
              role: normalizeRole(readBodyString(obj, ['role', 'sender', 'sender_role'])),
              content,
            };
          })
          .filter((item): item is { role: 'user' | 'assistant' | 'system'; content: string } => Boolean(item))
      : [];

    const history =
      incomingMessages.length > 0
        ? incomingMessages.slice(-MAX_HISTORY_MESSAGES)
        : priorMessages.map((m) => ({ role: m.role, content: m.content })).slice(-MAX_HISTORY_MESSAGES);

    const assistantReply = await generateAssistantReply({
      pet,
      memorySummary: pet.memorySummary,
      recentMemories: priorMemories.slice(0, MAX_MEMORIES_IN_CONTEXT),
      history,
      userMessage,
    });

    await persistChatMessage({
      supabase,
      userId,
      petId: pet.id,
      role: 'user',
      content: userMessage,
    });

    await persistChatMessage({
      supabase,
      userId,
      petId: pet.id,
      role: 'assistant',
      content: assistantReply,
    });

    const extracted = await extractDurableMemories({
      pet,
      userMessage,
      assistantReply,
      existingMemories: priorMemories,
    });

    const existingContentSet = new Set(
      priorMemories.map((m) => `${m.type}:${m.content.trim().toLowerCase()}`)
    );

    const newlySaved: ExtractedMemoryItem[] = [];

    for (const item of extracted) {
      const key = `${item.type}:${item.content.trim().toLowerCase()}`;
      if (existingContentSet.has(key)) continue;

      const saved = await persistMemoryItem({
        supabase,
        userId,
        pet,
        item,
      });

      if (saved.ok) {
        newlySaved.push(item);
        existingContentSet.add(key);
      }
    }

    const refreshedMemories = await loadMemoriesForUserPet(supabase, userId, pet);
    const refreshedSummary = await generateMemorySummary({
      pet,
      memories: refreshedMemories,
    });

    await updatePetMemoryState({
      supabase,
      userId,
      pet,
      memorySummary: refreshedSummary,
      memoryCount: refreshedMemories.length,
    });

    return NextResponse.json({
      ok: true,
      reply: assistantReply,
      assistantReply,
      message: assistantReply,
      pet: {
        id: pet.id,
        name: pet.name,
      },
      memoryUpdates: newlySaved.length,
      memoryItems: newlySaved,
      memorySummary: refreshedSummary,
      memoryCount: refreshedMemories.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown chat route error';
    console.error('[chat route] fatal error:', message);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
