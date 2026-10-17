// Movement group: standing. See core.js for the pose format and shared building blocks.
// eslint-disable-next-line no-unused-vars
import { ARMS_DOWN, LEGS_STRAIGHT, STAND, QUAD_HIP_Y, QUAD_LEGS, QUAD_HANDS, QUAD_WRISTS, QUAD_NEUTRAL, pitch } from './core.js';

// Standing poses need at least one leg posed by bone directions: grounding
// runs with IK limbs parked straight up, so a pose with both feet on IK would
// rest on its hands. Convention here: the support (right) leg is posed by
// direction, the working (left) leg by IK when it touches a prop.

// Invisible bone-following point for bands (a wall shrunk to a sliver): band
// `through` only takes joint centres, and a mini band has to wrap the OUTSIDE
// of the ankles/knees. Mirroring swaps the bone and flips the offset for free.
const pin = (id, bone, offset) => ({ kind: 'wall', id, width: 1e-4, height: 1e-4, frame: false, at: { bone, offset } });
/** Mini band looped around both legs at `bone` (LeftFoot = ankles, LeftLeg = knees). */
function miniBand(bone, { r = 0.04, y = 0.04 } = {}) {
	const right = bone.replace('Left', 'Right');
	const pins = [
		pin(`${bone}-f`, bone, [0, y, r]),
		pin(`${bone}-o`, bone, [r, y, 0]),
		pin(`${bone}-b`, bone, [0, y, -r]),
		pin(`${right}-b`, right, [0, y, -r]),
		pin(`${right}-o`, right, [-r, y, 0]),
		pin(`${right}-f`, right, [0, y, r])
	];
	return [...pins, { kind: 'band', loop: true, width: 0.008, through: pins.map((p) => ({ prop: p.id })) }];
}
const mirrorX = (a) => [-a[0], a[1], a[2]];
/** Right-side copy of a left-side bone map ({dir, face}). */
function both(left) {
	const out = {};
	for (const [k, v] of Object.entries(left)) {
		out[k] = v;
		out[k.replace(/^Left/, 'Right')] = { dir: mirrorX(v.dir), ...(v.face && { face: mirrorX(v.face) }) };
	}
	return out;
}

// Hands resting on the iliac crests, elbows out to the sides.
const HANDS_ON_HIPS = both({
	LeftShoulder: { dir: [1, -0.15, -0.02], face: [0, 0, 1] },
	LeftArm: { dir: [0.8, -0.55, -0.3], face: [0, 0, 1] },
	LeftForeArm: { dir: [-0.45, -0.85, 0.22], face: [0, 0, 1] },
	LeftHand: { dir: [-0.3, -0.35, 0.9], face: [0, 1, 0.3] }
});

const LEFT_FOOT_FLAT = { dir: [0.05, -0.55, 1], face: [0, 1, 0.5] };

// ------------------------------------------------- plantar fascia release

