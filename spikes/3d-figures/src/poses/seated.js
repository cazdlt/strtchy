// Movement group: seated. See core.js for the pose format and shared building blocks.
// eslint-disable-next-line no-unused-vars
import { mirrorSpec } from '../rig.js';
import { ARMS_DOWN, LEGS_STRAIGHT, STAND, QUAD_HIP_Y, QUAD_LEGS, QUAD_HANDS, QUAD_WRISTS, QUAD_NEUTRAL, pitch } from './core.js';

const rad = (d) => (d * Math.PI) / 180;
const r3 = (a) => a.map((x) => +x.toFixed(3));
/** Torso segment leaning `deg` forward from vertical (0 = upright): bone dir + front. */
const lean = (deg) => ({ dir: r3([0, Math.cos(rad(deg)), Math.sin(rad(deg))]), face: r3([0, -Math.sin(rad(deg)), Math.cos(rad(deg))]) });
const MAT = { kind: 'mat' };

// IK legs are parked straight up while the body is grounded, so a seated pose
// would rest on the wrong vertices. legFK() solves the knee in proportional
// units instead (thigh = 1, shin = 0.97) and returns plain FK directions, so
// the thighs take part in grounding and the pose scales with each body.
const sub = (a, b) => a.map((x, i) => x - b[i]);
const add = (a, b) => a.map((x, i) => x + b[i]);
const mul = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = (a) => mul(a, 1 / Math.hypot(...a));
function legFK(side, toAnkle, pole, foot) {
	const l1 = 1, l2 = 0.97;
	const d = Math.min(Math.hypot(...toAnkle), (l1 + l2) * 0.999);
	const u = norm(toAnkle);
	const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
	const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
	const p = norm(sub(pole, mul(u, dot(pole, u))));
	const knee = add(mul(u, along), mul(p, h));
	const ankle = mul(u, d);
	const out = {
		[`${side}UpLeg`]: { dir: r3(knee), face: r3(p) },
		[`${side}Leg`]: { dir: r3(sub(ankle, knee)), face: r3(p) }
	};
	if (foot) out[`${side}Foot`] = foot;
	return out;
}

// ---------------------------------------------------------- seated straddle

// Legs ~95deg apart, kneecaps up, toes up. Pelvis tips forward (hinge at the
// hips, not a rounded back), hands walk forward onto the floor.
const sx = Math.sin(rad(47.5));
const sz = Math.cos(rad(47.5));
const STRADDLE_LEGS = {
	LeftUpLeg: { dir: [sx, -0.06, sz], face: [0, 1, 0] },
	RightUpLeg: { dir: [-sx, -0.06, sz], face: [0, 1, 0] },
	LeftLeg: { dir: [sx, -0.02, sz], face: [0, 1, 0] },
	RightLeg: { dir: [-sx, -0.02, sz], face: [0, 1, 0] },
	LeftFoot: { dir: [sx * 0.45, 1, sz * 0.45], face: [-sx, 0.4, -sz] },
	RightFoot: { dir: [-sx * 0.45, 1, sz * 0.45], face: [sx, 0.4, -sz] }
};
const SEATED_SHOULDERS = {
	LeftShoulder: { dir: [1, -0.12, 0.08], face: [0, 0, 1] },
	RightShoulder: { dir: [-1, -0.12, 0.08], face: [0, 0, 1] }
};
const PALMS_DOWN = {
	LeftHand: { dir: [0.05, -0.08, 1], face: [-1, 0, 0] },
	RightHand: { dir: [-0.05, -0.08, 1], face: [1, 0, 0] }
};

const STRADDLE_TALL = {
	hips: { pos: [0, 0.2, 0], ...lean(8) },
	bones: {
		Spine: lean(8),
		Spine1: lean(4),
		Spine2: lean(0),
		Neck: lean(12).dir,
		Head: lean(22).dir,
		...SEATED_SHOULDERS,
		// Fingertips on the floor (an upright torso can't reach palms-flat).
		LeftHand: { dir: [0.05, -1, 0.6], face: [0, 0, 1] },
		RightHand: { dir: [-0.05, -1, 0.6], face: [0, 0, 1] },
		...STRADDLE_LEGS
	},
	ik: {
		LeftHand: { target: [0.13, 0.16, 0.22], pole: [0.5, 0, -1] },
		RightHand: { target: [-0.13, 0.16, 0.22], pole: [-0.5, 0, -1] }
	}
};

