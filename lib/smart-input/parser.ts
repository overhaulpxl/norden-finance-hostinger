import type { Balance } from '../../types';

type WalletLike = Pick<Balance, 'id' | 'name' | 'archivedAt'>;

export type WalletMatch = {
  wallet: WalletLike;
  alias: string;
  index: number;
  source: 'input' | 'ai' | 'fallback';
};

const CANONICAL_ALIASES: Record<string, string[]> = {
  gopay: ['gopay', 'go pay', 'go-pay'],
  bni: ['bni', 'bank bni'],
  bca: ['bca', 'bank bca'],
  dana: ['dana'],
  ovo: ['ovo'],
  cash: ['cash', 'tunai', 'uang tunai'],
  shopeepay: ['shopeepay', 'shopee pay', 'shopee-pay', 'spay'],
  seabank: ['seabank', 'sea bank', 'sea-bank'],
  jago: ['jago', 'bank jago'],
  blu: ['blu', 'bank blu'],
  paypal: ['paypal', 'pay pal'],
  linkaja: ['linkaja', 'link aja', 'link-aja'],
};

function displayCanonicalWalletName(value: string) {
  const normalized = normalizeWalletName(value);
  const display: Record<string, string> = {
    gopay: 'GoPay',
    bni: 'BNI',
    bca: 'BCA',
    dana: 'DANA',
    ovo: 'OVO',
    cash: 'Cash',
    shopeepay: 'ShopeePay',
    seabank: 'SeaBank',
    jago: 'Jago',
    blu: 'blu',
    paypal: 'PayPal',
    linkaja: 'LinkAja',
  };
  return display[normalized] || value;
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeWalletName(value: string) {
  return normalizeText(value).replace(/\s+/g, '');
}

function aliasesForWallet(walletName: string) {
  const normalized = normalizeWalletName(walletName);
  const spaced = normalizeText(walletName);
  const aliases = new Set<string>([normalized, spaced]);

  const canonicalAliases = CANONICAL_ALIASES[normalized] || [];
  for (const alias of canonicalAliases) {
    aliases.add(normalizeText(alias));
    aliases.add(normalizeWalletName(alias));
  }

  return Array.from(aliases).filter(Boolean);
}

export function stripWalletAliasesFromText(value: string | null | undefined, wallets: WalletLike[]) {
  if (!value) return value || '';

  let cleaned = ` ${value} `;
  const aliases = wallets
    .flatMap((wallet) => aliasesForWallet(wallet.name))
    .map((alias) => normalizeText(alias))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const alias of aliases) {
    const pattern = alias
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[\\s\\W_]+');
    cleaned = cleaned.replace(new RegExp(`\\s${pattern}\\s`, 'gi'), ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim() || '-';
}

export function buildWalletAliasMap(wallets: WalletLike[]) {
  const map = new Map<string, WalletLike>();
  for (const wallet of wallets) {
    for (const alias of aliasesForWallet(wallet.name)) {
      if (!map.has(alias)) map.set(alias, wallet);
    }
  }
  return map;
}

function findAliasIndex(input: string, alias: string) {
  const normalizedInput = normalizeText(input);
  const normalizedAlias = normalizeText(alias);
  if (!normalizedAlias) return -1;

  const spacedIndex = ` ${normalizedInput} `.indexOf(` ${normalizedAlias} `);
  if (spacedIndex >= 0) return Math.max(0, spacedIndex);

  const compactInput = normalizeWalletName(input);
  const compactAlias = normalizeWalletName(alias);
  const compactIndex = compactInput.indexOf(compactAlias);
  return compactIndex >= 0 ? compactIndex : -1;
}

export function detectWalletsFromInput(input: string, wallets: WalletLike[]): WalletMatch[] {
  const aliasMap = buildWalletAliasMap(wallets);
  const matches: WalletMatch[] = [];
  const seenWalletIds = new Set<string>();

  for (const [alias, wallet] of aliasMap.entries()) {
    const index = findAliasIndex(input, alias);
    if (index < 0 || seenWalletIds.has(wallet.id)) continue;
    seenWalletIds.add(wallet.id);
    matches.push({ wallet, alias, index, source: 'input' });
  }

  return matches.sort((a, b) => a.index - b.index || b.alias.length - a.alias.length);
}

export function detectWalletFromInput(input: string, wallets: WalletLike[]) {
  const matches = detectWalletsFromInput(input, wallets);
  if (matches.length <= 1) return matches[0] || null;

  const first = matches[0];
  const firstIsCashWithdrawalWord = normalizeWalletName(first.wallet.name) === 'cash' && normalizeWalletName(first.alias) === 'tunai';
  if (firstIsCashWithdrawalWord && /\btarik\s+tunai\b/i.test(input)) {
    const nonCashMatch = matches.find((match) => normalizeWalletName(match.wallet.name) !== 'cash');
    if (nonCashMatch) return nonCashMatch;
  }

  return first;
}

export function detectKnownWalletAliasFromInput(input: string) {
  return detectKnownWalletAliasesFromInput(input)[0] || null;
}

export function detectKnownWalletAliasesFromInput(input: string) {
  const aliases = Object.entries(CANONICAL_ALIASES)
    .flatMap(([canonical, values]) => values.map((alias) => ({ canonical, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const matches: Array<{ canonical: string; displayName: string; alias: string; index: number }> = [];
  const seen = new Set<string>();

  for (const { canonical, alias } of aliases) {
    const index = findAliasIndex(input, alias);
    if (index >= 0 && !seen.has(canonical)) {
      seen.add(canonical);
      matches.push({
        canonical,
        displayName: displayCanonicalWalletName(canonical),
        alias,
        index,
      });
    }
  }

  return matches.sort((a, b) => a.index - b.index || b.alias.length - a.alias.length);
}

export function validateWalletMatch(walletName: string | null | undefined, wallets: WalletLike[]) {
  if (!walletName) return null;

  const requested = normalizeWalletName(walletName);
  if (!requested || requested === 'unknown') return null;

  const aliasMap = buildWalletAliasMap(wallets);
  const wallet = aliasMap.get(requested) || aliasMap.get(normalizeText(walletName));
  if (!wallet) return null;

  return { wallet, alias: walletName, index: -1, source: 'ai' as const };
}

export function getFallbackWallet(wallets: WalletLike[]) {
  const activeWallets = wallets.filter((wallet) => !wallet.archivedAt);
  if (activeWallets.length === 0) return null;
  if (activeWallets.length === 1) return { wallet: activeWallets[0], alias: activeWallets[0].name, index: -1, source: 'fallback' as const };

  const cash = validateWalletMatch('cash', activeWallets);
  if (cash) return { ...cash, source: 'fallback' as const };

  return { wallet: activeWallets[0], alias: activeWallets[0].name, index: -1, source: 'fallback' as const };
}

export function resolveWalletForTransaction({
  input,
  parsedWalletName,
  wallets,
}: {
  input: string;
  parsedWalletName?: string | null;
  wallets: WalletLike[];
}) {
  const explicitMatch = detectWalletFromInput(input, wallets);
  if (explicitMatch) return explicitMatch;

  const aiMatch = validateWalletMatch(parsedWalletName, wallets);
  if (aiMatch) return aiMatch;

  return getFallbackWallet(wallets);
}

export function resolveTransferWalletsFromInput(input: string, wallets: WalletLike[]) {
  const matches = detectWalletsFromInput(input, wallets);
  if (matches.length < 2) return null;

  return {
    from: matches[0],
    to: matches.find((match) => match.wallet.id !== matches[0].wallet.id) || null,
  };
}
