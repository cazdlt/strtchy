/**
 * Normalization and alias resolution for movements and audio cues.
 * Bridges legacy Spanish names/IDs from existing production databases
 * with canonical English 3D art assets and MP3 audio cues.
 */

export interface MovementIdentity {
  canonicalName: string;
  audioSlug: string;
}

// 37 canonical movements with their MP3 audio cues and all known legacy aliases
export const MOVEMENT_MAPPINGS: MovementIdentity[] = [
  { canonicalName: 'Plantar Fascia Release', audioSlug: 'plantar-fascia-release' },
  { canonicalName: 'Calf Stretch', audioSlug: 'calf-stretch' },
  { canonicalName: 'Forward Fold', audioSlug: 'forward-fold' },
  { canonicalName: 'Arch Raises', audioSlug: 'arch-raises' },
  { canonicalName: 'Single-Leg Glute Bridge', audioSlug: 'single-leg-glute-bridge' },
  { canonicalName: 'Single-Leg Balance', audioSlug: 'single-leg-balance' },
  { canonicalName: 'Seated Straddle', audioSlug: 'seated-straddle' },
  { canonicalName: 'Cobra Extension', audioSlug: 'cobra-extension' },
  { canonicalName: 'Passive Hang', audioSlug: 'passive-hang' },
  { canonicalName: 'Monster Walks', audioSlug: 'monster-walks' },
  { canonicalName: 'Quad Release', audioSlug: 'quad-release' },
  { canonicalName: 'Kneeling Wall Stretch', audioSlug: 'kneeling-wall-stretch' },
  { canonicalName: '90/90 Hip Switch', audioSlug: '90-90-hip-switch' },
  { canonicalName: 'Butterfly Stretch', audioSlug: 'butterfly-stretch' },
  { canonicalName: 'Pigeon Stretch', audioSlug: 'pigeon-stretch' },
  { canonicalName: 'Lunge with Rotation', audioSlug: 'lunge-with-rotation' },
  { canonicalName: 'Dead Bug', audioSlug: 'dead-bug' },
  { canonicalName: 'Side Plank', audioSlug: 'side-plank' },
  { canonicalName: "Side Child's Pose", audioSlug: 'side-childs-pose' },
  { canonicalName: 'Thoracic Roller Extensions', audioSlug: 'thoracic-roller-extensions' },
  { canonicalName: 'Trap Release', audioSlug: 'trap-release' },
  { canonicalName: 'Wall Pec Stretch', audioSlug: 'wall-pec-stretch' },
  { canonicalName: 'Band Pull-Aparts', audioSlug: 'band-pull-aparts' },
  { canonicalName: 'Scapular Wall Slides', audioSlug: 'scapular-wall-slides' },
  { canonicalName: 'Y-Raises', audioSlug: 'y-raises' },
  { canonicalName: 'Front Plank', audioSlug: 'front-plank' },
  { canonicalName: 'Face Pulls', audioSlug: 'face-pulls' },
  { canonicalName: 'Hollow Hold', audioSlug: 'hollow-hold' },
  { canonicalName: 'Ankle Inversion', audioSlug: 'ankle-inversion' },
  { canonicalName: 'Downward Dog', audioSlug: 'downward-dog' },
  { canonicalName: 'Supine Hamstring Stretch', audioSlug: 'supine-hamstring-stretch' },
  { canonicalName: 'Cat-Cow', audioSlug: 'cat-cow' },
  { canonicalName: 'Lying Spinal Twist', audioSlug: 'lying-spinal-twist' },
  { canonicalName: 'Knees to Chest', audioSlug: 'knees-to-chest' },
  { canonicalName: 'Quadruped Wrist Rocks', audioSlug: 'quadruped-wrist-rocks' },
  { canonicalName: 'Deep Squat Hold', audioSlug: 'deep-squat-hold' },
  { canonicalName: 'Thread the Needle', audioSlug: 'thread-the-needle' },
];

export const UTILITY_CUES = new Set([
  'get-ready',
  'switch-sides',
  'rest',
  'next-up',
  'practice-complete',
  'halfway',
]);

export function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\//g, '-')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
}

// Maps any alias string (legacy name, ID, slug) -> MovementIdentity
const ALIAS_LOOKUP = new Map<string, MovementIdentity>();

function registerAlias(alias: string, identity: MovementIdentity) {
  if (!alias) return;
  ALIAS_LOOKUP.set(alias, identity);
  ALIAS_LOOKUP.set(alias.toLowerCase(), identity);
  ALIAS_LOOKUP.set(normalizeKey(alias), identity);
}

