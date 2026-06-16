export function assertNonEmpty(value: string | undefined | null, label: string) {
  if (!value || !value.trim()) {
    throw new Error(`${label} wajib diisi`);
  }
}

export function assertPositiveInt(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} harus lebih dari 0`);
  }
}

export function assertNonNegativeInt(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} tidak valid`);
  }
}

export function assertValidDate(value: string | undefined, label: string) {
  if (!value) return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} tidak valid`);
  }
}
