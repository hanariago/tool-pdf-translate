// User-key LLM translation (Claude / OpenAI). Called directly from the browser
// with the user's own API key. Nothing is proxied through any server.

import { DEFAULT_MODELS } from "./config.js";

function buildPrompt(texts, tgtLabel, correctOcr) {
  const intro = correctOcr
    ? `다음은 OCR(이미지 글자 인식)로 추출한 텍스트 조각들입니다. 오인식된 글자를 문맥에 맞게 보정한 뒤 ${tgtLabel}(으)로 번역하세요.`
    : `다음 텍스트 조각들을 ${tgtLabel}(으)로 번역하세요.`;
  return (
    `${intro}\n` +
    `규칙:\n` +
    `- 입력은 JSON 문자열 배열입니다.\n` +
    `- 같은 길이의 JSON 문자열 배열로만 답하세요. 설명/마크다운/코드펜스 금지.\n` +
    `- 각 원소를 1:1로 번역하세요. 순서와 개수를 유지하세요.\n` +
    `- 이미 번역 언어인 항목은 그대로 두세요.\n\n` +
    `입력:\n${JSON.stringify(texts)}`
  );
}

function parseArray(raw, expectedLen) {
  let s = (raw || "").trim();
  // strip code fences if present
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  try {
    const arr = JSON.parse(s);
    if (Array.isArray(arr)) return arr.map((v) => String(v ?? ""));
  } catch (_) {}
  // fallback: split by newlines
  return s.split("\n").map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim());
}

async function callClaude({ key, model, prompt }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.claude,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Claude API 오류 (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.content || []).map((c) => c.text || "").join("");
}

async function callOpenAI({ key, model, prompt }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.openai,
      temperature: 0,
      messages: [
        { role: "system", content: "You are a precise translation engine. Reply with only a JSON array of strings." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`OpenAI API 오류 (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Translate an array of strings. Chunks to keep requests bounded.
export async function llmTranslate({ provider, key, model, texts, tgtLabel, correctOcr, onProgress }) {
  const CHUNK = 40;
  const result = new Array(texts.length).fill("");
  let done = 0;

  for (let i = 0; i < texts.length; i += CHUNK) {
    const slice = texts.slice(i, i + CHUNK);
    const prompt = buildPrompt(slice, tgtLabel, correctOcr);
    const raw =
      provider === "openai"
        ? await callOpenAI({ key, model, prompt })
        : await callClaude({ key, model, prompt });
    const parsed = parseArray(raw, slice.length);
    for (let j = 0; j < slice.length; j++) {
      result[i + j] = parsed[j] != null ? parsed[j] : slice[j];
    }
    done += slice.length;
    onProgress?.(done, texts.length);
  }
  return result;
}