// Ball fixed on the floor in front of the left hip; the left foot rolls over it
// from heel (ankle just in front of the ball) to metatarsals (ankle behind it).
const PF_BALL = [0.14, 0, 0.24];
const PF_ANKLE_Y = 0.14; // ball top + heel pad (compromise across the cast: ankle heights differ ~3 cm)
const pfPose = (dz, footDir = LEFT_FOOT_FLAT) => ({
	hips: { pos: [-0.02, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		...STAND.bones,
		...HANDS_ON_HIPS,
		Neck: [0, 1, 0.12],
		Head: { dir: [0, 0.9, 0.42], face: [0, -0.4, 1] },
		LeftFoot: footDir
	},
	ik: { LeftFoot: { target: [PF_BALL[0], PF_ANKLE_Y, PF_BALL[2] + dz], pole: [0.15, 0, 1] } }
});

const PLANTAR = {
	id: 'plantar-fascia-release',
	name: 'Plantar Fascia Release',
	seed: 'Plantar Fascia Release',
	bilateral: true,
	view: { azimuth: 70, elevation: 8 },
	icon: 'heel',
	props: [{ kind: 'ball', pos: PF_BALL }],
	poses: {
		heel: pfPose(0.03),
		arch: pfPose(-0.05),
		fore: pfPose(-0.11)
	},
	timeline: [
		{ pose: 'heel', hold: 0.5, in: 1.6 },
		{ pose: 'arch', in: 1.2, hold: 0.2 },
		{ pose: 'fore', in: 1.2, hold: 0.5 },
		{ pose: 'arch', in: 1.2, hold: 0.2 }
	]
};

// ------------------------------------------------------------ calf stretch

// Left forefoot on a block (9.5 cm tall), heel on the floor; the block follows
// the left toes on the floor plane. The right foot stands flat a little behind.
// Straight knee = gastrocnemius; soft knee = soleus.
const CALF_ANKLE = [0.12, 0.09, 0.12];
const calfPose = ({ hipsZ, lean, rightThigh, rightShin }) => ({
	hips: { pos: [0, 1, hipsZ], dir: [0, 1, lean], face: [0, -lean, 1] },
	bones: {
		...STAND.bones,
		...HANDS_ON_HIPS,
		Spine: [0, 1, lean],
		Spine1: [0, 1, lean * 0.6],
		Spine2: [0, 1, 0],
		RightUpLeg: { dir: rightThigh, face: [0, 0, 1] },
		RightLeg: { dir: rightShin, face: [0, 0, 1] },
		RightFoot: { dir: [-0.05, -0.55, 1], face: [0, 1, 0.5] },
		// Toes up on the block: ~30deg dorsiflexion from a flat foot.
		LeftFoot: { dir: [0.05, 0.1, 1], face: [0, 1, -0.1] },
		LeftToeBase: { dir: [0.05, 0, 1], face: [0, 1, 0] }
	},
	ik: { LeftFoot: { target: CALF_ANKLE, pole: [0.1, 0, 1] } }
});

const CALF = {
	id: 'calf-stretch',
	name: 'Calf Stretch',
	seed: 'Calf Stretch',
	bilateral: true,
	view: { azimuth: 70, elevation: 10 },
	icon: 'straight',
	props: [{ kind: 'block', pos: [0, 0, 0], at: { bone: 'LeftToeBase', offset: [0, 0, 0.045] }, axes: 'xz' }],
	poses: {
		straight: calfPose({ hipsZ: 0.14, lean: 0.08, rightThigh: [-0.04, -1, -0.13], rightShin: [-0.02, -1, -0.13] }),
		bent: calfPose({ hipsZ: 0.16, lean: 0.14, rightThigh: [-0.04, -1, 0.12], rightShin: [-0.02, -1, -0.5] })
	},
	timeline: [
		{ pose: 'straight', hold: 2.0, in: 1.6 },
		{ pose: 'bent', in: 1.6, hold: 2.0 }
	]
};

// ------------------------------------------------------------- arch raises

const ARCH_FLAT = {
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: { ...STAND.bones, ...HANDS_ON_HIPS }
};
// Arch lift: thighs rotate out a touch (knees track over the little toes),
// feet roll onto their outer edge while the toes stay down.
const ARCH_UP = {
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		...STAND.bones,
		...HANDS_ON_HIPS,
		...both({
			LeftUpLeg: { dir: [0.07, -1, 0.04], face: [0.4, 0, 1] },
			LeftLeg: { dir: [0.02, -1, -0.04], face: [0.35, 0, 1] },
			LeftFoot: { dir: [0.05, -0.55, 1], face: [-0.45, 1, 0.5] }
		})
	}
};

const ARCHES = {
	id: 'arch-raises',
	name: 'Arch Raises',
	seed: 'Arch Raises',
	view: { azimuth: 20, elevation: 12 },
	icon: 'up',
	props: miniBand('LeftFoot'),
	poses: { flat: ARCH_FLAT, up: ARCH_UP },
	timeline: [
		{ pose: 'flat', hold: 1.0, in: 1.2 },
		{ pose: 'up', in: 1.2, hold: 1.4 }
	]
};

