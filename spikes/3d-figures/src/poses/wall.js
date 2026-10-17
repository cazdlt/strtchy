// Movement group: wall. See core.js for the pose format and shared building blocks.
// eslint-disable-next-line no-unused-vars
import { ARMS_DOWN, LEGS_STRAIGHT, STAND, QUAD_HIP_Y, QUAD_LEGS, QUAD_HANDS, QUAD_WRISTS, QUAD_NEUTRAL, pitch } from './core.js';

// ------------------------------------------------------ kneeling wall stretch
// Couch stretch, left leg forward: right knee on the mat near the wall, right
// shin up the wall (top of the foot against it), left foot flat in front.

const KWS_BACK = (thigh) => ({
	RightUpLeg: { dir: thigh, face: [0, 0, 1] },
	// Shin vertical up the wall, front of the shin facing the wall (-z).
	RightLeg: { dir: [0, 1, -0.35], face: [0, 0.35, -1] },
	RightFoot: { dir: [0, 1, -0.42], face: [0, 0.42, -1] }
});

const KWS_SET = {
	hips: { pos: [0, 0.5, 0], dir: [0, 1, 0.2], face: [0, -0.2, 1] },
	bones: {
		Spine: [0, 1, 0.24],
		Spine1: [0, 1, 0.22],
		Spine2: [0, 1, 0.18],
		Neck: [0, 1, 0.28],
		Head: { dir: [0, 1, 0.2], face: [0, -0.45, 1] },
		LeftShoulder: { dir: [1, -0.15, 0.08], face: [0, 0, 1] },
		RightShoulder: { dir: [-1, -0.15, 0.08], face: [0, 0, 1] },
		LeftHand: { dir: [0, -0.6, 1], face: [-1, 0, 0] },
		RightHand: { dir: [0, -0.6, 1], face: [1, 0, 0] },
		LeftFoot: { dir: [0.05, -0.45, 1], face: [0, 1, 0.45] },
		...KWS_BACK([0, -1, -0.12])
	},
	ik: {
		LeftFoot: { target: [0.12, 0.09, 0.45], pole: [0, 0.4, 1] },
		// Hands rest on the front knee.
		LeftHand: { target: [0.14, 0.52, 0.36], pole: [1, -0.5, -1] },
		RightHand: { target: [0.02, 0.52, 0.36], pole: [-1, -0.5, -1] }
	}
};

const KWS_PUSH = {
	// Glute squeeze: pelvis slides forward and tucks, torso tall.
	hips: { pos: [0, 0.5, 0.07], dir: [0, 1, -0.05], face: [0, 0.05, 1] },
	bones: {
		...KWS_SET.bones,
		Spine: [0, 1, 0.02],
		Spine1: [0, 1, -0.02],
		Spine2: [0, 1, -0.04],
		Neck: [0, 1, 0.16],
		Head: { dir: [0, 1, 0.12], face: [0, -0.3, 1] },
		...KWS_BACK([0, -1, -0.32])
	},
	ik: {
		LeftFoot: { target: [0.12, 0.09, 0.45], pole: [0, 0.4, 1] },
		LeftHand: { target: [0.14, 0.53, 0.38], pole: [1, -0.5, -1] },
		RightHand: { target: [0.02, 0.53, 0.38], pole: [-1, -0.5, -1] }
	}
};

// ------------------------------------------------------------- trap release
// Back to the wall, a ball between the left upper trapezius and the wall; lean
// in and raise / lower the left arm.

const TRAP_BODY = {
	hips: { pos: [0, 1, 0], dir: [0, 1, -0.28], face: [0, 0.28, 1] },
	bones: {
		...STAND.bones,
		Spine: [0, 1, -0.28],
		Spine1: [0, 1, -0.3],
		Spine2: [0, 1, -0.3],
		Neck: [0, 1, 0.1],
		Head: { dir: [0, 1, 0.1], face: [0, -0.35, 1] },
		LeftUpLeg: { dir: [0.06, -1, 0.3], face: [0, 0, 1] },
		RightUpLeg: { dir: [-0.06, -1, 0.3], face: [0, 0, 1] },
		LeftLeg: { dir: [0.02, -1, 0.18], face: [0, 0, 1] },
		RightLeg: { dir: [-0.02, -1, 0.18], face: [0, 0, 1] }
	}
};

const TRAP_DOWN = TRAP_BODY;
const TRAP_UP = {
	...TRAP_BODY,
	bones: {
		...TRAP_BODY.bones,
		LeftShoulder: { dir: [1, 0.05, 0], face: [0, 0, 1] },
		LeftArm: { dir: [0.2, 1, 0.55], face: [-1, 0, 0] },
		LeftForeArm: { dir: [0.12, 1, 0.5], face: [-1, 0, 0] },
		LeftHand: { dir: [0.1, 1, 0.45], face: [-1, 0, 0] }
	}
};

