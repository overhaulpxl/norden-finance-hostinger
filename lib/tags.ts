import { Prisma } from '@prisma/client';

export function normalizeTags(tags?: string[] | null) {
  return Array.from(new Set((tags || [])
    .map((tag) => tag.replace(/^#/, '').trim().toLowerCase())
    .filter((tag) => /^[a-z0-9_-]{1,32}$/i.test(tag))))
    .slice(0, 10);
}

export function tagsToJson(tags?: string[] | null): Prisma.InputJsonValue {
  return normalizeTags(tags);
}

export function tagsFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return normalizeTags(value.map(String));
}