const STRADDLE_FOLD = {
	hips: { pos: [0, 0.2, 0], ...lean(42) },
	bones: {
		...STRADDLE_TALL.bones,
		Spine: lean(46),
		Spine1: lean(48),
		Spine2: lean(50),
		Neck: lean(52).dir,
		Head: lean(56).dir,
		LeftShoulder: { dir: [1, -0.05, 0.15], face: [0, 0, 1] },
		RightShoulder: { dir: [-1, -0.05, 0.15], face: [0, 0, 1] },
		LeftHand: { dir: [0.05, 0.02, 1], face: [-1, 0, 0] },
		RightHand: { dir: [-0.05, 0.02, 1], face: [1, 0, 0] }
	},
	ik: {
		LeftHand: { target: [0.13, 0.075, 0.5], pole: [0.5, 0, -1] },
		RightHand: { target: [-0.13, 0.075, 0.5], pole: [-0.5, 0, -1] }
	}
};


// // ------------------------------------------------------------ 90/90 switch

// Anatomically untwisted bent leg: knee is a true hinge joint in the plane of
// thighDir and shinDir, and the ankle sits in the same plane (in rest pose,
// Foot.D0 points ~35deg below the sole, i.e. 55deg from Leg.D0).
function hingeLeg(side, thighDir, shinDir, plantarDeg = 12) {
	const u1 = norm(thighDir);
	const u2 = norm(shinDir);
	const f1 = norm(sub(mul(u1, dot(u1, u2)), u2));
	const f2 = norm(sub(u1, mul(u2, dot(u1, u2))));
	const a = rad(55 - plantarDeg);
	const ca = Math.cos(a), sa = Math.sin(a);
	return {
		[`${side}UpLeg`]: { dir: r3(u1), face: r3(f1) },
		[`${side}Leg`]: { dir: r3(u2), face: r3(f2) },
		[`${side}Foot`]: {
			dir: r3(add(mul(u2, ca), mul(f2, sa))),
			face: r3(add(mul(u2, -sa), mul(f2, ca)))
		}
	};
}

const yawVec = (deg, a) => {
	const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
	return r3([a[0] * c + a[2] * s, a[1], -a[0] * s + a[2] * c]);
};
const yawBone = (deg, b) => ({ dir: yawVec(deg, b.dir), face: yawVec(deg, b.face) });

// Hands lightly planted behind the hips for seated windshield-wiper support.
const HANDS_BEHIND = {
	LeftHand: { dir: [0.1, -1, -0.15], face: [0, 0, 1] },
	RightHand: { dir: [-0.1, -1, -0.15], face: [0, 0, 1] }
};

// // Left 90/90 shin box: front (left) thigh points forward-left with shin folded
// 90deg across in front; back (right) thigh points out to the right with shin
// folded 90deg back. Both knees use hingeLeg() so calves and ankles never twist.
const NINETY_LEFT = {
	hips: { pos: [0, 0.2, 0], ...yawBone(14, lean(-10)) },
	bones: {
		Spine: yawBone(16, lean(-8)),
		Spine1: yawBone(18, lean(-4)),
		Spine2: yawBone(20, lean(0)),
		Neck: yawBone(18, lean(8)),
		Head: yawBone(16, lean(16)),
		LeftShoulder: yawBone(18, { dir: [1, -0.12, 0.05], face: [0, 0, 1] }),
		RightShoulder: yawBone(18, { dir: [-1, -0.12, 0.05], face: [0, 0, 1] }),
		...HANDS_BEHIND,
		...hingeLeg('Left', [0.42, -0.08, 0.90], [-0.90, -0.05, 0.42], 12),
		...hingeLeg('Right', [-0.88, -0.08, 0.46], [-0.46, -0.05, -0.88], 15)
	},
	ik: {
		LeftHand: { target: [0.24, 0.18, -0.26], pole: [0.6, 0, -1] },
		RightHand: { target: [-0.24, 0.18, -0.26], pole: [-0.6, 0, -1] }
	}
};

// Intermediate lift as knees rise into the windshield-wiper arc (keeps the
// back shin above the mat without crossing the legs).
const NINETY_LEFT_LIFT = {
	hips: { pos: [0, 0.2, 0], ...yawBone(8, lean(-11)) },
	bones: {
		Spine: yawBone(9, lean(-8)),
		Spine1: yawBone(10, lean(-4)),
		Spine2: yawBone(10, lean(-1)),
		Neck: yawBone(9, lean(8)),
		Head: yawBone(8, lean(16)),
		...SEATED_SHOULDERS,
		...HANDS_BEHIND,
		...hingeLeg('Left', [0.48, 0.32, 0.82], [-0.52, -0.58, 0.62], 8),
		...hingeLeg('Right', [-0.72, 0.36, 0.59], [-0.22, -0.62, -0.75], 10)
	},
	ik: NINETY_LEFT.ik
};