// -------------------------------------------------------- single-leg balance

const balancePose = (leftLeg) => ({
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		...STAND.bones,
		...HANDS_ON_HIPS,
		// Support foot under the body's midline.
		RightUpLeg: { dir: [0.05, -1, 0], face: [0, 0, 1] },
		RightLeg: { dir: [0.02, -1, -0.02], face: [0, 0, 1] },
		...leftLeg
	}
});

const BALANCE = {
	id: 'single-leg-balance',
	name: 'Single-Leg Balance',
	seed: 'Single-Leg Balance',
	bilateral: true,
	view: { azimuth: 60, elevation: 6 },
	icon: 'knee',
	poses: {
		stand: balancePose({}),
		// Knee lift: the clearest "standing on one leg" silhouette (icon).
		knee: balancePose({
			LeftUpLeg: { dir: [0.06, -0.32, 1], face: [0, 1, 0.32] },
			LeftLeg: { dir: [0.02, -1, 0.06], face: [0, 0.06, 1] },
			LeftFoot: { dir: [0.05, -0.65, 1], face: [0, 1, 0.65] }
		}),
		front: balancePose({
			LeftUpLeg: { dir: [0.05, -0.71, 0.71], face: [0, 0.71, 0.71] },
			LeftLeg: { dir: [0.03, -0.94, 0.34], face: [0, 0.34, 0.94] },
			LeftFoot: { dir: [0.05, -0.75, 1], face: [0, 1, 0.75] }
		}),
		side: balancePose({
			LeftUpLeg: { dir: [0.62, -1, 0.03], face: [0, 0, 1] },
			LeftLeg: { dir: [0.58, -1, 0], face: [0, 0, 1] },
			LeftFoot: { dir: [0.15, -0.6, 1], face: [0, 1, 0.6] }
		}),
		back: balancePose({
			LeftUpLeg: { dir: [0.05, -1, -0.55], face: [0, -0.55, 1] },
			LeftLeg: { dir: [0.03, -1, -0.95], face: [0, -0.95, 1] },
			LeftFoot: { dir: [0.05, -0.75, 0.7], face: [0, 0.7, 0.75] }
		})
	},
	timeline: [
		{ pose: 'stand', hold: 0.4, in: 1.0 },
		{ pose: 'knee', in: 1.1, hold: 0.8 },
		{ pose: 'front', in: 0.9, hold: 0.6 },
		{ pose: 'side', in: 1.0, hold: 0.6 },
		{ pose: 'back', in: 1.0, hold: 0.6 }
	]
};

// ------------------------------------------------------------ monster walks

// Half squat, band around the knees. The right (support) leg is posed by
// direction; the left foot steps out to the side and back on IK.
const HALF_SQUAT_TORSO = {
	Spine: [0, 1, 0.35],
	Spine1: [0, 1, 0.3],
	Spine2: [0, 1, 0.2],
	Neck: [0, 1, 0.2],
	Head: { dir: [0, 1, 0.1], face: [0, 0, 1] }
};
const MONSTER_Z = 0.1;
const monsterPose = (footX, footY = 0.086, hipsX = 0) => ({
	hips: { pos: [hipsX, 0.8, 0], dir: [0, 1, 0.45], face: [0, -0.45, 1] },
	bones: {
		...STAND.bones,
		...HANDS_ON_HIPS,
		...HALF_SQUAT_TORSO,
		RightUpLeg: { dir: [-0.2, -1, 0.95], face: [-0.2, 0.8, 1] },
		RightLeg: { dir: [-0.02, -1, -0.38], face: [-0.15, -0.35, 1] },
		RightFoot: { dir: [-0.12, -0.55, 1], face: [0, 1, 0.5] },
		LeftFoot: { dir: [0.12, -0.55, 1], face: [0, 1, 0.5] }
	},
	ik: { LeftFoot: { target: [footX, footY, MONSTER_Z], pole: [0.35, 0, 1] } }
});

