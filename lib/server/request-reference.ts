const prefixes = { order: 'P', reservation: 'R' } as const;

export function requestReference(kind: keyof typeof prefixes, number: number): string {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid request number');
  return `${prefixes[kind]}-${String(number).padStart(6, '0')}`;
}
