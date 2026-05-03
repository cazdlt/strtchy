PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`account_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`expires_at` integer,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO account VALUES('efK7qX09MVB3u15TuCpZ08H5OFOcOC8a','PEd9PAtLUFc6wgrW4DXKkFbfZ65AAyCN','credential','PEd9PAtLUFc6wgrW4DXKkFbfZ65AAyCN',NULL,NULL,NULL,NULL,'8ecfe3e5da192c4016eafb48e164f2ea:96099e0a5cc79343b4d133a3c70758f078bdbf04d5c692f4755e27af57eac744c6495e5a99391ea520a70da6c03f06ffca2ba2ebfae33afcb308a71a545f4d71',1777178010,1777178010);
CREATE TABLE `movements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`illustration_path` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`user_id` text,
	`weight_unit` text,
	`is_bilateral` integer DEFAULT false NOT NULL,
	`switch_sides_duration` integer DEFAULT 5 NOT NULL,
	`time_per_rep` integer,
	`equipment` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO movements VALUES('mv_liberacion-plantar-con-pelota','Liberación Plantar con Pelota','De pie, coloca la pelota debajo de la planta del pie. Aplica presión rodando desde el talón hasta los dedos, buscando puntos de tensión.','timed','/assets/movements/generic.svg',0,NULL,NULL,1,10,NULL,'["Pelota pequeña"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_estiramiento-de-pantorrilla-en-bloque','Estiramiento de Pantorrilla en Bloque','Coloca la mitad delantero del pie sobre el bloque y el talón en el suelo. Fase A: Mantén la pierna totalmente recta (gemelo). Fase B: Flexiona ligeramente la rodilla (sóleo).','timed','/assets/movements/generic.svg',0,NULL,NULL,1,10,NULL,'["Bloque de yoga"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_estiramiento-de-isquiotibiales-de-pie','Estiramiento de Isquiotibiales de Pie','De pie, pies al ancho de hombros. Inclina el torso hacia adelante desde la cadera (no doblando la cintura), manteniendo la espalda lo más recta posible.','timed','/assets/movements/generic.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_elevacion-de-arco-con-banda','Elevación de Arco con Banda','De pie, coloca una banda elástica cerrada alrededor de ambos tobillos. Separa los pies para tensar la banda. Lucha contra ella empujando los bordes externos de los pies contra el suelo y elevando el arco plantar. Mantén los dedos en el suelo.','reps','/assets/movements/generic.svg',0,NULL,NULL,0,5,5,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":10}}',1777178010);
INSERT INTO movements VALUES('mv_puente-de-gluteo-a-una-pierna','Puente de Glúteo a Una Pierna','Acostado boca arriba, una pierna flexionada apoyada en el suelo, la otra estirada al aire. Eleva la cadera empujando con el talón apoyada.','reps','/assets/movements/generic.svg',0,NULL,NULL,1,5,4,'[]','{"defaultTarget":{"type":"reps","value":10}}',1777178010);
INSERT INTO movements VALUES('mv_equilibrio-a-una-pierna-reloj','Equilibrio a una pierna (Reloj)','Sobre una pierna (descalzo). Mueve la pierna libre adelante, al lado y atrás sin tocar el suelo ni rotar el tronco.','timed','/assets/movements/generic.svg',0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_pancake-stretch-sentado-en-v','Pancake Stretch (Sentado en V)','Sentado con piernas abiertas al máximo y rodillas estiradas. Inclina el torso hacia adelante desde la pelvis.','timed','/assets/movements/generic.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":120,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_cobra','Cobra','Boca abajo, extiende brazos levantando el pecho. Mantén pelvis pegada al suelo y glúteos relajados.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_dead-hang-colgado-pasivo','Dead Hang (Colgado pasivo)','Cuélgate de una barra relajando hombros y columna, dejando que el peso traccione las vértebras.','timed','/assets/movements/generic.svg',0,NULL,NULL,0,5,NULL,'["Barra"]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_caminata-lateral-con-banda-monster-walks','Caminata Lateral con Banda (Monster Walks)','Banda gruesa en tobillos o sobre rodillas. Posición de media sentadilla, da pasos laterales manteniendo tensión y rodillas alineadas.','reps','/assets/movements/generic.svg',0,NULL,NULL,1,5,4,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":15}}',1777178010);
INSERT INTO movements VALUES('mv_liberacion-de-cuadriceps-con-rodillo','Liberación de Cuádriceps con Rodillo','Boca abajo, coloca el rodillo bajo los muslos. Rueda desde la cadera hasta justo encima de la rodilla. Si encuentras un punto doloroso, detente y flexiona/estira la rodilla un par de veces.','timed','/assets/movements/generic.svg',0,NULL,NULL,1,5,NULL,'["Rodillo de espuma"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_couch-stretch','Couch Stretch','Coloca una rodilla lo más pegada posible a la esquina entre la pared y el suelo. La espinilla debe estar vertical contra la pared. La otra pierna adelante en posición de estocada. Intenta erguir el torso lentamente hasta pegar la espalda a la pared.','timed','/assets/movements/couch-stretch.svg',0,NULL,NULL,1,15,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_90-90-hip-switch','90/90 Hip Switch','Sentado en el suelo, una pierna delante flexionada a 90º y la otra detrás flexionada a 90º. Sin usar las manos (si es posible), rota las caderas para llevar las rodillas al otro lado, invirtiendo la posición de las piernas.','timed','/assets/movements/ninety-ninety-hip-switch.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_butterfly-stretch','Butterfly Stretch','Sentado, junta las plantas de los pies y deja caer las rodillas hacia los lados. Sujeta los pies y mantén la espalda recta.','timed','/assets/movements/butterfly-stretch.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":90,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_pigeon-pose','Pigeon Pose','Desde una posición de plancha o cuadrupedia, lleva la rodilla derecha hacia la muñeca derecha y el pie derecho hacia la muñeca izquierda. Desliza la pierna izquierda hacia atrás. Baja el torso hacia el suelo si la flexibilidad lo permite.','timed','/assets/movements/pigeon-pose.svg',0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_lunge-con-rotacion-toracica','Lunge con Rotación Torácica','Posición de estocada profunda (pierna derecha adelante). Apoya la mano izquierda en el suelo junto al pie derecho. Gira el torso y eleva el brazo derecho hacia el techo, siguiendo la mano con la mirada.','reps','/assets/movements/generic.svg',0,NULL,NULL,1,10,7,'[]','{"defaultTarget":{"type":"reps","value":8}}',1777178010);
INSERT INTO movements VALUES('mv_dead-bug','Dead Bug','Boca arriba, brazos y piernas a 90º. Extiende brazo y pierna contraria sin arquear la lumbar. Mantén la posición de los extremos.','reps','/assets/movements/generic.svg',0,NULL,NULL,0,5,5,'[]','{"defaultTarget":{"type":"reps","value":10}}',1777178010);
INSERT INTO movements VALUES('mv_plancha-lateral','Plancha Lateral','Apoyo en antebrazo y pies, cuerpo en línea recta. Contrae el abdomen y mantén los hombros alineados con los codos.','timed','/assets/movements/generic.svg',0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":30,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_child-s-pose-bilateral','Child''s Pose Bilateral','Arrodillado, siéntate sobre los talones y estira los brazos hacia adelante por el suelo. Baja el pecho hacia el piso, enfocándote en estirar la zona de las axilas y dorsales.','timed','/assets/movements/childs-pose.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_extensiones-toracicas-con-rodillo','Extensiones Torácicas con Rodillo','Coloca el rodillo en la espalda media/alta (omóplatos). Manos detrás de la nuca. Toma aire y arquea la espalda hacia atrás sobre el rodillo, exhala al regresar. No muevas la espalda baja.','timed','/assets/movements/thoracic-extension.svg',0,NULL,NULL,0,5,NULL,'["Rodillo de espuma"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_liberacion-de-trapecio-con-pelota','Liberación de Trapecio con Pelota','De pie o contra una pared, coloca la pelota en el trapecio superior (la zona carnosa entre cuello y hombro). Presiona y mueve el brazo ligeramente o simplemente sostén la presión.','timed','/assets/movements/generic.svg',0,NULL,NULL,1,10,NULL,'["Pelota pequeña"]','{"defaultTarget":{"type":"time","value":90,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_estiramiento-pectoral-menor-en-marco','Estiramiento Pectoral Menor en Marco','Apoya el antebrazo en el marco de una puerta, con el codo ligeramente por encima de la altura del hombro. Da un paso adelante y gira el torso levemente hacia el lado opuesto.','timed','/assets/movements/doorway-pec-stretch.svg',0,NULL,NULL,1,10,NULL,'["Marco de puerta"]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_extensiones-de-hombro-con-banda','Extensiones de Hombro con Banda','Sostén una banda por detrás de la espalda con las palmas hacia atrás. Separa las manos tensando la banda y eleva los brazos lejos del cuerpo sin inclinar el torso hacia adelante.','reps','/assets/movements/face-pulls.svg',0,NULL,NULL,0,5,3,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":15}}',1777178010);
INSERT INTO movements VALUES('mv_wall-slides-con-banda','Wall Slides con Banda','Coloca una banda pequeña alrededor de los antebrazos (cerca de los codos). Párate frente a una pared con los antebrazos apoyados en ella. Desliza los brazos hacia arriba mientras presionas hacia afuera (contra la banda) y hacia la pared.','reps','/assets/movements/scapular-wall-slides.svg',0,NULL,NULL,0,5,5,'["Banda elástica","Pared"]','{"defaultTarget":{"type":"reps","value":12}}',1777178010);
INSERT INTO movements VALUES('mv_y-raises-con-mancuernas','Y-Raises con Mancuernas','De pie, inclina el torso hacia adelante (45-90º) con la espalda recta. Levanta los brazos en forma de ''Y'' con los pulgares apuntando al techo. Pausa un segundo arriba.','reps','/assets/movements/generic.svg',0,NULL,'lbs',0,5,4,'["Mancuernas ligeras"]','{"defaultTarget":{"type":"reps","value":12}}',1777178010);
INSERT INTO movements VALUES('mv_plancha-frontal','Plancha Frontal','Apoyo en antebrazos y puntas de pie. Contrae glúteos y abdomen. Empuja el suelo con los codos para separar los omóplatos (protracción).','timed','/assets/movements/generic.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_face-pulls','Face Pulls','Con una banda anclada a altura media/alta, jala hacia la cara separando las manos y rotando los hombros hacia atrás (pose de doble bíceps).','reps','/assets/movements/face-pulls.svg',0,NULL,NULL,0,5,3,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":15}}',1777178010);
INSERT INTO movements VALUES('mv_hollow-hold','Hollow Hold','Boca arriba, levanta hombros y piernas (rodillas estiradas o flexionadas según nivel), arqueando la espalda baja (lumbar presionando el suelo). Mantén la posición activando abdomen. Parece una canoa invertida.','timed','/assets/movements/generic.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":30,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_inversion-de-tobillo-con-banda','Inversión de Tobillo con Banda','Sentado, ata una banda elástica a una pata de mesa y alrededor del tobillo. El pie rota hacia adentro (inversión) contra la resistencia, fortaleciendo tibiales para prevenir periostitis. Movimiento lento y controlado.','reps','/assets/movements/generic.svg',0,NULL,NULL,1,5,4,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":15}}',1777178010);
INSERT INTO movements VALUES('mv_perro-boca-abajo-downward-dog','Perro Boca Abajo (Downward Dog)','Desde posición de cuadrupedia, levanta caderas hacia arriba y atrás formando una V invertida. Piernas estiradas o semi-flexionadas, talones buscando el suelo. Estira toda la cadena posterior.','timed','/assets/movements/generic.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_estiramiento-de-isquiotibial-acostado-con-banda','Estiramiento de Isquiotibial Acostado con Banda','Boca arriba, coloca banda elástica alrededor del pie y eleva la pierna hacia el techo. Mantén la otra pierna estirada en el suelo. Tira suavemente de la banda para acercar la pierna al torso sin flexionar rodilla.','timed','/assets/movements/generic.svg',0,NULL,NULL,1,15,NULL,'["Banda elástica"]','{"defaultTarget":{"type":"time","value":90,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_gato-vaca-cat-cow','Gato-Vaca (Cat-Cow)','En cuadrupedia, alterna entre arquear la espalda hacia abajo (Vaca - omóplatos juntos, mira al frente) y redondear hacia arriba (Gato - omóplatos separados, barbilla al pecho). Movimiento fluido coordinado con la respiración.','reps','/assets/movements/generic.svg',0,NULL,NULL,0,5,4,'[]','{"defaultTarget":{"type":"reps","value":12}}',1777178010);
INSERT INTO movements VALUES('mv_torsion-espinal-acostado','Torsión Espinal Acostado','Boca arriba, lleva rodillas flexionadas hacia un lado mientras miras al lado opuesto. Brazos abiertos en cruz. Mantén ambos omóplatos en el suelo. Respira profundo para relajar la espalda baja.','timed','/assets/movements/generic.svg',0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_rodillas-al-pecho','Rodillas al Pecho','Boca arriba, lleva ambas rodillas flexionadas hacia el pecho y abrázalas con los brazos. Balancéate suavemente de lado a lado para masajear la zona lumbar.','timed','/assets/movements/generic.svg',0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777178010);
INSERT INTO movements VALUES('mv_balanceos-de-muneca-en-cuadrupedia','Balanceos de Muñeca en Cuadrupedia','En posición de cuadrupedia (4 patas), manos bajo hombros con dedos apuntando hacia adelante. Desplaza suavemente el peso hacia adelante hasta sentir estiramiento en muñecas, luego regresa. Incrementa progresivamente la amplitud.','reps','/assets/movements/generic.svg',0,NULL,NULL,0,5,5,'[]','{"defaultTarget":{"type":"reps","value":12}}',1777178010);
INSERT INTO movements VALUES('mv_plantar-fascia-release','Plantar Fascia Release','De pie, rueda una pelota bajo la planta del pie desde el talón hasta los metatarsos. Mantén presión en puntos de tensión y flexiona los dedos.','timed',NULL,0,NULL,NULL,1,10,NULL,'["Pelota de masaje"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_calf-stretch','Calf Stretch','Apoya la mitad delantera del pie en un bloque y el talón en el suelo. Mantén la pierna recta para el gemelo y flexiona ligeramente la rodilla para el sóleo.','timed',NULL,0,NULL,NULL,1,10,NULL,'["Bloque de yoga"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_forward-fold','Forward Fold','De pie, inclínate hacia adelante desde la cadera con una microflexión en las rodillas. Deja colgar la cabeza y relaja la zona lumbar.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_arch-raises','Arch Raises','De pie con una banda elástica alrededor de los tobillos. Empuja los bordes externos de los pies contra el suelo elevando el arco plantar sin levantar los dedos.','reps',NULL,0,NULL,NULL,0,5,5,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":10}}',1777820366);
INSERT INTO movements VALUES('mv_single-leg-glute-bridge','Single-Leg Glute Bridge','Boca arriba, una pierna flexionada apoyada y la otra estirada al aire. Eleva la cadera empujando con el talón apoyado y contrae el glúteo sin arquear la lumbar.','reps',NULL,0,NULL,NULL,1,5,4,'[]','{"defaultTarget":{"type":"reps","value":10}}',1777820366);
INSERT INTO movements VALUES('mv_single-leg-balance','Single-Leg Balance','Descalzo sobre una pierna, mueve la pierna libre adelante, al lado y atrás sin tocar el suelo. El pie de apoyo debe estabilizar activamente.','timed',NULL,0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_pancake-stretch','Pancake Stretch','Sentado con las piernas separadas. Inclina el torso hacia adelante desde la pelvis manteniendo la espalda recta.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_cobra-pose','Cobra Pose','Boca abajo, extiende los brazos levantando el pecho. Mantén la pelvis en el suelo, glúteos relajados y hombros abajo.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_dead-hang','Dead Hang','Cuélgate de una barra relajando completamente los hombros y el abdomen para descomprimir la columna.','timed',NULL,0,NULL,NULL,0,5,NULL,'["Barra"]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_monster-walks','Monster Walks','En posición de media sentadilla con una banda en los tobillos o rodillas. Da pasos laterales controlando que las rodillas no colapsen hacia adentro.','reps',NULL,0,NULL,NULL,1,5,4,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":15}}',1777820366);
INSERT INTO movements VALUES('mv_quad-release','Quad Release','Boca abajo con un rodillo bajo los muslos. Rueda lentamente desde la cadera hasta la rodilla. Detente en puntos de dolor y flexiona la rodilla suavemente.','timed',NULL,0,NULL,NULL,1,10,NULL,'["Rodillo de espuma"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_world-s-greatest-stretch','World''s Greatest Stretch','En estocada profunda, apoya la mano contraria al pie delantero en el suelo. Gira el torso y eleva el brazo libre apuntando al techo.','reps',NULL,0,NULL,NULL,1,10,7,'[]','{"defaultTarget":{"type":"reps","value":8}}',1777820366);
INSERT INTO movements VALUES('mv_side-plank','Side Plank','Apoyo sobre un antebrazo y los bordes de los pies. Contrae el abdomen y empuja el suelo con el codo para no hundir el hombro.','timed',NULL,0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":30,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_child-s-pose','Child''s Pose','Arrodillado, siéntate sobre los talones y estira los brazos hacia adelante en el suelo, bajando el pecho para relajar la espalda.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_thoracic-roller-extensions','Thoracic Roller Extensions','Coloca un rodillo en la espalda media. Con las manos tras la nuca, arquea la parte superior de la espalda sobre el rodillo sin mover la zona lumbar.','reps',NULL,0,NULL,NULL,0,5,5,'["Rodillo de espuma"]','{"defaultTarget":{"type":"reps","value":10}}',1777820366);
INSERT INTO movements VALUES('mv_trap-release','Trap Release','Presiona una pelota entre una pared y tu trapecio superior. Aplica peso corporal y mueve el brazo arriba y abajo para masajear el músculo.','timed',NULL,0,NULL,NULL,1,10,NULL,'["Pelota de masaje","Pared"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_doorway-pec-stretch','Doorway Pec Stretch','Apoya el antebrazo en un marco de puerta a 90 grados. Da un paso adelante y gira levemente el torso en dirección opuesta al brazo.','timed',NULL,0,NULL,NULL,1,10,NULL,'["Marco de puerta"]','{"defaultTarget":{"type":"time","value":45,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_band-pull-aparts','Band Pull-Aparts','Sujeta una banda a la altura del pecho. Mantén los brazos estirados y separa las manos hasta que la banda toque tu cuerpo, juntando los omóplatos.','reps',NULL,0,NULL,NULL,0,5,3,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":15}}',1777820366);
INSERT INTO movements VALUES('mv_scapular-wall-slides','Scapular Wall Slides','Con una banda en los antebrazos, apóyalos contra una pared. Desliza los brazos hacia arriba manteniendo la tensión hacia afuera.','reps',NULL,0,NULL,NULL,0,5,5,'["Banda elástica","Pared"]','{"defaultTarget":{"type":"reps","value":12}}',1777820366);
INSERT INTO movements VALUES('mv_y-raises','Y-Raises','Con el torso inclinado hacia adelante y espalda recta, eleva mancuernas ligeras formando una Y con los brazos. Inicia el movimiento desde las escápulas.','reps',NULL,0,NULL,'lbs',0,5,4,'["Mancuernas"]','{"defaultTarget":{"type":"reps","value":12}}',1777820366);
INSERT INTO movements VALUES('mv_front-plank','Front Plank','Apoyo en antebrazos y puntas de los pies. Contrae abdomen y glúteos mientras empujas el suelo para separar los omóplatos.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_ankle-inversion','Ankle Inversion','Con una banda anclada lateralmente al pie, rota el tobillo hacia adentro contra la resistencia de forma lenta y controlada.','reps',NULL,0,NULL,NULL,1,5,4,'["Banda elástica"]','{"defaultTarget":{"type":"reps","value":15}}',1777820366);
INSERT INTO movements VALUES('mv_downward-dog','Downward Dog','Desde cuadrupedia, eleva la cadera formando una V invertida. Empuja el suelo con las manos y alarga la columna, flexionando las rodillas si es necesario.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_supine-hamstring-stretch','Supine Hamstring Stretch','Boca arriba, coloca una banda en el pie y eleva la pierna recta. Tira suavemente para acercar la pierna al torso sin levantar la cadera.','timed',NULL,0,NULL,NULL,1,15,NULL,'["Banda elástica"]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_cat-cow','Cat-Cow','En cuadrupedia, alterna entre arquear la espalda hacia abajo al inhalar y redondearla hacia arriba empujando el suelo al exhalar.','reps',NULL,0,NULL,NULL,0,5,5,'[]','{"defaultTarget":{"type":"reps","value":10}}',1777820366);
INSERT INTO movements VALUES('mv_supine-spinal-twist','Supine Spinal Twist','Boca arriba, cruza una rodilla sobre tu cuerpo hacia el suelo mientras mantienes el brazo opuesto extendido y anclado al piso.','timed',NULL,0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_knees-to-chest','Knees to Chest','Boca arriba, abraza tus rodillas contra el pecho. Realiza movimientos suaves para masajear la zona lumbar contra el suelo.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_quadruped-wrist-rocks','Quadruped Wrist Rocks','En cuadrupedia con las manos bajo los hombros, balancea tu peso ligeramente hacia adelante hasta sentir el estiramiento en las muñecas y regresa.','reps',NULL,0,NULL,NULL,0,5,5,'[]','{"defaultTarget":{"type":"reps","value":12}}',1777820366);
INSERT INTO movements VALUES('mv_deep-squat-hold','Deep Squat Hold','Baja a una sentadilla profunda manteniendo los talones apoyados. Usa los codos para empujar suavemente las rodillas hacia afuera y mantén el pecho erguido.','timed',NULL,0,NULL,NULL,0,5,NULL,'[]','{"defaultTarget":{"type":"time","value":60,"unit":"s"}}',1777820366);
INSERT INTO movements VALUES('mv_thread-the-needle','Thread the Needle','Desde cuadrupedia, desliza un brazo por debajo del torso hasta que el hombro y la cabeza toquen el suelo. Siente la torsión en la espalda media.','timed',NULL,0,NULL,NULL,1,10,NULL,'[]','{"defaultTarget":{"type":"time","value":30,"unit":"s"}}',1777820366);
CREATE TABLE `practice_data` (
	`id` text PRIMARY KEY NOT NULL,
	`practice_log_id` text NOT NULL,
	`movement_id` text NOT NULL,
	`movement_name` text NOT NULL,
	`movement_type` text NOT NULL,
	`target_type` text NOT NULL,
	`target_value` integer NOT NULL,
	`order` integer NOT NULL,
	`set_number` integer NOT NULL,
	`side` text,
	`value` integer NOT NULL,
	`weight` integer,
	`weight_unit` text,
	`custom_measurement` text,
	`rating` integer,
	`status` text DEFAULT 'completed' NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`practice_log_id`) REFERENCES `practice_logs`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO practice_data VALUES('nZPPoEvcSSlseHnEThm8t','HLywipkrxE2559TCNDu_U','mv_caminata-lateral-con-banda-monster-walks','Caminata Lateral con Banda (Monster Walks)','reps','reps',15,1,1,'left',1,NULL,NULL,NULL,NULL,'completed',1777256687);
INSERT INTO practice_data VALUES('iE-ws-EK7CUq2EEUHjKBl','HLywipkrxE2559TCNDu_U','mv_caminata-lateral-con-banda-monster-walks','Caminata Lateral con Banda (Monster Walks)','reps','reps',15,1,2,'left',0,NULL,NULL,NULL,NULL,'completed',1777256687);
INSERT INTO practice_data VALUES('VIt7Ym2QjhFuDoQcW4iEX','HLywipkrxE2559TCNDu_U','mv_caminata-lateral-con-banda-monster-walks','Caminata Lateral con Banda (Monster Walks)','reps','reps',15,1,2,'right',0,NULL,NULL,NULL,NULL,'completed',1777256687);
INSERT INTO practice_data VALUES('LUluPS4sBbeZwrwX7dI3O','HLywipkrxE2559TCNDu_U','mv_caminata-lateral-con-banda-monster-walks','Caminata Lateral con Banda (Monster Walks)','reps','reps',15,1,1,'right',0,NULL,NULL,NULL,NULL,'skipped',1777256687);
CREATE TABLE `practice_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`user_id` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration` integer,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO practice_logs VALUES('5664lFHEVzehTLHoYY3ck','rt_desbloqueo-de-cadera',NULL,1777215536,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('jOPGRiTCpJfGAnxLi-thG','rt_desbloqueo-de-cadera',NULL,1777254313,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('AFTC_wsHJXhr96f8XTqcG','rt_desbloqueo-de-cadera',NULL,1777255330,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('-ICLiWe9tuH-F0V11iXme','rt_desbloqueo-de-cadera',NULL,1777255350,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('niVyyNKaUS8GuN1GZNtYY','rt_desbloqueo-de-cadera',NULL,1777255454,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('YTT0-F8rnO_xAt5AZvWEp','rt_desbloqueo-de-cadera',NULL,1777255966,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('HLywipkrxE2559TCNDu_U','rt_desbloqueo-de-cadera',NULL,1777256651,1777256687,0,NULL);
INSERT INTO practice_logs VALUES('JSDOqlIfPlLPj39ml5NZv','rt_desbloqueo-de-cadera',NULL,1777256712,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('qhbosHTDriz0KRgyxy1Td','rt_desbloqueo-de-cadera',NULL,1777257303,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('Q_aPSxqCDTyoVri6p2Nwr','rt_desbloqueo-de-cadera',NULL,1777260216,NULL,NULL,NULL);
INSERT INTO practice_logs VALUES('T8ClaxhkUCV397qeF67ZW','rt_desbloqueo-de-cadera',NULL,1777260237,1777260254,0,NULL);
INSERT INTO practice_logs VALUES('2hO973Enj38D0YPzWIWIQ','rt_desbloqueo-de-cadera',NULL,1777261375,1777261399,0,NULL);
INSERT INTO practice_logs VALUES('87KQNbhdxRqN43Y6SXNQc','rt_desbloqueo-de-cadera',NULL,1777261434,NULL,NULL,NULL);
CREATE TABLE `routine_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`movement_id` text NOT NULL,
	`order` integer NOT NULL,
	`target` text NOT NULL,
	`sets` integer DEFAULT 1 NOT NULL,
	`is_bilateral` integer DEFAULT false NOT NULL,
	`switch_sides_duration` integer DEFAULT 5 NOT NULL,
	`weight` integer,
	`weight_unit` text,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`movement_id`) REFERENCES `movements`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-liberacion-plantar-con-pelota-1','rt_cimientos-y-cadena-posterior','mv_liberacion-plantar-con-pelota',1,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,'1 minuto por pie');
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-estiramiento-de-pantorrilla-en-bloque-2','rt_cimientos-y-cadena-posterior','mv_estiramiento-de-pantorrilla-en-bloque',2,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,'30s pierna recta, 30s flexionada');
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-equilibrio-a-una-pierna-reloj-3','rt_cimientos-y-cadena-posterior','mv_equilibrio-a-una-pierna-reloj',3,'{"type":"time","value":45,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-elevacion-de-arco-con-banda-4','rt_cimientos-y-cadena-posterior','mv_elevacion-de-arco-con-banda',4,'{"type":"reps","value":10}',3,0,5,NULL,NULL,'3 retenciones de 3 segundos');
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-estiramiento-de-isquiotibiales-de-pie-5','rt_cimientos-y-cadena-posterior','mv_estiramiento-de-isquiotibiales-de-pie',5,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-pancake-stretch-sentado-en-v-6','rt_cimientos-y-cadena-posterior','mv_pancake-stretch-sentado-en-v',6,'{"type":"time","value":120,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-cobra-7','rt_cimientos-y-cadena-posterior','mv_cobra',7,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-dead-hang-colgado-pasivo-8','rt_cimientos-y-cadena-posterior','mv_dead-hang-colgado-pasivo',8,'{"type":"time","value":45,"unit":"s"}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-puente-de-gluteo-a-una-pierna-9','rt_cimientos-y-cadena-posterior','mv_puente-de-gluteo-a-una-pierna',9,'{"type":"reps","value":10}',2,1,5,NULL,NULL,'Pausa de 2s arriba');
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-inversion-de-tobillo-con-banda-10','rt_cimientos-y-cadena-posterior','mv_inversion-de-tobillo-con-banda',10,'{"type":"reps","value":15}',2,1,5,NULL,NULL,'Fortalecimiento para prevenir periostitis');
INSERT INTO routine_movements VALUES('rm_hombros-blindados-child-s-pose-bilateral-1','rt_hombros-blindados','mv_child-s-pose-bilateral',1,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-extensiones-toracicas-con-rodillo-2','rt_hombros-blindados','mv_extensiones-toracicas-con-rodillo',2,'{"type":"reps","value":10}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-liberacion-de-trapecio-con-pelota-3','rt_hombros-blindados','mv_liberacion-de-trapecio-con-pelota',3,'{"type":"time","value":90,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-estiramiento-pectoral-menor-en-marco-4','rt_hombros-blindados','mv_estiramiento-pectoral-menor-en-marco',4,'{"type":"time","value":45,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-extensiones-de-hombro-con-banda-5','rt_hombros-blindados','mv_extensiones-de-hombro-con-banda',5,'{"type":"reps","value":15}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-wall-slides-con-banda-6','rt_hombros-blindados','mv_wall-slides-con-banda',6,'{"type":"reps","value":12}',3,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-y-raises-con-mancuernas-7','rt_hombros-blindados','mv_y-raises-con-mancuernas',7,'{"type":"reps","value":12}',3,0,5,5,'lbs',NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-plancha-frontal-8','rt_hombros-blindados','mv_plancha-frontal',8,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-face-pulls-9','rt_hombros-blindados','mv_face-pulls',9,'{"type":"reps","value":15}',2,0,5,NULL,NULL,'Opcional');
INSERT INTO routine_movements VALUES('rm_hombros-blindados-balanceos-de-muneca-en-cuadrupedia-10','rt_hombros-blindados','mv_balanceos-de-muneca-en-cuadrupedia',10,'{"type":"reps","value":12}',2,0,5,NULL,NULL,'Movimiento suave, progresivo. Para trabajo de movilidad en extensión');
INSERT INTO routine_movements VALUES('rm_piernas-frescas-liberacion-plantar-con-pelota-1','rt_piernas-frescas','mv_liberacion-plantar-con-pelota',1,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,'1 minuto por pie');
INSERT INTO routine_movements VALUES('rm_piernas-frescas-liberacion-de-cuadriceps-con-rodillo-2','rt_piernas-frescas','mv_liberacion-de-cuadriceps-con-rodillo',2,'{"type":"time","value":60,"unit":"s"}',1,1,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-estiramiento-de-pantorrilla-en-bloque-3','rt_piernas-frescas','mv_estiramiento-de-pantorrilla-en-bloque',3,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,'30s pierna recta, 30s flexionada');
INSERT INTO routine_movements VALUES('rm_piernas-frescas-couch-stretch-4','rt_piernas-frescas','mv_couch-stretch',4,'{"type":"time","value":75,"unit":"s"}',1,1,15,NULL,NULL,'Focus en flexores de cadera (castigados en ciclismo)');
INSERT INTO routine_movements VALUES('rm_piernas-frescas-pigeon-pose-5','rt_piernas-frescas','mv_pigeon-pose',5,'{"type":"time","value":75,"unit":"s"}',1,1,15,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-perro-boca-abajo-downward-dog-6','rt_piernas-frescas','mv_perro-boca-abajo-downward-dog',6,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,'Pedalear pies suavemente para profundizar el estiramiento');
INSERT INTO routine_movements VALUES('rm_piernas-frescas-estiramiento-de-isquiotibial-acostado-con-banda-7','rt_piernas-frescas','mv_estiramiento-de-isquiotibial-acostado-con-banda',7,'{"type":"time","value":90,"unit":"s"}',1,1,15,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-90-90-hip-switch-8','rt_piernas-frescas','mv_90-90-hip-switch',8,'{"type":"time","value":75,"unit":"s"}',1,0,5,NULL,NULL,'Movimiento continuo y fluido');
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-child-s-pose-bilateral-1','rt_estiramiento-nocturno','mv_child-s-pose-bilateral',1,'{"type":"time","value":75,"unit":"s"}',1,0,5,NULL,NULL,'Respiración profunda, enfocado en la espalda media');
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-gato-vaca-cat-cow-2','rt_estiramiento-nocturno','mv_gato-vaca-cat-cow',2,'{"type":"reps","value":12}',1,0,5,NULL,NULL,'Coordinar con respiración: arquear al inhalar, redondear al exhalar');
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-torsion-espinal-acostado-3','rt_estiramiento-nocturno','mv_torsion-espinal-acostado',3,'{"type":"time","value":75,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-rodillas-al-pecho-4','rt_estiramiento-nocturno','mv_rodillas-al-pecho',4,'{"type":"time","value":75,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-butterfly-stretch-5','rt_estiramiento-nocturno','mv_butterfly-stretch',5,'{"type":"time","value":120,"unit":"s"}',1,0,5,NULL,NULL,'Versión relajada, no forzar las rodillas');
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-pancake-stretch-sentado-en-v-6','rt_estiramiento-nocturno','mv_pancake-stretch-sentado-en-v',6,'{"type":"time","value":150,"unit":"s"}',1,0,5,NULL,NULL,'Versión chill: rodillas pueden estar levemente flexionadas si es necesario');
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-90-90-hip-switch-4','rt_desbloqueo-de-cadera','mv_90-90-hip-switch',0,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,'Movimiento continuo, cambiando de lado');
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-liberacion-de-cuadriceps-con-rodillo-2','rt_desbloqueo-de-cadera','mv_liberacion-de-cuadriceps-con-rodillo',1,'{"type":"time","value":60,"unit":"s"}',1,1,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-butterfly-stretch-5','rt_desbloqueo-de-cadera','mv_butterfly-stretch',2,'{"type":"time","value":90,"unit":"s"}',4,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-pigeon-pose-6','rt_desbloqueo-de-cadera','mv_pigeon-pose',3,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-lunge-con-rotacion-toracica-7','rt_desbloqueo-de-cadera','mv_lunge-con-rotacion-toracica',4,'{"type":"reps","value":8}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-hollow-hold-8','rt_desbloqueo-de-cadera','mv_hollow-hold',5,'{"type":"time","value":30,"unit":"s"}',3,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-plancha-lateral-9','rt_desbloqueo-de-cadera','mv_plancha-lateral',6,'{"type":"time","value":30,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('8tAK7DdEQKH65oTcPUM9s','rt_desbloqueo-de-cadera','mv_dead-hang-colgado-pasivo',7,'{"type":"time","value":45,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('X6B3Nv4k5xvs9assjS57Q','rt_desbloqueo-de-cadera','mv_inversion-de-tobillo-con-banda',8,'{"type":"reps","value":15}',1,1,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('TjPvm61dkAcdzYfYQJXwr','rt_desbloqueo-de-cadera','mv_child-s-pose-bilateral',9,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('YDyxd0axj5PCa2Yb4Ax_T','rt_desbloqueo-de-cadera','mv_cobra',10,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('hsBky-1Vj5HpI3AKEF305','rt_desbloqueo-de-cadera','mv_estiramiento-de-isquiotibiales-de-pie',11,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('eTIR7SRiVc5iZUnuzMU0S','rt_desbloqueo-de-cadera','mv_child-s-pose-bilateral',12,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-child-s-pose-1','rt_15-minute-full-body','mv_child-s-pose',1,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-cat-cow-2','rt_15-minute-full-body','mv_cat-cow',2,'{"type":"reps","value":12}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-thread-the-needle-3','rt_15-minute-full-body','mv_thread-the-needle',3,'{"type":"time","value":30,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-downward-dog-4','rt_15-minute-full-body','mv_downward-dog',4,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-deep-squat-hold-5','rt_15-minute-full-body','mv_deep-squat-hold',5,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-world-s-greatest-stretch-6','rt_15-minute-full-body','mv_world-s-greatest-stretch',6,'{"type":"reps","value":6}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-forward-fold-7','rt_15-minute-full-body','mv_forward-fold',7,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-90-90-hip-switch-8','rt_15-minute-full-body','mv_90-90-hip-switch',8,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-pigeon-pose-9','rt_15-minute-full-body','mv_pigeon-pose',9,'{"type":"time","value":30,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-supine-spinal-twist-10','rt_15-minute-full-body','mv_supine-spinal-twist',10,'{"type":"time","value":30,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_15-minute-full-body-dead-bug-11','rt_15-minute-full-body','mv_dead-bug',11,'{"type":"reps","value":10}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-plantar-fascia-release-1','rt_cimientos-y-cadena-posterior','mv_plantar-fascia-release',1,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-calf-stretch-2','rt_cimientos-y-cadena-posterior','mv_calf-stretch',2,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-single-leg-balance-3','rt_cimientos-y-cadena-posterior','mv_single-leg-balance',3,'{"type":"time","value":45,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-arch-raises-4','rt_cimientos-y-cadena-posterior','mv_arch-raises',4,'{"type":"reps","value":10}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-forward-fold-5','rt_cimientos-y-cadena-posterior','mv_forward-fold',5,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-pancake-stretch-6','rt_cimientos-y-cadena-posterior','mv_pancake-stretch',6,'{"type":"time","value":60,"unit":"s"}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-cobra-pose-7','rt_cimientos-y-cadena-posterior','mv_cobra-pose',7,'{"type":"time","value":45,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-dead-hang-8','rt_cimientos-y-cadena-posterior','mv_dead-hang',8,'{"type":"time","value":45,"unit":"s"}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-single-leg-glute-bridge-9','rt_cimientos-y-cadena-posterior','mv_single-leg-glute-bridge',9,'{"type":"reps","value":10}',2,1,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_cimientos-y-cadena-posterior-ankle-inversion-10','rt_cimientos-y-cadena-posterior','mv_ankle-inversion',10,'{"type":"reps","value":15}',2,1,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-monster-walks-1','rt_desbloqueo-de-cadera','mv_monster-walks',1,'{"type":"reps","value":15}',1,1,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-quad-release-2','rt_desbloqueo-de-cadera','mv_quad-release',2,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-couch-stretch-3','rt_desbloqueo-de-cadera','mv_couch-stretch',3,'{"type":"time","value":45,"unit":"s"}',2,1,15,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-world-s-greatest-stretch-7','rt_desbloqueo-de-cadera','mv_world-s-greatest-stretch',7,'{"type":"reps","value":8}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_desbloqueo-de-cadera-side-plank-9','rt_desbloqueo-de-cadera','mv_side-plank',9,'{"type":"time","value":30,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-child-s-pose-1','rt_hombros-blindados','mv_child-s-pose',1,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-thoracic-roller-extensions-2','rt_hombros-blindados','mv_thoracic-roller-extensions',2,'{"type":"reps","value":10}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-trap-release-3','rt_hombros-blindados','mv_trap-release',3,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-doorway-pec-stretch-4','rt_hombros-blindados','mv_doorway-pec-stretch',4,'{"type":"time","value":45,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-band-pull-aparts-5','rt_hombros-blindados','mv_band-pull-aparts',5,'{"type":"reps","value":15}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-scapular-wall-slides-6','rt_hombros-blindados','mv_scapular-wall-slides',6,'{"type":"reps","value":12}',3,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-y-raises-7','rt_hombros-blindados','mv_y-raises',7,'{"type":"reps","value":12}',3,0,5,5,'lbs',NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-front-plank-8','rt_hombros-blindados','mv_front-plank',8,'{"type":"time","value":45,"unit":"s"}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_hombros-blindados-quadruped-wrist-rocks-10','rt_hombros-blindados','mv_quadruped-wrist-rocks',10,'{"type":"reps","value":12}',2,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-plantar-fascia-release-1','rt_piernas-frescas','mv_plantar-fascia-release',1,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-quad-release-2','rt_piernas-frescas','mv_quad-release',2,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-calf-stretch-3','rt_piernas-frescas','mv_calf-stretch',3,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-downward-dog-6','rt_piernas-frescas','mv_downward-dog',6,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_piernas-frescas-supine-hamstring-stretch-7','rt_piernas-frescas','mv_supine-hamstring-stretch',7,'{"type":"time","value":60,"unit":"s"}',2,1,15,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-child-s-pose-1','rt_estiramiento-nocturno','mv_child-s-pose',1,'{"type":"time","value":75,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-cat-cow-2','rt_estiramiento-nocturno','mv_cat-cow',2,'{"type":"reps","value":12}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-supine-spinal-twist-3','rt_estiramiento-nocturno','mv_supine-spinal-twist',3,'{"type":"time","value":60,"unit":"s"}',1,1,10,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-knees-to-chest-4','rt_estiramiento-nocturno','mv_knees-to-chest',4,'{"type":"time","value":60,"unit":"s"}',1,0,5,NULL,NULL,NULL);
INSERT INTO routine_movements VALUES('rm_estiramiento-nocturno-pancake-stretch-6','rt_estiramiento-nocturno','mv_pancake-stretch',6,'{"type":"time","value":90,"unit":"s"}',1,0,5,NULL,NULL,NULL);
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`user_id` text,
	`rest_between_movements` integer DEFAULT 30 NOT NULL,
	`rest_between_sets` integer DEFAULT 15 NOT NULL,
	`auto_advance` integer DEFAULT true NOT NULL,
	`audio_enabled` integer DEFAULT true NOT NULL,
	`keep_awake` integer DEFAULT true NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO routines VALUES('rt_cimientos-y-cadena-posterior','Cimientos y Cadena Posterior','Foco: Pies, tobillos, isquiotibiales y espalda baja. Equipo: Pelota pequeña, Bloque de yoga, Banda elástica.',NULL,15,30,1,1,1,0,1777178010);
INSERT INTO routines VALUES('rt_desbloqueo-de-cadera','Desbloqueo de Cadera','Foco: Flexores, cuádriceps, aductores y core. Equipo: Rodillo de espuma (Foam Roller).',NULL,15,30,1,1,1,0,1777178010);
INSERT INTO routines VALUES('rt_hombros-blindados','Hombros Blindados','Foco: Hombros, escápula, dorsales y tórax. Equipo: Rodillo, Pelota, Banda elástica, Mancuernas ligeras.',NULL,15,45,1,1,1,0,1777178010);
INSERT INTO routines VALUES('rt_piernas-frescas','Piernas Frescas','Recuperación post-fondo (carrera o ciclismo). Foco: Descarga de piernas, flexores de cadera, isquiotibiales y fascial. Ideal tras 10-30min de caminata de enfriamiento activo. Equipo: Pelota, Rodillo, Bloque, Banda.',NULL,20,30,1,1,1,0,1777178010);
INSERT INTO routines VALUES('rt_estiramiento-nocturno','Estiramiento Nocturno','Rutina suave y relajante sin trabajo de fuerza. Foco: Espalda baja, caderas, espalda media. Perfecta para finalizar el día de forma tranquila. Equipo: Solo una banda opcional.',NULL,10,20,1,1,0,0,1777178010);
INSERT INTO routines VALUES('rt_15-minute-full-body','15-Minute Full Body','Rutina eficiente de cuerpo completo utilizando movimientos compuestos de movilidad. Ideal para mantenimiento diario.',NULL,15,0,1,1,1,0,1777820366);
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO session VALUES('BlQdbH0NIrBjDzPRh0TJSDlTEYzo5YaX','PEd9PAtLUFc6wgrW4DXKkFbfZ65AAyCN',1777782810,'gTCEmVH8h7Fx7WTzAIQ8YfpunrlPrVC4',1777178010,1777178010,'','');
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`name` text,
	`username` text,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`password_hash` text,
	`preferences` text,
	`api_key_hash` text,
	`api_key_prefix` text,
	`api_key_created_at` integer,
	`api_key_last_used_at` integer
);
INSERT INTO user VALUES('PEd9PAtLUFc6wgrW4DXKkFbfZ65AAyCN','test@example.com',0,'Test User','testuser',NULL,1777178010,1777178010,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE UNIQUE INDEX `user_api_key_hash_unique` ON `user` (`api_key_hash`);
COMMIT;