// Midpoint of the windshield-wiper switch: knees high and wide, heels planted.
const NINETY_MID = {
	hips: { pos: [0, 0.2, 0], ...lean(-12) },
	bones: {
		Spine: lean(-9),
		Spine1: lean(-5),
		Spine2: lean(-1),
		Neck: lean(8),
		Head: lean(16),
		...SEATED_SHOULDERS,
		...HANDS_BEHIND,
		...hingeLeg('Left', [0.52, 0.64, 0.56], [-0.12, -0.82, 0.56], 5),
		...hingeLeg('Right', [-0.52, 0.64, 0.56], [0.12, -0.82, 0.56], 5)
	},
	ik: NINETY_LEFT.ik
};
const NINETY_RIGHT_LIFT = mirrorSpec(NINETY_LEFT_LIFT);
const NINETY_RIGHT = mirrorSpec(NINETY_LEFT);

// -------------------------------------------------------- butterfly stretch

// Soles together ~30cm in front of the pelvis, knees fall out and up (IK pole
// out-up = kneecaps face out-up). Hands hold the feet; the hinge comes from
// the pelvis, the back stays long.
// Ankle offsets from the hip joint, in thigh lengths.
const BUTTERFLY_LEGS = {
	// Toes forward-down, soles facing each other (tops of the feet face out).
	...legFK('Left', [-0.11, -0.12, 0.8], [1, 0.45, 0], { dir: [-0.05, -0.12, 1], face: [1, 0.4, 0] }),
	...legFK('Right', [0.11, -0.12, 0.8], [-1, 0.45, 0], { dir: [0.05, -0.12, 1], face: [-1, 0.4, 0] })
};
const HOLD_FEET = {
	LeftHand: { dir: [-0.15, -0.7, 1], face: [-1, 0.2, 0] },
	RightHand: { dir: [0.15, -0.7, 1], face: [1, 0.2, 0] }
};
const BUTTERFLY_TALL = {
	hips: { pos: [0, 0.2, 0], ...lean(12) },
	bones: {
		Spine: lean(12),
		Spine1: lean(10),
		Spine2: lean(8),
		Neck: lean(18).dir,
		Head: lean(28).dir,
		...SEATED_SHOULDERS,
		...HOLD_FEET,
		...BUTTERFLY_LEGS
	},
	ik: {
		LeftHand: { target: [0.08, 0.17, 0.3], pole: [0.6, -0.2, -1] },
		RightHand: { target: [-0.08, 0.17, 0.3], pole: [-0.6, 0, -1] }
	}
};
const BUTTERFLY_FOLD = {
	hips: { pos: [0, 0.2, 0], ...lean(32) },
	bones: {
		...BUTTERFLY_TALL.bones,
		Spine: lean(36),
		Spine1: lean(38),
		Spine2: lean(40),
		Neck: lean(42).dir,
		Head: lean(48).dir,
		LeftShoulder: { dir: [1, -0.08, 0.15], face: [0, 0, 1] },
		RightShoulder: { dir: [-1, -0.08, 0.15], face: [0, 0, 1] }
	},
	ik: {
		LeftHand: { target: [0.08, 0.16, 0.34], pole: [1, 0.2, -1] },
		RightHand: { target: [-0.08, 0.16, 0.34], pole: [-1, 0.2, -1] }
	}
};

// --------------------------------------------------------- side child's pose