// Register canonical forms
for (const m of MOVEMENT_MAPPINGS) {
  registerAlias(m.canonicalName, m);
  registerAlias(m.audioSlug, m);
  registerAlias(`mv_${m.audioSlug}`, m);
}

// Register legacy aliases (Spanish names, older IDs, alternative slugs)
const LEGACY_ALIASES: [string, string][] = [
  ['Liberación Plantar con Pelota', 'Plantar Fascia Release'],
  ['mv_liberacion-plantar-con-pelota', 'Plantar Fascia Release'],
  ['Estiramiento de Pantorrilla en Bloque', 'Calf Stretch'],
  ['mv_estiramiento-de-pantorrilla-en-bloque', 'Calf Stretch'],
  ['Estiramiento de Isquiotibiales de Pie', 'Forward Fold'],
  ['mv_estiramiento-de-isquiotibiales-de-pie', 'Forward Fold'],
  ['Elevación de Arco con Banda', 'Arch Raises'],
  ['mv_elevacion-de-arco-con-banda', 'Arch Raises'],
  ['Puente de Glúteo a Una Pierna', 'Single-Leg Glute Bridge'],
  ['mv_puente-de-gluteo-a-una-pierna', 'Single-Leg Glute Bridge'],
  ['Equilibrio a una pierna (Reloj)', 'Single-Leg Balance'],
  ['mv_equilibrio-a-una-pierna-reloj', 'Single-Leg Balance'],
  ['Pancake Stretch (Sentado en V)', 'Seated Straddle'],
  ['mv_pancake-stretch-sentado-en-v', 'Seated Straddle'],
  ['Cobra', 'Cobra Extension'],
  ['mv_cobra', 'Cobra Extension'],
  ['Dead Hang (Colgado pasivo)', 'Passive Hang'],
  ['mv_dead-hang-colgado-pasivo', 'Passive Hang'],
  ['Caminata Lateral con Banda (Monster Walks)', 'Monster Walks'],
  ['mv_caminata-lateral-con-banda-monster-walks', 'Monster Walks'],
  ['Liberación de Cuádriceps con Rodillo', 'Quad Release'],
  ['mv_liberacion-de-cuadriceps-con-rodillo', 'Quad Release'],
  ['Couch Stretch', 'Kneeling Wall Stretch'],
  ['mv_couch-stretch', 'Kneeling Wall Stretch'],
  ['90-90-hip-switch', '90/90 Hip Switch'],
  ['9090-hip-switch', '90/90 Hip Switch'],
  ['Pigeon Pose', 'Pigeon Stretch'],
  ['mv_pigeon-pose', 'Pigeon Stretch'],
  ['Lunge con Rotación Torácica', 'Lunge with Rotation'],
  ['mv_lunge-con-rotacion-toracica', 'Lunge with Rotation'],
  ['Plancha Lateral', 'Side Plank'],
  ['mv_plancha-lateral', 'Side Plank'],
  ["Child's Pose Bilateral", "Side Child's Pose"],
  ['Child’s Pose Bilateral', "Side Child's Pose"],
  ['mv_child-s-pose-bilateral', "Side Child's Pose"],
  ['side-child-s-pose', "Side Child's Pose"],
  ['Extensiones Torácicas con Rodillo', 'Thoracic Roller Extensions'],
  ['mv_extensiones-toracicas-con-rodillo', 'Thoracic Roller Extensions'],
  ['Liberación de Trapecio con Pelota', 'Trap Release'],
  ['mv_liberacion-de-trapecio-con-pelota', 'Trap Release'],
  ['Estiramiento Pectoral Menor en Marco', 'Wall Pec Stretch'],
  ['mv_estiramiento-pectoral-menor-en-marco', 'Wall Pec Stretch'],
  ['Extensiones de Hombro con Banda', 'Band Pull-Aparts'],
  ['mv_extensiones-de-hombro-con-banda', 'Band Pull-Aparts'],
  ['Wall Slides con Banda', 'Scapular Wall Slides'],
  ['mv_wall-slides-con-banda', 'Scapular Wall Slides'],
  ['Y-Raises con Mancuernas', 'Y-Raises'],
  ['mv_y-raises-con-mancuernas', 'Y-Raises'],
  ['Plancha Frontal', 'Front Plank'],
  ['mv_plancha-frontal', 'Front Plank'],
  ['Inversión de Tobillo con Banda', 'Ankle Inversion'],
  ['mv_inversion-de-tobillo-con-banda', 'Ankle Inversion'],
  ['Perro Boca Abajo (Downward Dog)', 'Downward Dog'],
  ['mv_perro-boca-abajo-downward-dog', 'Downward Dog'],
  ['Estiramiento de Isquiotibial Acostado con Banda', 'Supine Hamstring Stretch'],
  ['mv_estiramiento-de-isquiotibial-acostado-con-banda', 'Supine Hamstring Stretch'],
  ['Gato-Vaca (Cat-Cow)', 'Cat-Cow'],
  ['mv_gato-vaca-cat-cow', 'Cat-Cow'],
  ['Torsión Espinal Acostado', 'Lying Spinal Twist'],
  ['mv_torsion-espinal-acostado', 'Lying Spinal Twist'],
  ['Rodillas al Pecho', 'Knees to Chest'],
  ['mv_rodillas-al-pecho', 'Knees to Chest'],
  ['Balanceos de Muñeca en Cuadrupedia', 'Quadruped Wrist Rocks'],
  ['mv_balanceos-de-muneca-en-cuadrupedia', 'Quadruped Wrist Rocks'],
];

