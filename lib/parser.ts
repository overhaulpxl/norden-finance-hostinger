import { ParseResult, TransactionType } from '../types';
import { METHOD_ALIASES, TYPE_KEYWORDS, CATEGORY_KEYWORDS, DEFAULT_METHOD, DEFAULT_CATEGORY, DEFAULT_TYPE } from './constants';

export function parseAmount(input: string): number {
  const kPattern = /(\d+(?:\.\d+)?)\s*(k|rb)/i;
  const jtPattern = /(\d+(?:\.\d+)?)\s*(jt|juta)/i;
  const numPattern = /(\d{1,3}(?:[.,]\d{3})*|\d+)/;

  let amount = 0;
  
  if (jtPattern.test(input)) {
    const match = input.match(jtPattern);
    if (match) amount = parseFloat(match[1]) * 1000000;
  } else if (kPattern.test(input)) {
    const match = input.match(kPattern);
    if (match) amount = parseFloat(match[1]) * 1000;
  } else if (numPattern.test(input)) {
    const match = input.match(numPattern);
    if (match) {
        amount = parseInt(match[1].replace(/[.,]/g, ''), 10);
    }
  }

  return amount;
}

export function parseMethod(input: string): string {
  const lowerInput = input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const aliases = Object.keys(METHOD_ALIASES).sort((a, b) => b.length - a.length);
  let bestMatch: { method: string; index: number; length: number } | null = null;

  for (const alias of aliases) {
    const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const index = ` ${lowerInput} `.indexOf(` ${normalizedAlias} `);
    if (index >= 0) {
      if (!bestMatch || index < bestMatch.index || (index === bestMatch.index && normalizedAlias.length > bestMatch.length)) {
        bestMatch = { method: METHOD_ALIASES[alias], index, length: normalizedAlias.length };
      }
    }
  }

  return bestMatch?.method || DEFAULT_METHOD;
}

function parseTransferToMethod(input: string, fromMethod: string): string | null {
  const lowerInput = input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const aliases = Object.keys(METHOD_ALIASES).sort((a, b) => b.length - a.length);
  const matches: Array<{ method: string; index: number; length: number }> = [];

  for (const alias of aliases) {
    const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const index = ` ${lowerInput} `.indexOf(` ${normalizedAlias} `);
    if (index >= 0) {
      const method = METHOD_ALIASES[alias];
      if (!matches.some((match) => match.method === method)) {
        matches.push({ method, index, length: normalizedAlias.length });
      }
    }
  }

  return matches
    .sort((a, b) => a.index - b.index || b.length - a.length)
    .find((match) => match.method !== fromMethod)?.method || null;
}

export function parseType(input: string, isBalanceUpdate: boolean): TransactionType {
  if (isBalanceUpdate) return 'masuk';

  const lowerInput = input.toLowerCase();

  if (/\b(tf|transfer)\b/.test(lowerInput) && /\b(ke|to)\b/.test(lowerInput)) {
    return 'transfer';
  }
  
  for (const word of TYPE_KEYWORDS.masuk) {
    if (lowerInput.includes(word)) return 'masuk';
  }
  for (const word of TYPE_KEYWORDS.keluar) {
    if (lowerInput.includes(word)) return 'keluar';
  }
  
  return DEFAULT_TYPE;
}

export function parseCategory(input: string, type: TransactionType): string {
  const lowerInput = input.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword)) {
        return category;
      }
    }
  }
  
  return type === 'masuk' ? 'lain-lain' : DEFAULT_CATEGORY;
}

export function parseDate(input: string): string {
  const lowerInput = input.toLowerCase();
  const now = new Date();

  // 1. Check relative date "kemarin"
  if (lowerInput.includes('kemarin')) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return yesterday.toISOString();
  }

  // 2. Check explicit date format (e.g. DD/MM/YYYY or DD-MM-YYYY)
  const explicitPattern = /\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b/;
  const explicitMatch = input.match(explicitPattern);
  if (explicitMatch) {
    const day = parseInt(explicitMatch[1], 10);
    const month = parseInt(explicitMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(explicitMatch[3], 10);
    const targetDate = new Date(year, month, day, 12, 0, 0); // Noon to avoid timezone shifts
    return targetDate.toISOString();
  }

  // 3. Check "DD month" pattern (e.g. "2 juni" or "02 juni")
  const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
  const wordPattern = /\b(\d{1,2})\s+([a-zA-Z]{3,9})\b/;
  const wordMatch = input.match(wordPattern);
  if (wordMatch) {
    const day = parseInt(wordMatch[1], 10);
    const monthStr = wordMatch[2].toLowerCase().substring(0, 3);
    // Handle Indonesian spelling map if necessary, e.g. "agus" -> "agu", "dese" -> "des"
    const parsedMonth = monthStr === 'agt' ? 'agu' : monthStr === 'okt' ? 'okt' : monthStr;
    const monthIndex = months.indexOf(parsedMonth);
    if (monthIndex !== -1) {
      const year = now.getFullYear();
      const targetDate = new Date(year, monthIndex, day, 12, 0, 0);
      return targetDate.toISOString();
    }
  }

  // Default to today
  return now.toISOString();
}

export function parseTransaction(input: string): ParseResult {
  const lowerInput = input.toLowerCase();
  const isBalanceUpdate = lowerInput.startsWith('saldo ');

  const amount = parseAmount(input);
  const method = parseMethod(input);
  
  if (isBalanceUpdate) {
    return {
      isBalanceUpdate: true,
      amount,
      method,
      rawInput: input,
    };
  }

  const type = parseType(input, false);
  const category = parseCategory(input, type);
  const transactionDate = parseDate(input);
  const transferToMethod = type === 'transfer' ? parseTransferToMethod(input, method) : null;
  
  // Extract hashtags
  const tagPattern = /#[\w]+/g;
  const tagsMatch = input.match(tagPattern);
  const tags = tagsMatch ? tagsMatch.map(t => t.replace('#', '').toLowerCase()) : [];
  
  let note = input;
  const kPattern = /\b(\d+(?:\.\d+)?)\s*(k|rb)\b/i;
  const jtPattern = /\b(\d+(?:\.\d+)?)\s*(jt|juta)\b/i;
  const numPattern = /\b(\d{1,3}(?:[.,]\d{3})*|\d+)\b/;
  
  // Clean date expressions, amounts, and tags from notes
  note = note.replace(/\bkemarin\b/gi, '')
             .replace(/\bhari\s+ini\b/gi, '')
             .replace(/\b\d{1,2}[/\-]\d{1,2}[/\-]\d{4}\b/g, '')
             .replace(/\b\d{1,2}\s+[a-zA-Z]{3,9}\b/g, '')
             .replace(jtPattern, '')
             .replace(kPattern, '')
             .replace(numPattern, '')
             .replace(tagPattern, '')
             .replace(/\s+/g, ' ')
             .trim();

  return {
    isBalanceUpdate: false,
    type,
    category,
    amount,
    method,
    transferToMethod,
    note: note || '-',
    tags,
    rawInput: input,
    transactionDate,
  };
}
