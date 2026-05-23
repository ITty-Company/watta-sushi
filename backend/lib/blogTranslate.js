/**
 * Автопереклад текстів блогу (адмінка). MyMemory — без API-ключа; опційно DeepL.
 */

const LANG_TARGETS = [
  { suf: 'ru', code: 'ru' },
  { suf: 'en', code: 'en' },
  { suf: 'nl', code: 'nl' },
];

const MYMEMORY_MAX_CHUNK = 450;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateWithDeepL(text, targetLang, sourceLang = 'UK') {
  const key = process.env.DEEPL_API_KEY?.trim();
  if (!key) return null;
  const base = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const params = new URLSearchParams({
    text,
    target_lang: targetLang.toUpperCase(),
    source_lang: sourceLang,
  });
  const res = await fetch(`${base}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const out = data?.translations?.[0]?.text;
  return typeof out === 'string' ? out.trim() : null;
}

async function translateWithMyMemory(text, targetCode, sourceCode = 'uk') {
  const q = encodeURIComponent(text.slice(0, MYMEMORY_MAX_CHUNK));
  const langpair = `${sourceCode}|${targetCode}`;
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${langpair}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data?.responseStatus && Number(data.responseStatus) !== 200) {
    throw new Error(data?.responseDetails || 'Помилка перекладу');
  }
  const out = data?.responseData?.translatedText;
  if (typeof out !== 'string' || !out.trim()) throw new Error('Порожній переклад');
  return out.trim();
}

async function translateChunked(text, targetCode, sourceCode) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (trimmed.length <= MYMEMORY_MAX_CHUNK) {
    const deepl = await translateWithDeepL(trimmed, targetCode, 'UK');
    if (deepl) return deepl;
    return translateWithMyMemory(trimmed, targetCode, sourceCode);
  }
  const parts = [];
  let rest = trimmed;
  while (rest.length > 0) {
    const chunk = rest.slice(0, MYMEMORY_MAX_CHUNK);
    rest = rest.slice(MYMEMORY_MAX_CHUNK);
    const deepl = await translateWithDeepL(chunk, targetCode, 'UK');
    parts.push(deepl || (await translateWithMyMemory(chunk, targetCode, sourceCode)));
    await sleep(350);
  }
  return parts.join('');
}

/**
 * Перекладає title_ua + content_ua → ru, en, nl (ua лишається як є).
 */
export async function translateBlogFromUkrainian({ title_ua, content_ua }) {
  const sourceTitle = String(title_ua || '').trim();
  const sourceContent = String(content_ua || '').trim();
  if (!sourceTitle && !sourceContent) {
    throw new Error('Заповніть заголовок або текст українською');
  }

  const result = {
    title_ua: sourceTitle,
    content_ua: sourceContent,
    title_ru: '',
    content_ru: '',
    title_en: '',
    content_en: '',
    title_nl: '',
    content_nl: '',
  };

  for (const { suf, code } of LANG_TARGETS) {
    if (sourceTitle) {
      result[`title_${suf}`] = await translateChunked(sourceTitle, code, 'uk');
      await sleep(300);
    }
    if (sourceContent) {
      result[`content_${suf}`] = await translateChunked(sourceContent, code, 'uk');
      await sleep(300);
    }
  }

  return result;
}