const MONSTER = {
	id: 'monster-walks',
	name: 'Monster Walks',
	seed: 'Monster Walks',
	bilateral: true,
	view: { azimuth: 20, elevation: 12 },
	icon: 'lift',
	props: miniBand('LeftLeg', { r: 0.06, y: -0.04 }),
	poses: {
		narrow: monsterPose(0.17),
		lift: monsterPose(0.28, 0.17),
		wide: monsterPose(0.38)
	},
	timeline: [
		{ pose: 'narrow', hold: 0.4, in: 0.8 },
		{ pose: 'lift', in: 0.7, hold: 0 },
		{ pose: 'wide', in: 0.6, hold: 0.8 },
		{ pose: 'lift', in: 0.7, hold: 0 }
	]
};

// ------------------------------------------------------------ deep squat hold

const SQUAT = {
	// Hips below the knees, shins ~40deg forward, heels down, chest up.
	hips: { pos: [0, 0.4, -0.11], dir: [0, 1, 0.75], face: [0, -0.75, 1] },
	bones: {
		...STAND.bones,
		Spine: [0, 1, 0.7],
		Spine1: [0, 1, 0.45],
		Spine2: [0, 1, 0.2],
		Neck: [0, 1, 0.3],
		Head: { dir: [0, 1, 0.22], face: [0, -0.22, 1] },
		...both({
			LeftUpLeg: { dir: [0.3, 0.12, 1], face: [0.25, 1, -0.1] },
			LeftLeg: { dir: [-0.08, -1, -0.85], face: [0.2, -0.65, 1] },
			LeftFoot: { dir: [0.25, -0.5, 1], face: [0, 1, 0.5] },
			// Elbows against the inner knees, palms together at the sternum.
			LeftShoulder: { dir: [1, -0.1, 0.2], face: [0, 0, 1] },
			LeftArm: { dir: [0.08, -0.95, 0.33], face: [0, 0, 1] },
			LeftForeArm: { dir: [-0.53, 0.48, 0.55], face: [0, 0, 1] },
			LeftHand: { dir: [-0.1, 0.85, 0.5], face: [0, -0.5, -0.85] }
		})
	}
};

// Standing in the squat's stance (feet wide, toes out), so the feet don't slide.
const SQUAT_STAND = {
	...STAND,
	bones: {
		...STAND.bones,
		...both({
			LeftUpLeg: { dir: [0.12, -1, 0], face: [0.2, 0, 1] },
			LeftLeg: { dir: [0.1, -1, -0.02], face: [0.2, 0, 1] },
			LeftFoot: { dir: [0.25, -0.5, 1], face: [0, 1, 0.5] }
		})
	}
};

const DEEP_SQUAT = {
	id: 'deep-squat-hold',
	name: 'Deep Squat Hold',
	seed: 'Deep Squat Hold',
	view: { azimuth: 35, elevation: 12 },
	icon: 'squat',
	poses: { stand: SQUAT_STAND, squat: SQUAT },
	timeline: [
		{ pose: 'stand', hold: 0.8, in: 2.2 },
		{ pose: 'squat', in: 2.4, hold: 2.4 }
	]
};

// ------------------------------------------------------------- passive hang

// The bar follows the hands (`at`): a 2.25 m station is out of reach for most
// of the cast, and grounding always puts the toes on the floor.
const BAR_Y = 2.135;
const HANG = {
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		...STAND.bones,
		...both({
			LeftShoulder: { dir: [1, 0.35, 0], face: [0, 0, 1] },
			LeftArm: { dir: [0.18, 1, 0], face: [0, 0, 1] },
			LeftForeArm: { dir: [0.05, 1, 0.02], face: [0, 0, 1] },
			LeftHand: { dir: [0, 1, 0.05], face: [-1, 0, 0] },
			// Knees soft and feet trailing: only the toes graze the floor.
			LeftUpLeg: { dir: [0.03, -1, 0.18], face: [0, 0.18, 1] },
			LeftLeg: { dir: [0, -1, -0.55], face: [0, -0.55, 1] },
			LeftFoot: { dir: [0.05, -1, 0.05], face: [0, 0.05, 1] }
		})
	}
};