// Kneeling, sitting back on the heels: knees slightly apart, shins and insteps
// resting on the mat, chest low over the thighs, arms reaching long on the floor
// with elbows and forearms resting down on the mat.
const CHILD_LEGS = {
	LeftUpLeg: { dir: [0.22, -0.32, 0.92], face: [0.08, 0.92, 0.32] },
	RightUpLeg: { dir: [-0.22, -0.32, 0.92], face: [-0.08, 0.92, 0.32] },
	LeftLeg: { dir: [-0.04, 0.04, -1], face: [0, -1, -0.04] },
	RightLeg: { dir: [0.04, 0.04, -1], face: [0, -1, -0.04] },
	// In rest pose Foot.D0 is 35deg below the sole, so tilt Foot.dir slightly up
	// (+Y) to lay the instep flat on the mat instead of digging the toes in.
	LeftFoot: { dir: [-0.05, 0.32, -0.95], face: [0, -0.95, -0.32] },
	RightFoot: { dir: [0.05, 0.32, -0.95], face: [0, -0.95, -0.32] }
};
const CHILD_ARMS = {
	LeftShoulder: { dir: [0.82, -0.14, 0.55], face: [0, -1, 0] },
	RightShoulder: { dir: [-0.82, -0.14, 0.55], face: [0, -1, 0] },
	LeftArm: { dir: [0.08, -0.48, 0.87], face: [-0.25, -0.87, -0.45] },
	RightArm: { dir: [-0.08, -0.48, 0.87], face: [0.25, -0.87, -0.45] },
	LeftForeArm: { dir: [-0.04, -0.12, 0.99], face: [-0.85, -0.5, 0] },
	RightForeArm: { dir: [0.04, -0.12, 0.99], face: [0.85, -0.5, 0] },
	LeftHand: { dir: [-0.02, 0.04, 1.0], face: [-1, 0, 0] },
	RightHand: { dir: [0.02, 0.04, 1.0], face: [1, 0, 0] }
};
const CHILD_CENTER = {
	hips: { pos: [0, 0.26, 0], ...lean(70) },
	bones: {
		Spine: lean(80),
		Spine1: lean(88),
		Spine2: lean(91),
		Neck: lean(89),
		Head: lean(92),
		...CHILD_ARMS,
		...CHILD_LEGS
	}
};
// Hands and upper torso walk to the right (-X), bowing the spine laterally to
// open the left lat while keeping forearms and palms low along the floor.
const CHILD_SIDE = {
	hips: { pos: [0, 0.26, 0], ...yawBone(-6, lean(70)) },
	bones: {
		...CHILD_CENTER.bones,
		Spine: yawBone(-14, lean(80)),
		Spine1: yawBone(-23, lean(88)),
		Spine2: yawBone(-31, lean(91)),
		Neck: yawBone(-34, lean(89)),
		Head: yawBone(-35, lean(92)),
		LeftShoulder: yawBone(-32, { dir: [0.78, -0.14, 0.60], face: [0, -1, 0] }),
		RightShoulder: yawBone(-32, { dir: [-0.86, -0.20, 0.42], face: [0, -1, 0] }),
		LeftArm: yawBone(-34, { dir: [0.02, -0.46, 0.89], face: [-0.25, -0.87, -0.45] }),
		RightArm: yawBone(-38, { dir: [-0.14, -0.58, 0.80], face: [0.25, -0.87, -0.45] }),
		LeftForeArm: yawBone(-36, { dir: [-0.06, -0.12, 0.99], face: [-0.85, -0.5, 0] }),
		RightForeArm: yawBone(-36, { dir: [0.04, -0.18, 0.98], face: [0.85, -0.5, 0] }),
		LeftHand: yawBone(-36, { dir: [-0.02, 0.04, 1.0], face: [-1, 0, 0] }),
		RightHand: yawBone(-36, { dir: [0.02, 0.08, 1.0], face: [1, 0, 0] })
	}
};

// ------------------------------------------------------ lunge with rotation

// Low lunge, left foot forward, right knee down. The right hand plants inside
// the front foot; the chest turns toward the front knee and the left arm
// reaches for the ceiling. The left arm is FK in both poses (an IK chain that
// exists in only one pose snaps at the end of the blend).
/** Torso segment leaning `deg` forward, turned `turn` deg toward the figure's left. */
const twist = (deg, turn) => {
	const { dir, face } = lean(deg);
	const c = Math.cos(rad(turn)), s = Math.sin(rad(turn));
	return { dir, face: r3([s, face[1] * c, face[2] * c]) };
};
const LUNGE_LEGS = {
	// Front shin slightly forward of vertical, foot flat.
	...legFK('Left', [0.1, -0.72, 0.68], [0, 1, 0.4], { dir: [0.05, -0.3, 1], face: [0, 1, 0.3] }),
	// Back knee down behind the hip, shin and top of the foot flat.
	RightUpLeg: { dir: [-0.04, -0.67, -0.74], face: [0, -0.74, 0.67] },
	RightLeg: { dir: [0, 0.03, -1], face: [0, -1, 0.03] },
	RightFoot: { dir: [0, -0.12, -1], face: [0, -1, 0] }
};
const LUNGE_DOWN = {
	hips: { pos: [0, 0.4, 0], ...lean(45) },
	bones: {
		Spine: lean(62),
		Spine1: lean(70),
		Spine2: lean(74),
		Neck: lean(68).dir,
		Head: lean(66).dir,
		LeftShoulder: { dir: [1, -0.1, 0.2], face: [0, 0, 1] },
		RightShoulder: { dir: [-1, -0.1, 0.2], face: [0, 0, 1] },
		LeftArm: { dir: [-0.12, -1, 0.1], face: [0, 0, 1] },
		LeftForeArm: { dir: [-0.06, -1, 0.06], face: [0, 0, 1] },
		LeftHand: { dir: [-0.05, -0.3, 1], face: [-1, 0, 0] },
		RightHand: { dir: [0.1, -0.15, 1], face: [1, 0, 0] },
		...LUNGE_LEGS
	},
	ik: {
		RightHand: { target: [-0.07, 0.1, 0.42], pole: [-0.5, 0.3, -1] }
	}
};
const LUNGE_OPEN = {
	hips: { pos: [0, 0.4, 0], ...twist(40, 10) },
	bones: {
		...LUNGE_DOWN.bones,
		Spine: twist(52, 25),
		Spine1: twist(56, 42),
		Spine2: twist(58, 58),
		Neck: twist(57, 66),
		Head: { dir: lean(50).dir, face: [0.6, 0.8, 0] },
		LeftShoulder: { dir: [0.5, 0.75, -0.4], face: [1, 0, 0.3] },
		RightShoulder: { dir: [-0.5, -0.75, 0.4], face: [1, 0, 0.3] },
		LeftArm: { dir: [0.05, 1, -0.05], face: [1, 0, 0] },
		LeftForeArm: { dir: [0.03, 1, -0.02], face: [1, 0, 0] },
		LeftHand: { dir: [0.02, 1, 0], face: [0, 0, 1] }
	},
	ik: LUNGE_DOWN.ik
};