for (const [legacy, canonicalName] of LEGACY_ALIASES) {
  const identity = MOVEMENT_MAPPINGS.find((m) => m.canonicalName === canonicalName);
  if (identity) {
    registerAlias(legacy, identity);
  }
}

export type MovementInput =
  | string
  | {
      name?: string | null;
      id?: string | null;
      movementId?: string | null;
      isCustom?: boolean | null;
    }
  | null
  | undefined;

/**
 * Resolves any movement reference (Spanish name, legacy ID, slug, or object)
 * to its canonical English movement name.
 */
export function resolveCanonicalMovementName(ref: MovementInput): string | null {
  if (!ref) return null;

  if (typeof ref === 'string') {
    const direct = ALIAS_LOOKUP.get(ref) || ALIAS_LOOKUP.get(normalizeKey(ref));
    return direct?.canonicalName ?? null;
  }

  if (ref.isCustom) return null;

  // Try ID / movementId first
  const id = ref.movementId || ref.id;
  if (id) {
    const byId = ALIAS_LOOKUP.get(id) || ALIAS_LOOKUP.get(normalizeKey(id));
    if (byId) return byId.canonicalName;
  }

  // Try name
  if (ref.name) {
    const byName = ALIAS_LOOKUP.get(ref.name) || ALIAS_LOOKUP.get(normalizeKey(ref.name));
    if (byName) return byName.canonicalName;

    // Try extracting English name inside parentheses e.g. "Gato-Vaca (Cat-Cow)"
    const match = ref.name.match(/\(([^)]+)\)/);
    if (match?.[1]) {
      const byParenthesis =
        ALIAS_LOOKUP.get(match[1]) || ALIAS_LOOKUP.get(normalizeKey(match[1]));
      if (byParenthesis) return byParenthesis.canonicalName;
    }
  }

  return null;
}

/**
 * Resolves any voice cue request (phrase or movement reference) to an MP3 cue slug.
 */
export function resolveAudioCueSlug(ref: MovementInput): string {
  if (!ref) return '';

  if (typeof ref === 'string') {
    const raw = ref.trim();
    if (UTILITY_CUES.has(raw)) return raw;

    const norm = normalizeKey(raw);
    if (UTILITY_CUES.has(norm)) return norm;

    const identity = ALIAS_LOOKUP.get(raw) || ALIAS_LOOKUP.get(norm);
    if (identity) return identity.audioSlug;

    // Check parenthesized name e.g. "Perro Boca Abajo (Downward Dog)"
    const match = raw.match(/\(([^)]+)\)/);
    if (match?.[1]) {
      const byParen = ALIAS_LOOKUP.get(match[1]) || ALIAS_LOOKUP.get(normalizeKey(match[1]));
      if (byParen) return byParen.audioSlug;
    }

    return norm;
  }

  const canonical = resolveCanonicalMovementName(ref);
  if (canonical) {
    const identity = ALIAS_LOOKUP.get(canonical);
    if (identity) return identity.audioSlug;
  }

  return ref.name ? normalizeKey(ref.name) : '';
}

/**
 * Returns true if an MP3 file exists in static/audio/cues/<slug>.mp3
 */
export function isKnownAudioCue(slug: string): boolean {
  if (!slug) return false;
  if (UTILITY_CUES.has(slug)) return true;
  return MOVEMENT_MAPPINGS.some((m) => m.audioSlug === slug);
}
