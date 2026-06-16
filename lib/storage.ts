import { randomUUID } from 'crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { getAdminStorage } from './firebaseAdmin';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function storageProvider() {
  return (process.env.STORAGE_PROVIDER || 'local').trim().toLowerCase();
}

function maxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_SIZE_MB || 5);
  return Math.max(1, Math.min(Number.isFinite(mb) ? mb : 5, 25)) * 1024 * 1024;
}

function assertSafeRelativePath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.includes('../') ||
    normalized.includes('/..') ||
    normalized === '..' ||
    normalized.includes('\0')
  ) {
    throw new Error('Path file tidak valid');
  }
  return normalized;
}

function getUploadDir() {
  const uploadDir = process.env.UPLOAD_DIR?.trim();
  if (!uploadDir) {
    throw new Error('UPLOAD_DIR wajib diatur untuk STORAGE_PROVIDER=local');
  }
  const resolved = path.resolve(uploadDir);
  const cwd = path.resolve(process.cwd());
  const forbidden = ['.next', 'src', 'public'].map((segment) => path.join(cwd, segment));
  if (forbidden.some((dir) => resolved === dir || resolved.startsWith(`${dir}${path.sep}`))) {
    throw new Error('UPLOAD_DIR tidak boleh berada di .next, src, atau public');
  }
  return resolved;
}

function resolveLocalPath(relativePath: string) {
  const uploadDir = getUploadDir();
  const safeRelativePath = assertSafeRelativePath(relativePath);
  const resolved = path.resolve(uploadDir, safeRelativePath);
  if (resolved !== uploadDir && !resolved.startsWith(`${uploadDir}${path.sep}`)) {
    throw new Error('Path traversal ditolak');
  }
  return resolved;
}

function publicUrlFor(relativePath: string) {
  const baseUrl = process.env.UPLOAD_PUBLIC_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('UPLOAD_PUBLIC_BASE_URL wajib diatur untuk STORAGE_PROVIDER=local');
  }
  const encodedPath = assertSafeRelativePath(relativePath)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${baseUrl.replace(/\/$/, '')}/${encodedPath}`;
}

export function assertAllowedImageFile(file: File) {
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_IMAGE_TYPES, file.type)) {
    throw new Error('File harus berupa gambar JPG, PNG, atau WebP');
  }
  if (file.size > maxUploadBytes()) {
    throw new Error(`Ukuran file maksimal ${Math.round(maxUploadBytes() / 1024 / 1024)}MB`);
  }
}

function extensionFor(contentType: string, originalName: string) {
  const expected = ALLOWED_IMAGE_TYPES[contentType];
  if (!expected) {
    throw new Error('Tipe file tidak didukung');
  }
  const originalExt = path.extname(originalName).toLowerCase();
  if (originalExt === '.svg') {
    throw new Error('SVG tidak didukung untuk upload');
  }
  if (originalExt && !Object.values(ALLOWED_IMAGE_TYPES).includes(originalExt)) {
    throw new Error('Ekstensi file tidak didukung');
  }
  return originalExt || expected;
}

export async function uploadFile(
  folderPath: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const safeFolder = assertSafeRelativePath(folderPath);

  if (storageProvider() === 'local') {
    const ext = extensionFor(contentType, fileName);
    const relativePath = `${safeFolder}/${randomUUID()}${ext}`;
    const destination = resolveLocalPath(relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, fileBuffer, { flag: 'wx' });
    return relativePath;
  }

  const bucket = getAdminStorage().bucket();
  const filePath = `${safeFolder}/${fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || `${randomUUID()}.jpg`}`;
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
    },
  });

  return filePath;
}

export async function getSignedUrl(
  storagePath: string,
  expiresInMinutes = 60
): Promise<string> {
  if (storageProvider() === 'local') {
    return publicUrlFor(storagePath);
  }

  const bucket = getAdminStorage().bucket();
  const file = bucket.file(storagePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    if (storageProvider() === 'local') {
      await unlink(resolveLocalPath(storagePath));
      return;
    }

    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);
    await file.delete();
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}

export async function readLocalUpload(relativePath: string) {
  const resolved = resolveLocalPath(relativePath);
  const info = await stat(resolved);
  if (!info.isFile()) {
    throw new Error('File tidak ditemukan');
  }
  return readFile(resolved);
}

export function contentTypeForPath(relativePath: string) {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}