// ---------------------------------------------------------- wall pec stretch
// Left forearm on the end of a wall (like a door jamb) at 90/90; step forward
// and turn the chest slightly away so the pec opens.

const PEC_ARM = {
	LeftShoulder: { dir: [1, 0, -0.05], face: [0, 0, 1] },
	LeftHand: { dir: [0, 1, 0], face: [1, 0, 0] }
};

const PEC_SET = {
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		...STAND.bones,
		...PEC_ARM
	},
	ik: { LeftHand: { target: [0.4, 1.6, 0.065], pole: [0.3, -1, 0] } }
};

const PEC_STRETCH = {
	// Left foot steps forward, chest turns ~15deg away (to the right).
	hips: { pos: [0, 1, 0.18], dir: [0, 1, 0.04], face: [-0.2, 0, 1] },
	bones: {
		...STAND.bones,
		Spine: { dir: [0, 1, 0.04], face: [-0.3, 0, 1] },
		Spine1: { dir: [0, 1, 0], face: [-0.4, 0, 1] },
		Spine2: { dir: [0, 1, -0.02], face: [-0.48, 0, 1] },
		Neck: { dir: [0, 1, 0.08], face: [-0.5, 0, 1] },
		Head: { dir: [0, 1, 0.1], face: [-0.5, 0, 1] },
		...PEC_ARM,
		LeftShoulder: { dir: [1, 0, -0.25], face: [0.25, 0, 1] },
		RightShoulder: { dir: [-1, -0.18, -0.45], face: [-0.45, 0, 1] },
		LeftUpLeg: { dir: [0.05, -1, 0.3], face: [0, 0, 1] },
		LeftLeg: { dir: [0, -1, 0.05], face: [0, 0, 1] },
		RightUpLeg: { dir: [-0.05, -1, -0.12], face: [0, 0, 1] },
		RightLeg: { dir: [0, -1, -0.1], face: [0, 0, 1] },
		RightFoot: { dir: [-0.1, -0.5, 1], face: [0, 1, 0.5] }
	},
	ik: { LeftHand: { target: [0.4, 1.6, 0.065], pole: [0.3, -1, 0] } }
};

// ------------------------------------------------------ scapular wall slides
// Facing the wall, forearms on it, band around the wrists; slide up into a Y.

const SLIDE_BODY = {
	...STAND.bones,
	LeftShoulder: { dir: [1, -0.05, 0.1], face: [0, 0, 1] },
	RightShoulder: { dir: [-1, -0.05, 0.1], face: [0, 0, 1] },
	LeftHand: { dir: [0.05, 1, 0], face: [1, 0, 0] },
	RightHand: { dir: [-0.05, 1, 0], face: [-1, 0, 0] }
};
const WALL_Z = 0.3;
const SLIDE_DOWN = {
	hips: STAND.hips,
	bones: SLIDE_BODY,
	ik: {
		LeftHand: { target: [0.3, 1.42, WALL_Z - 0.035], pole: [1, -1, 0.3] },
		RightHand: { target: [-0.3, 1.42, WALL_Z - 0.035], pole: [-1, -1, 0.3] }
	}
};
const SLIDE_UP = {
	hips: STAND.hips,
	bones: {
		...SLIDE_BODY,
		LeftShoulder: { dir: [1, 0.2, 0.1], face: [0, 0, 1] },
		RightShoulder: { dir: [-1, 0.2, 0.1], face: [0, 0, 1] },
		LeftHand: { dir: [0.3, 1, 0], face: [1, -0.3, 0] },
		RightHand: { dir: [-0.3, 1, 0], face: [-1, -0.3, 0] }
	},
	ik: {
		LeftHand: { target: [0.34, 1.72, WALL_Z - 0.035], pole: [1, -0.3, 0.3] },
		RightHand: { target: [-0.34, 1.72, WALL_Z - 0.035], pole: [-1, -0.3, 0.3] }
	}
};

// ----------------------------------------------------------------- y-raises
// Hip hinge ~50deg, flat back, soft knees; light dumbbells from hanging to a Y.

