export const parseDecimal = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.');
  if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

export const n = (value, digits = 1) => {
  const number = parseDecimal(value);
  if (!Number.isFinite(number)) return '--';
  return number.toFixed(digits);
};

export const clean = parseDecimal;

export const toneBy = (condition, fallback = 'neutral') => condition ? 'danger' : fallback;
