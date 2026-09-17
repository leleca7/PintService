export const OPERATION_STAGES = [
  'Desmontagem',
  'Funilaria',
  'Prep. de Pintura',
  'Pintura',
  'Polimento de Pint.',
  'Montagem',
  'Lavagem/Acabamento',
] as const;

export type OperationStage = (typeof OPERATION_STAGES)[number];

export function normalizeOperationalStage(value = '') {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const exact = OPERATION_STAGES.find((stage) =>
    stage
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() === normalized,
  );

  if (exact) return exact;
  if (normalized.includes('desmont')) return 'Desmontagem';
  if (normalized.includes('funilar')) return 'Funilaria';
  if (normalized.includes('prep') && normalized.includes('pint')) return 'Prep. de Pintura';
  if (normalized.includes('polimento')) return 'Polimento de Pint.';
  if (normalized.includes('montagem')) return 'Montagem';
  if (normalized.includes('lavagem') || normalized.includes('acabamento')) return 'Lavagem/Acabamento';
  if (normalized === 'pintura' || normalized.includes(' pintura')) return 'Pintura';
  return null;
}

export function nextOperationalStage(value = '') {
  const current = normalizeOperationalStage(value);
  if (!current) return null;
  const index = OPERATION_STAGES.indexOf(current);
  return index >= 0 && index < OPERATION_STAGES.length - 1 ? OPERATION_STAGES[index + 1] : null;
}