const PASSIVE_HANG = {
	id: 'passive-hang',
	name: 'Passive Hang',
	seed: 'Passive Hang',
	view: { azimuth: 35, elevation: 10 },
	icon: 'hang',
	props: [{ kind: 'pullup', pos: [0, 0, 0], at: { bone: 'LeftHand', along: 0.09, offset: [0, -BAR_Y, 0] }, axes: 'yz' }],
	poses: { hang: HANG },
	timeline: [{ pose: 'hang', hold: 6, in: 0 }]
};

// --------------------------------------------------------- band pull-aparts

const pullPose = (spread) => {
	// spread 0 = arms straight forward (hands shoulder width), 1 = arms out to the sides.
	const ax = 0.12 + spread * 0.88;
	const az = 1 - spread * 0.78;
	return {
		hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
		bones: {
			...STAND.bones,
			...both({
				LeftShoulder: { dir: [1, -0.05, -0.1 * spread], face: [0, 0, 1] },
				LeftArm: { dir: [ax, -0.12, az], face: [0, 1, 0] },
				LeftForeArm: { dir: [ax, -0.1, az], face: [0, 1, 0] },
				LeftHand: { dir: [ax, -0.1, az], face: [-az, 0, ax] }
			})
		}
	};
};

const PULL_APARTS = {
	id: 'band-pull-aparts',
	name: 'Band Pull-Aparts',
	seed: 'Band Pull-Aparts',
	view: { azimuth: 25, elevation: 22 },
	icon: 'open',
	props: [{ kind: 'band', through: ['LeftHand', 'RightHand'] }],
	poses: { front: pullPose(0), open: pullPose(1) },
	timeline: [
		{ pose: 'front', hold: 0.8, in: 1.6 },
		{ pose: 'open', in: 1.6, hold: 1.0 }
	]
};

// --------------------------------------------------------------- face pulls

const ANCHOR = [0, 0, 0.95];
const FACE_REACH = {
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		...STAND.bones,
		...both({
			LeftShoulder: { dir: [1, 0, 0.15], face: [0, 0, 1] },
			LeftArm: { dir: [0.12, 0.12, 1], face: [0, 1, 0] },
			LeftForeArm: { dir: [0.06, 0.12, 1], face: [0, 1, 0] },
			LeftHand: { dir: [0.04, 0.1, 1], face: [-1, 0, 0] }
		})
	}
};
const FACE_PULL = {
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		...STAND.bones,
		...both({
			// Elbows high and wide, hands pulled back beside the face.
			LeftShoulder: { dir: [1, 0.05, -0.12], face: [0, 0, 1] },
			LeftArm: { dir: [1, -0.06, -0.05], face: [0, 1, 0] },
			LeftForeArm: { dir: [-0.45, 0.55, 0.5], face: [0, 0, -1] },
			LeftHand: { dir: [-0.2, 0.8, 0.5], face: [-0.5, 0, 1] }
		})
	}
};

const FACE_PULLS = {
	id: 'face-pulls',
	name: 'Face Pulls',
	seed: 'Face Pulls',
	view: { azimuth: 115, elevation: 15 },
	icon: 'pull',
	props: [
		{ kind: 'wall', pos: [0, 0, ANCHOR[2] + 0.005], rotY: 180, width: 0.9 },
		{ kind: 'anchor', id: 'a', pos: ANCHOR, rotY: 180, height: 1.45 },
		{ kind: 'band', through: [{ prop: 'a' }, 'LeftHand'] },
		{ kind: 'band', through: [{ prop: 'a' }, 'RightHand'] }
	],
	poses: { reach: FACE_REACH, pull: FACE_PULL },
	timeline: [
		{ pose: 'reach', hold: 0.8, in: 1.4 },
		{ pose: 'pull', in: 1.4, hold: 1.2 }
	]
};

export const MOVEMENTS = [PLANTAR, CALF, ARCHES, BALANCE, MONSTER, DEEP_SQUAT, PASSIVE_HANG, PULL_APARTS, FACE_PULLS];
