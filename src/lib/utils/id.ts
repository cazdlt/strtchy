export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateId(prefix: string, name: string): string {
  return `${prefix}_${slugify(name)}`;
}

export function generateMovementId(name: string): string {
  return generateId('mv', name);
}

export function generateRoutineId(name: string): string {
  return generateId('rt', name);
}

export function generateRoutineMovementId(routineName: string, movementName: string, order: number): string {
  const routineSlug = slugify(routineName);
  const movementSlug = slugify(movementName);
  return `rm_${routineSlug}-${movementSlug}-${order}`;
}
