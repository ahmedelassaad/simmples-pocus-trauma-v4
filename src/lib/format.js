export const n = (value, digits = 1) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  return number.toFixed(digits);
};

export const clean = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const toneBy = (condition, fallback = 'neutral') => condition ? 'danger' : fallback;
