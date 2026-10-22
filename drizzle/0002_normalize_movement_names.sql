-- Migration: Normalize legacy Spanish/outdated movement names and illustration paths
-- Updates existing built-in movements to canonical English names and 3D webp icon paths.

UPDATE `movements` SET `name` = 'Plantar Fascia Release', `illustration_path` = '/assets/movements/3d/plantar-fascia-release.webp' WHERE `id` = 'mv_liberacion-plantar-con-pelota' OR `name` = 'Liberación Plantar con Pelota' OR `name` = 'Plantar Fascia Release';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Calf Stretch', `illustration_path` = '/assets/movements/3d/calf-stretch.webp' WHERE `id` = 'mv_estiramiento-de-pantorrilla-en-bloque' OR `name` = 'Estiramiento de Pantorrilla en Bloque' OR `name` = 'Calf Stretch';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Forward Fold', `illustration_path` = '/assets/movements/3d/forward-fold.webp' WHERE `id` = 'mv_estiramiento-de-isquiotibiales-de-pie' OR `name` = 'Estiramiento de Isquiotibiales de Pie' OR `name` = 'Forward Fold';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Arch Raises', `illustration_path` = '/assets/movements/3d/arch-raises.webp' WHERE `id` = 'mv_elevacion-de-arco-con-banda' OR `name` = 'Elevación de Arco con Banda' OR `name` = 'Arch Raises';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Single-Leg Glute Bridge', `illustration_path` = '/assets/movements/3d/single-leg-glute-bridge.webp' WHERE `id` = 'mv_puente-de-gluteo-a-una-pierna' OR `name` = 'Puente de Glúteo a Una Pierna' OR `name` = 'Single-Leg Glute Bridge';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Single-Leg Balance', `illustration_path` = '/assets/movements/3d/single-leg-balance.webp' WHERE `id` = 'mv_equilibrio-a-una-pierna-reloj' OR `name` = 'Equilibrio a una pierna (Reloj)' OR `name` = 'Single-Leg Balance';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Seated Straddle', `illustration_path` = '/assets/movements/3d/seated-straddle.webp' WHERE `id` = 'mv_pancake-stretch-sentado-en-v' OR `name` = 'Pancake Stretch (Sentado en V)' OR `name` = 'Seated Straddle';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Cobra Extension', `illustration_path` = '/assets/movements/3d/cobra-extension.webp' WHERE `id` = 'mv_cobra' OR `name` = 'Cobra' OR `name` = 'Cobra Extension';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Passive Hang', `illustration_path` = '/assets/movements/3d/passive-hang.webp' WHERE `id` = 'mv_dead-hang-colgado-pasivo' OR `name` = 'Dead Hang (Colgado pasivo)' OR `name` = 'Passive Hang';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Monster Walks', `illustration_path` = '/assets/movements/3d/monster-walks.webp' WHERE `id` = 'mv_caminata-lateral-con-banda-monster-walks' OR `name` = 'Caminata Lateral con Banda (Monster Walks)' OR `name` = 'Monster Walks';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Quad Release', `illustration_path` = '/assets/movements/3d/quad-release.webp' WHERE `id` = 'mv_liberacion-de-cuadriceps-con-rodillo' OR `name` = 'Liberación de Cuádriceps con Rodillo' OR `name` = 'Quad Release';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Kneeling Wall Stretch', `illustration_path` = '/assets/movements/3d/kneeling-wall-stretch.webp' WHERE `id` = 'mv_couch-stretch' OR `name` = 'Couch Stretch' OR `name` = 'Kneeling Wall Stretch';
--> statement-breakpoint
UPDATE `movements` SET `name` = '90/90 Hip Switch', `illustration_path` = '/assets/movements/3d/90-90-hip-switch.webp' WHERE `id` = 'mv_90-90-hip-switch' OR `name` = '90/90 Hip Switch';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Butterfly Stretch', `illustration_path` = '/assets/movements/3d/butterfly-stretch.webp' WHERE `id` = 'mv_butterfly-stretch' OR `name` = 'Butterfly Stretch';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Pigeon Stretch', `illustration_path` = '/assets/movements/3d/pigeon-stretch.webp' WHERE `id` = 'mv_pigeon-pose' OR `name` = 'Pigeon Pose' OR `name` = 'Pigeon Stretch';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Lunge with Rotation', `illustration_path` = '/assets/movements/3d/lunge-with-rotation.webp' WHERE `id` = 'mv_lunge-con-rotacion-toracica' OR `name` = 'Lunge con Rotación Torácica' OR `name` = 'Lunge with Rotation';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Dead Bug', `illustration_path` = '/assets/movements/3d/dead-bug.webp' WHERE `id` = 'mv_dead-bug' OR `name` = 'Dead Bug';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Side Plank', `illustration_path` = '/assets/movements/3d/side-plank.webp' WHERE `id` = 'mv_plancha-lateral' OR `name` = 'Plancha Lateral' OR `name` = 'Side Plank';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Side Child''s Pose', `illustration_path` = '/assets/movements/3d/side-child-s-pose.webp' WHERE `id` = 'mv_child-s-pose-bilateral' OR `name` = 'Child''s Pose Bilateral' OR `name` = 'Side Child''s Pose';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Thoracic Roller Extensions', `illustration_path` = '/assets/movements/3d/thoracic-roller-extensions.webp' WHERE `id` = 'mv_extensiones-toracicas-con-rodillo' OR `name` = 'Extensiones Torácicas con Rodillo' OR `name` = 'Thoracic Roller Extensions';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Trap Release', `illustration_path` = '/assets/movements/3d/trap-release.webp' WHERE `id` = 'mv_liberacion-de-trapecio-con-pelota' OR `name` = 'Liberación de Trapecio con Pelota' OR `name` = 'Trap Release';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Wall Pec Stretch', `illustration_path` = '/assets/movements/3d/wall-pec-stretch.webp' WHERE `id` = 'mv_estiramiento-pectoral-menor-en-marco' OR `name` = 'Estiramiento Pectoral Menor en Marco' OR `name` = 'Wall Pec Stretch';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Band Pull-Aparts', `illustration_path` = '/assets/movements/3d/band-pull-aparts.webp' WHERE `id` = 'mv_extensiones-de-hombro-con-banda' OR `name` = 'Extensiones de Hombro con Banda' OR `name` = 'Band Pull-Aparts';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Scapular Wall Slides', `illustration_path` = '/assets/movements/3d/scapular-wall-slides.webp' WHERE `id` = 'mv_wall-slides-con-banda' OR `name` = 'Wall Slides con Banda' OR `name` = 'Scapular Wall Slides';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Y-Raises', `illustration_path` = '/assets/movements/3d/y-raises.webp' WHERE `id` = 'mv_y-raises-con-mancuernas' OR `name` = 'Y-Raises con Mancuernas' OR `name` = 'Y-Raises';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Front Plank', `illustration_path` = '/assets/movements/3d/front-plank.webp' WHERE `id` = 'mv_plancha-frontal' OR `name` = 'Plancha Frontal' OR `name` = 'Front Plank';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Face Pulls', `illustration_path` = '/assets/movements/3d/face-pulls.webp' WHERE `id` = 'mv_face-pulls' OR `name` = 'Face Pulls';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Hollow Hold', `illustration_path` = '/assets/movements/3d/hollow-hold.webp' WHERE `id` = 'mv_hollow-hold' OR `name` = 'Hollow Hold';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Ankle Inversion', `illustration_path` = '/assets/movements/3d/ankle-inversion.webp' WHERE `id` = 'mv_inversion-de-tobillo-con-banda' OR `name` = 'Inversión de Tobillo con Banda' OR `name` = 'Ankle Inversion';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Downward Dog', `illustration_path` = '/assets/movements/3d/downward-dog.webp' WHERE `id` = 'mv_perro-boca-abajo-downward-dog' OR `name` = 'Perro Boca Abajo (Downward Dog)' OR `name` = 'Downward Dog';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Supine Hamstring Stretch', `illustration_path` = '/assets/movements/3d/supine-hamstring-stretch.webp' WHERE `id` = 'mv_estiramiento-de-isquiotibial-acostado-con-banda' OR `name` = 'Estiramiento de Isquiotibial Acostado con Banda' OR `name` = 'Supine Hamstring Stretch';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Cat-Cow', `illustration_path` = '/assets/movements/3d/cat-cow.webp' WHERE `id` = 'mv_gato-vaca-cat-cow' OR `name` = 'Gato-Vaca (Cat-Cow)' OR `name` = 'Cat-Cow';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Lying Spinal Twist', `illustration_path` = '/assets/movements/3d/lying-spinal-twist.webp' WHERE `id` = 'mv_torsion-espinal-acostado' OR `name` = 'Torsión Espinal Acostado' OR `name` = 'Lying Spinal Twist';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Knees to Chest', `illustration_path` = '/assets/movements/3d/knees-to-chest.webp' WHERE `id` = 'mv_rodillas-al-pecho' OR `name` = 'Rodillas al Pecho' OR `name` = 'Knees to Chest';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Quadruped Wrist Rocks', `illustration_path` = '/assets/movements/3d/quadruped-wrist-rocks.webp' WHERE `id` = 'mv_balanceos-de-muneca-en-cuadrupedia' OR `name` = 'Balanceos de Muñeca en Cuadrupedia' OR `name` = 'Quadruped Wrist Rocks';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Deep Squat Hold', `illustration_path` = '/assets/movements/3d/deep-squat-hold.webp' WHERE `id` = 'mv_deep-squat-hold' OR `name` = 'Deep Squat Hold';
--> statement-breakpoint
UPDATE `movements` SET `name` = 'Thread the Needle', `illustration_path` = '/assets/movements/3d/thread-the-needle.webp' WHERE `id` = 'mv_thread-the-needle' OR `name` = 'Thread the Needle';
--> statement-breakpoint
INSERT OR IGNORE INTO `movements` (`id`, `name`, `description`, `type`, `illustration_path`, `is_custom`, `is_bilateral`, `switch_sides_duration`, `time_per_rep`, `equipment`, `metadata`, `created_at`)
VALUES
('mv_deep-squat-hold', 'Deep Squat Hold', 'Pies al ancho de hombros, baja a una sentadilla profunda con el pecho erguido y las rodillas alineadas con los dedos de los pies.', 'timed', '/assets/movements/3d/deep-squat-hold.webp', 0, 0, 5, NULL, '[]', '{"defaultTarget":{"type":"time","value":60,"unit":"s"}}', unixepoch()),
('mv_thread-the-needle', 'Thread the Needle', 'En cuadrupedia, pasa un brazo por debajo del torso apoyando el hombro y la sien en el suelo para rotar la columna torácica.', 'timed', '/assets/movements/3d/thread-the-needle.webp', 0, 1, 5, NULL, '[]', '{"defaultTarget":{"type":"time","value":45,"unit":"s"}}', unixepoch()),
('mv_kneeling-wall-stretch', 'Kneeling Wall Stretch', 'Rodilla en el suelo pegada a la pared con la espinilla vertical. Eleva el torso para abrir el flexor de la cadera y cuádriceps.', 'timed', '/assets/movements/3d/kneeling-wall-stretch.webp', 0, 1, 5, NULL, '[]', '{"defaultTarget":{"type":"time","value":60,"unit":"s"}}', unixepoch());
