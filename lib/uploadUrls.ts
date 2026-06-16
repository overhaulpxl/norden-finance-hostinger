import { getPublicAppUrl } from './appUrl';

const FIREBASE_FILE_URL = /^https:\/\/(?:firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//;

function uploadPublicBaseUrl() {
  return (process.env.UPLOAD_PUBLIC_BASE_URL?.trim() || `${getPublicAppUrl()}/api/files`).replace(/\/+$/, '');
}

export function isAllowedUploadUrl(value: string) {
  if (!value || value.length > 2048 || value.startsWith('data:')) return false;
  if (FIREBASE_FILE_URL.test(value)) return true;
  if (value.startsWith('/api/files/')) return true;
  if (value.startsWith(`${uploadPublicBaseUrl()}/`)) return true;
  if (process.env.NODE_ENV !== 'production' && value.startsWith('/api/mock-file?')) return true;
  return false;
}

export function isPaymentProofUrlForUser(value: string, userId: string) {
  const expectedEncodedPath = `payment-proofs%2F${encodeURIComponent(userId)}%2F`;
  const expectedRawPath = `payment-proofs/${encodeURIComponent(userId)}/`;
  const expectedDecodedPath = `payment-proofs/${userId}/`;
  return (
    value.includes(expectedEncodedPath) ||
    value.includes(expectedRawPath) ||
    value.includes(expectedDecodedPath)
  );
}