export const MOVEMENTS = [
	{
		id: 'seated-straddle',
		name: 'Seated Straddle',
		seed: 'Seated Straddle',
		view: { azimuth: 50, elevation: 25 },
		icon: 'fold',
		props: [{ kind: 'mat', rotY: 90, pos: [0, 0, 0.25] }],
		poses: { tall: STRADDLE_TALL, fold: STRADDLE_FOLD },
		timeline: [
			{ pose: 'tall', hold: 1.0, in: 2.2 },
			{ pose: 'fold', in: 2.6, hold: 2.2 }
		]
	}
,
	{
		id: '90-90-hip-switch',
		name: '90/90 Hip Switch',
		seed: '90/90 Hip Switch',
		view: { azimuth: -18, elevation: 34 },
		icon: 'left',
		props: [{ kind: 'mat', rotY: 90, pos: [0, 0, 0.12] }],
		poses: { left: NINETY_LEFT, leftLift: NINETY_LEFT_LIFT, mid: NINETY_MID, rightLift: NINETY_RIGHT_LIFT, right: NINETY_RIGHT },
		timeline: [
			{ pose: 'left', hold: 1.0, in: 0.6 },
			{ pose: 'leftLift', in: 0.6 },
			{ pose: 'mid', in: 0.6 },
			{ pose: 'rightLift', in: 0.6 },
			{ pose: 'right', in: 0.6, hold: 1.0 },
			{ pose: 'rightLift', in: 0.6 },
			{ pose: 'mid', in: 0.6 },
			{ pose: 'leftLift', in: 0.6 }
		]
	}
,
	{
		id: 'butterfly-stretch',
		name: 'Butterfly Stretch',
		seed: 'Butterfly Stretch',
		view: { azimuth: 15, elevation: 25 },
		icon: 'fold',
		props: [{ kind: 'mat', pos: [0, 0, 0.25] }],
		poses: { tall: BUTTERFLY_TALL, fold: BUTTERFLY_FOLD },
		timeline: [
			{ pose: 'tall', hold: 1.2, in: 2.2 },
			{ pose: 'fold', in: 2.6, hold: 2.0 }
		]
	}
,
	{
		id: 'side-childs-pose',
		name: "Side Child's Pose",
		seed: "Side Child's Pose",
		bilateral: true,
		view: { azimuth: 52, elevation: 34 },
		icon: 'side',
		props: [{ kind: 'mat', pos: [-0.08, 0, 0.3], rotY: -12 }],
		poses: { center: CHILD_CENTER, side: CHILD_SIDE },
		timeline: [
			{ pose: 'center', hold: 1.0, in: 2.0 },
			{ pose: 'side', in: 2.4, hold: 2.6 }
		]
	}
,
	{
		id: 'lunge-with-rotation',
		name: 'Lunge with Rotation',
		seed: 'Lunge with Rotation',
		bilateral: true,
		view: { azimuth: 65, elevation: 15 },
		icon: 'open',
		props: [{ kind: 'mat', pos: [0, 0, 0.1] }],
		poses: { down: LUNGE_DOWN, open: LUNGE_OPEN },
		timeline: [
			{ pose: 'down', hold: 0.8, in: 1.8 },
			{ pose: 'open', in: 2.0, hold: 1.6 }
		]
	}
];
