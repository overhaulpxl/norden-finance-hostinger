export const DEFAULT_PUBLIC_APP_URL = 'https://nordenfinance.site';

export function getPublicAppUrl(fallback = DEFAULT_PUBLIC_APP_URL) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const rawUrl = configured || fallback || DEFAULT_PUBLIC_APP_URL;

  return rawUrl.replace(/\/+$/, '') || DEFAULT_PUBLIC_APP_URL;
}