const HINGE = {
	hips: { pos: [0, 1, -0.08], dir: [0, 0.6, 1], face: [0, -1, 0.6] },
	bones: {
		...STAND.bones,
		Spine: [0, 0.65, 1],
		Spine1: [0, 0.65, 1],
		Spine2: [0, 0.62, 1],
		Neck: [0, 0.5, 1],
		Head: { dir: [0, 0.45, 1], face: [0, -1, 0.4] },
		LeftUpLeg: { dir: [0.05, -1, 0.12], face: [0, 0, 1] },
		RightUpLeg: { dir: [-0.05, -1, 0.12], face: [0, 0, 1] },
		LeftLeg: { dir: [0, -1, -0.1], face: [0, 0, 1] },
		RightLeg: { dir: [0, -1, -0.1], face: [0, 0, 1] }
	}
};
const Y_HANG = {
	...HINGE,
	bones: {
		...HINGE.bones,
		LeftShoulder: { dir: [1, -0.1, 0.15], face: [0, -1, 0] },
		RightShoulder: { dir: [-1, -0.1, 0.15], face: [0, -1, 0] },
		LeftArm: { dir: [0.08, -1, 0.05], face: [0, 0, 1] },
		RightArm: { dir: [-0.08, -1, 0.05], face: [0, 0, 1] },
		LeftForeArm: { dir: [0.03, -1, 0.1], face: [0, 0, 1] },
		RightForeArm: { dir: [-0.03, -1, 0.1], face: [0, 0, 1] },
		LeftHand: { dir: [0.02, -1, 0.05], face: [-1, 0, 0] },
		RightHand: { dir: [-0.02, -1, 0.05], face: [1, 0, 0] }
	}
};
const Y_UP = {
	...HINGE,
	bones: {
		...HINGE.bones,
		// Shoulder blades draw back and down first, then the arms rise into a Y.
		LeftShoulder: { dir: [1, 0.1, -0.1], face: [0, -1, 0] },
		RightShoulder: { dir: [-1, 0.1, -0.1], face: [0, -1, 0] },
		LeftArm: { dir: [0.6, 0.45, 0.75], face: [0, 1, -0.3] },
		RightArm: { dir: [-0.6, 0.45, 0.75], face: [0, 1, -0.3] },
		LeftForeArm: { dir: [0.6, 0.45, 0.75], face: [0, 1, -0.3] },
		RightForeArm: { dir: [-0.6, 0.45, 0.75], face: [0, 1, -0.3] },
		LeftHand: { dir: [0.6, 0.45, 0.75], face: [0, 1, -0.3] },
		RightHand: { dir: [-0.6, 0.45, 0.75], face: [0, 1, -0.3] }
	}
};

// ------------------------------------------------------------ ankle inversion
// Long sitting, band around the left forefoot anchored low on the left; turn
// the sole inward against it.

const SIT = {
	hips: { pos: [0, 0.1, 0], dir: [0, 1, -0.2], face: [0, 0.2, 1] },
	bones: {
		Spine: [0, 1, -0.1],
		Spine1: [0, 1, 0],
		Spine2: [0, 1, 0.05],
		Neck: [0, 1, 0.15],
		Head: { dir: [0, 1, 0.15], face: [0, -0.3, 1] },
		LeftShoulder: { dir: [1, -0.15, -0.05], face: [0, 0, 1] },
		RightShoulder: { dir: [-1, -0.15, -0.05], face: [0, 0, 1] },
		LeftHand: { dir: [0.1, -0.2, -1], face: [-1, 0, 0] },
		RightHand: { dir: [-0.1, -0.2, -1], face: [1, 0, 0] },
		LeftUpLeg: { dir: [0.08, 0, 1], face: [0, 1, 0] },
		RightUpLeg: { dir: [-0.08, 0, 1], face: [0, 1, 0] },
		LeftLeg: { dir: [0.02, -0.03, 1], face: [0, 1, 0] },
		RightLeg: { dir: [-0.02, -0.03, 1], face: [0, 1, 0] },
		LeftFoot: { dir: [0.05, 0.8, 0.6], face: [0, 0.6, -0.8] },
		RightFoot: { dir: [-0.1, 0.8, 0.6], face: [0, 0.6, -0.8] }
	},
	ik: {
		// Hands behind the hips for support.
		LeftHand: { target: [0.22, 0.05, -0.2], pole: [0.3, 0, -1] },
		RightHand: { target: [-0.22, 0.05, -0.2], pole: [-0.3, 0, -1] }
	}
};
const INVERT = {
	...SIT,
	bones: {
		...SIT.bones,
		// Sole turns toward the midline, toes drift in (moderate range).
		LeftFoot: { dir: [-0.55, 0.72, 0.42], face: [0.8, 0.35, -0.5] }
	}
};

export const MOVEMENTS = [
	{
		id: 'kneeling-wall-stretch',
		name: 'Kneeling Wall Stretch',
		seed: 'Kneeling Wall Stretch',
		bilateral: true,
		view: { azimuth: -62, elevation: 12 },
		icon: 'push',
		props: [
			{ kind: 'mat', pos: [0, 0, 0.5], at: { bone: 'RightToeBase', offset: [0, 0, 0.9] }, axes: 'z' },
			{ kind: 'wall', pos: [0, 0, -0.4], width: 1.6, height: 1.4, at: { bone: 'RightToeBase', offset: [0, 0, -0.035] }, axes: 'z' }
		],
		poses: { set: KWS_SET, push: KWS_PUSH },
		timeline: [
			{ pose: 'set', hold: 1.2, in: 2.2 },
			{ pose: 'push', in: 2.4, hold: 2.2 }
		]
	},
	{
		id: 'trap-release',
		name: 'Trap Release',
		seed: 'Trap Release',
		bilateral: true,
		view: { azimuth: 82, elevation: 8 },
		icon: 'down',
		props: [
			{ kind: 'ball', at: { bone: 'Spine2', along: 0.04, offset: [0.075, 0, -0.135] } },
			{ kind: 'wall', pos: [0, 0, -0.3], width: 1.6, height: 2.2, at: { bone: 'Spine2', along: 0.04, offset: [0, 0, -0.175] }, axes: 'z' }
		],
		poses: { down: TRAP_DOWN, up: TRAP_UP },
		timeline: [
			{ pose: 'down', hold: 0.8, in: 2.0 },
			{ pose: 'up', in: 2.2, hold: 0.8 }
		]
	},
	{
		id: 'wall-pec-stretch',
		name: 'Wall Pec Stretch',
		seed: 'Wall Pec Stretch',
		bilateral: true,
		view: { azimuth: -145, elevation: 20 },
		icon: 'stretch',
		props: [{ kind: 'wall', pos: [0.24 + 0.6, 0, 0.1], rotY: 180, width: 1.2, height: 2.2 }],
		poses: { set: PEC_SET, stretch: PEC_STRETCH },
		timeline: [
			{ pose: 'set', hold: 1.0, in: 2.2 },
			{ pose: 'stretch', in: 2.4, hold: 2.2 }
		]
	},
	{
		id: 'scapular-wall-slides',
		name: 'Scapular Wall Slides',
		seed: 'Scapular Wall Slides',
		view: { azimuth: 140, elevation: 15 },
		icon: 'up',
		props: [
			{ kind: 'wall', pos: [0, 0, WALL_Z], rotY: 180, width: 1.6, height: 2.2 },
			{ kind: 'band', through: ['LeftHand', 'RightHand'] }
		],
		poses: { down: SLIDE_DOWN, up: SLIDE_UP },
		timeline: [
			{ pose: 'down', hold: 0.8, in: 2.0 },
			{ pose: 'up', in: 2.4, hold: 1.0 }
		]
	},
	{
		id: 'y-raises',
		name: 'Y-Raises',
		seed: 'Y-Raises',
		view: { azimuth: 20, elevation: 22 },
		icon: 'up',
		props: [
			{ kind: 'dumbbell', rotY: 38, at: { bone: 'LeftHand', along: 0.08, offset: [0, -0.045, 0] } },
			{ kind: 'dumbbell', rotY: -38, at: { bone: 'RightHand', along: 0.08, offset: [0, -0.045, 0] } }
		],
		poses: { hang: Y_HANG, up: Y_UP },
		timeline: [
			{ pose: 'hang', hold: 0.8, in: 2.0 },
			{ pose: 'up', in: 2.0, hold: 1.0 }
		]
	},
	{
		id: 'ankle-inversion',
		name: 'Ankle Inversion',
		seed: 'Ankle Inversion',
		bilateral: true,
		view: { azimuth: -12, elevation: 14 },
		icon: 'invert',
		props: [
			{ kind: 'mat', pos: [0, 0, 0.3] },
			{ kind: 'wall', pos: [0.5, 0, 0.5], rotY: -90, width: 1.6, height: 1.0 },
			{ kind: 'anchor', id: 'a', pos: [0.5, 0, 0.6], rotY: -90, height: 0.16, at: { bone: 'LeftToeBase' }, axes: 'z' },
			{ kind: 'band', through: ['LeftToeBase', { prop: 'a' }] }
		],
		poses: { sit: SIT, invert: INVERT },
		timeline: [
			{ pose: 'sit', hold: 0.8, in: 1.6 },
			{ pose: 'invert', in: 1.6, hold: 1.2 }
		]
	}
];
