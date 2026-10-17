// Movement group: supine (lying on the back). See core.js for the pose format.
//
// Orientation used by every pose in this file: the figure lies on its back with
// the HEAD toward -z and the FEET toward +z, face to the ceiling (+y). The
// figure's left stays +x. So the pelvis `dir` is ~[0,0,-1] and the torso
// `face` ~[0,1,0]; lying legs point +z with kneecaps +y.
//
// Grounding caveat (rig.js): the body's original head vertices stay in the
// mesh after attachHead (only their triangles are dropped) and still count for
// grounding. Mei's hidden bun then holds the body off the mat unless the head
// is tipped slightly chin-down, hence the ~25deg crown-up head in SPINE_FLAT.
import { mirrorSpec } from '../rig.js';

const deg = (d) => (d * Math.PI) / 180;
// Direction in the sagittal (y-z) plane: `a` degrees above the floor, pointing toward +z (feet) when a < 90.
const up = (a, x = 0) => [x, Math.sin(deg(a)), Math.cos(deg(a))];

const MAT = { kind: 'mat', pos: [0, 0, -0.1] };

// Arms resting along the body, palms down.
const ARMS_SIDE = {
	LeftShoulder: { dir: [1, 0, 0.12], face: [0, 1, 0] },
	RightShoulder: { dir: [-1, 0, 0.12], face: [0, 1, 0] },
	LeftArm: { dir: [0.22, -0.05, 1], face: [0, 1, 0] },
	RightArm: { dir: [-0.22, -0.05, 1], face: [0, 1, 0] },
	LeftForeArm: { dir: [0.06, -0.08, 1], face: [0, 1, 0] },
	RightForeArm: { dir: [-0.06, -0.08, 1], face: [0, 1, 0] },
	LeftHand: { dir: [0.03, -0.05, 1], face: [-1, 0, 0] },
	RightHand: { dir: [-0.03, -0.05, 1], face: [1, 0, 0] }
};

const LEGS_FLAT = {
	LeftUpLeg: { dir: [0.05, -0.02, 1], face: [0, 1, 0] },
	RightUpLeg: { dir: [-0.05, -0.02, 1], face: [0, 1, 0] },
	LeftLeg: { dir: [0.01, 0, 1], face: [0, 1, 0] },
	RightLeg: { dir: [-0.01, 0, 1], face: [0, 1, 0] },
	LeftFoot: { dir: [0.08, 0.75, 0.75], face: [0, 0.75, -0.75] },
	RightFoot: { dir: [-0.08, 0.75, 0.75], face: [0, 0.75, -0.75] }
};

// The spine slopes slightly down toward the head so the shoulder blades, not
// only the glutes, rest on the mat.
const SPINE_FLAT = {
	Spine: [0, -0.1, -1],
	Spine1: [0, -0.14, -1],
	Spine2: [0, -0.14, -1],
	// Crown tipped ~25deg up (slight chin tuck). Needed because grounding also
	// counts the body's original head vertices (hidden by the bust, bun included):
	// a flatter head makes that invisible bun the floor contact and the whole
	// body floats a few cm.
	Neck: [0, 0.22, -1],
	Head: { dir: [0, 0.48, -1], face: [0, 1, 0.48] }
};

const SUPINE = {
	hips: { pos: [0, 0.1, 0], dir: [0, 0, -1], face: [0, 1, 0] },
	bones: { ...SPINE_FLAT, ...ARMS_SIDE, ...LEGS_FLAT }
};

// Knees bent, feet planted hip-width (IK), ankle a foot's height above the floor.
const plantFoot = (x, z, y = 0.08) => ({ target: [x, y, z], pole: [0, 1, 0.4] });
const FOOT_FLAT_L = { dir: [0.04, -0.3, 1], face: [0, 1, 0.3] };
const FOOT_FLAT_R = { dir: [-0.04, -0.3, 1], face: [0, 1, 0.3] };

// ----------------------------------------------------------- glute bridge
// Left foot planted, right leg extended in line with the left thigh.
const BRIDGE_DOWN = {
	hips: { pos: [0, 0.1, 0], dir: [0, 0, -1], face: [0, 1, 0] },
	bones: {
		...SUPINE.bones,
		LeftFoot: FOOT_FLAT_L,
		RightUpLeg: { dir: up(42, -0.06), face: [0, 1, -0.9] },
		RightLeg: { dir: up(42, -0.06), face: [0, 1, -0.9] },
		RightFoot: { dir: up(80, -0.06), face: [0, 0.2, -1] }
	},
	ik: { LeftFoot: plantFoot(0.11, 0.37, 0.095) }
};
const BRIDGE_UP = {
	hips: { pos: [0, 0.3, 0], dir: [0, -0.55, -1], face: [0, 1, -0.55] },
	bones: {
		...SUPINE.bones,
		Spine: [0, -0.52, -1],
		Spine1: [0, -0.42, -1],
		Spine2: [0, -0.12, -1],
		Neck: [0, 0.45, -1],
		Head: { dir: [0, 0.55, -1], face: [0, 1, 0.55] },
		LeftFoot: FOOT_FLAT_L,
		RightUpLeg: { dir: up(33, -0.06), face: [0, 1, -0.6] },
		RightLeg: { dir: up(33, -0.06), face: [0, 1, -0.5] },
		RightFoot: { dir: up(70, -0.06), face: [0, 0.3, -1] }
	},
	ik: { LeftFoot: { ...plantFoot(0.11, 0.37), target: [0.11, 0.1, 0.37] } }
};

// --------------------------------------------------------------- dead bug
const TABLE_ARMS = {
	LeftShoulder: { dir: [1, 0.1, 0], face: [0, 1, 0] },
	RightShoulder: { dir: [-1, 0.1, 0], face: [0, 1, 0] },
	LeftArm: { dir: [0.05, 1, 0.02], face: [0, 0, 1] },
	RightArm: { dir: [-0.05, 1, 0.02], face: [0, 0, 1] },
	LeftForeArm: { dir: [0.02, 1, 0.04], face: [0, 0, 1] },
	RightForeArm: { dir: [-0.02, 1, 0.04], face: [0, 0, 1] },
	LeftHand: { dir: [0, 1, 0.05], face: [-1, 0, 0] },
	RightHand: { dir: [0, 1, 0.05], face: [1, 0, 0] }
};
const TABLE_LEGS = {
	LeftUpLeg: { dir: [0.06, 1, 0.02], face: [0, 0, 1] },
	RightUpLeg: { dir: [-0.06, 1, 0.02], face: [0, 0, 1] },
	LeftLeg: { dir: [0, 0, 1], face: [0, 1, 0] },
	RightLeg: { dir: [0, 0, 1], face: [0, 1, 0] },
	LeftFoot: { dir: [0, 0.6, 1], face: [0, 1, -0.6] },
	RightFoot: { dir: [0, 0.6, 1], face: [0, 1, -0.6] }
};
const DEADBUG_TABLE = {
	// Posterior pelvic tilt (low back pressed down): the flexed hips otherwise
	// push the glutes down and lift the back off the mat.
	hips: { pos: [0, 0.1, 0], dir: [0, -0.4, -1], face: [0, 1, -0.4] },
	bones: { ...SPINE_FLAT, Spine: [0, -0.05, -1], Spine1: [0, 0, -1], Spine2: [0, 0.02, -1], ...TABLE_ARMS, ...TABLE_LEGS }
};
// Right arm reaches overhead, left leg extends long (opposite diagonal).
const DEADBUG_REACH = {
	...DEADBUG_TABLE,
	bones: {
		...DEADBUG_TABLE.bones,
		RightShoulder: { dir: [-1, 0.05, -0.15], face: [0, 1, 0] },
		RightArm: { dir: [-0.12, 0.25, -1], face: [0, 1, 0] },
		RightForeArm: { dir: [-0.06, 0.22, -1], face: [0, 1, 0] },
		RightHand: { dir: [-0.04, 0.2, -1], face: [0, 1, 0] },
		LeftUpLeg: { dir: up(22, 0.06), face: [0, 1, -0.4] },
		LeftLeg: { dir: up(18, 0.04), face: [0, 1, -0.3] },
		LeftFoot: { dir: up(55, 0.04), face: [0, 0.6, -1] }
	}
};

// ------------------------------------------------------------ hollow hold
const HOLLOW = {
	// Posterior pelvic tilt: the low back, not the glutes, carries the weight.
	hips: { pos: [0, 0.1, 0], dir: [0, -0.55, -1], face: [0, 1, -0.55] },
	bones: {
		Spine: [0, -0.1, -1],
		Spine1: [0, 0.4, -1],
		Spine2: [0, 0.58, -1],
		Neck: [0, 0.75, -1],
		Head: { dir: [0, 0.6, -1], face: [0, 1, 0.6] },
		LeftShoulder: { dir: [1, 0.05, 0.12], face: [0, 1, 0] },
		RightShoulder: { dir: [-1, 0.05, 0.12], face: [0, 1, 0] },
		LeftArm: { dir: [0.18, 0.12, 1], face: [0, 1, 0] },
		RightArm: { dir: [-0.18, 0.12, 1], face: [0, 1, 0] },
		LeftForeArm: { dir: [0.05, 0.12, 1], face: [0, 1, 0] },
		RightForeArm: { dir: [-0.05, 0.12, 1], face: [0, 1, 0] },
		LeftHand: { dir: [0.02, 0.25, 1], face: [-1, 0, 0] },
		RightHand: { dir: [-0.02, 0.25, 1], face: [1, 0, 0] },
		LeftUpLeg: { dir: up(22, 0.03), face: [0, 1, -0.4] },
		RightUpLeg: { dir: up(22, -0.03), face: [0, 1, -0.4] },
		LeftLeg: { dir: up(20, 0.0), face: [0, 1, -0.35] },
		RightLeg: { dir: up(20, 0.0), face: [0, 1, -0.35] },
		LeftFoot: { dir: up(55, 0.03), face: [0, 0.6, -1] },
		RightFoot: { dir: up(55, -0.03), face: [0, 0.6, -1] }
	}
};
// Exhale: a touch more curl and slightly lower legs (subtle breathing).
const HOLLOW_EXHALE = {
	...HOLLOW,
	bones: {
		...HOLLOW.bones,
		Spine1: [0, 0.44, -1],
		Spine2: [0, 0.64, -1],
		LeftUpLeg: { dir: up(19, 0.03), face: [0, 1, -0.35] },
		RightUpLeg: { dir: up(19, -0.03), face: [0, 1, -0.35] },
		LeftLeg: { dir: up(17, 0.0), face: [0, 1, -0.3] },
		RightLeg: { dir: up(17, 0.0), face: [0, 1, -0.3] }
	}
};

// ------------------------------------------------ supine hamstring stretch
// Left leg lifted straight, band around the foot held in both hands; right leg long.
// Both hands near the leg's line (left leg = +x), elbows soft; `lift` bends the
// elbows more as the hands draw the band in.
const hamArms = (lift) => ({
	LeftShoulder: { dir: [1, 0.12, 0.1], face: [0, 1, 0] },
	RightShoulder: { dir: [-1, 0.12, 0.1], face: [0, 1, 0] },
	LeftArm: { dir: [-0.05, 1, 0.5 - lift], face: [0.5, 0, 1] },
	RightArm: { dir: [0.38, 1, 0.5 - lift], face: [-0.5, 0, 1] },
	LeftForeArm: { dir: [-0.02, 1, 0.95 - lift * 0.5], face: [0.5, 0, 1] },
	RightForeArm: { dir: [0.22, 1, 0.95 - lift * 0.5], face: [-0.5, 0, 1] },
	LeftHand: { dir: [0, 1, 0.9], face: [-1, 0, 0] },
	RightHand: { dir: [0.1, 1, 0.9], face: [1, 0, 0] }
});
const hamLeg = (a) => ({
	LeftUpLeg: { dir: up(a, 0.05), face: [0, Math.cos(deg(a)), -Math.sin(deg(a))] },
	LeftLeg: { dir: up(a, 0.04), face: [0, Math.cos(deg(a)), -Math.sin(deg(a))] },
	LeftFoot: { dir: up(a + 70, 0.03), face: [0, Math.cos(deg(a + 70)), -Math.sin(deg(a + 70))] }
});
const HAM_LIFT = {
	hips: SUPINE.hips,
	bones: { ...SUPINE.bones, ...hamArms(0), ...hamLeg(62) }
};
const HAM_PULL = {
	hips: { ...SUPINE.hips, dir: [0, 0.02, -1], face: [0, 1, 0.02] },
	bones: { ...SUPINE.bones, ...hamArms(0.3), ...hamLeg(78) }
};

// ---------------------------------------------------- lying spinal twist
// Left knee crosses over to the right toward the floor, left arm out to the side.
const T_ARMS = {
	LeftShoulder: { dir: [1, 0, 0], face: [0, 1, 0] },
	RightShoulder: { dir: [-1, 0, 0], face: [0, 1, 0] },
	LeftArm: { dir: [1, -0.05, 0.15], face: [0, 1, 0] },
	RightArm: { dir: [-1, -0.05, 0.15], face: [0, 1, 0] },
	LeftForeArm: { dir: [1, -0.05, 0.12], face: [0, 1, 0] },
	RightForeArm: { dir: [-1, -0.05, 0.12], face: [0, 1, 0] },
	LeftHand: { dir: [1, -0.05, 0.1], face: [0, 0, -1] },
	RightHand: { dir: [-1, -0.05, 0.1], face: [0, 0, -1] }
};
const TWIST_SETUP = {
	hips: SUPINE.hips,
	bones: {
		...SUPINE.bones,
		...T_ARMS,
		LeftUpLeg: { dir: [0.03, 1, 0.5], face: [0, 0.5, -1] },
		LeftLeg: { dir: [0, -0.15, 1], face: [0, 1, 0.15] },
		LeftFoot: { dir: [0, 0.3, 1], face: [0, 1, -0.3] }
	}
};
const TWIST = {
	hips: { pos: [0, 0.1, 0], dir: [0, 0, -1], face: [-0.75, 0.66, 0] },
	bones: {
		Spine: { dir: [0, -0.24, -1], face: [-0.55, 0.83, -0.2] },
		Spine1: { dir: [0, -0.26, -1], face: [-0.3, 0.95, -0.25] },
		Spine2: { dir: [0, -0.2, -1], face: [-0.1, 1, -0.2] },
		Neck: { dir: [0, 0.25, -1], face: [0, 1, 0.25] },
		// Gaze turns gently toward the extended (left) arm.
		Head: { dir: [0.05, 0.5, -1], face: [0.4, 1, 0.5] },
		...T_ARMS,
		// Hip and knee ~90deg, thigh across the body, knee resting on the floor.
		LeftUpLeg: { dir: [-0.85, -0.35, -0.12], face: [-0.25, 0.15, -1] },
		LeftLeg: { dir: [-0.3, 0.0, 1], face: [-1, 0.1, -0.3] },
		LeftFoot: { dir: [-0.3, 0.2, 1], face: [-1, 0.3, 0.2] },
		RightUpLeg: { dir: [-0.12, -0.02, 1], face: [-0.5, 0.85, 0] },
		RightLeg: { dir: [-0.04, 0, 1], face: [-0.3, 1, 0] },
		RightFoot: { dir: [-0.3, 0.65, 0.75], face: [-0.2, 0.75, -0.75] }
	}
};

// ------------------------------------------------------- knees to chest
// Hands wrap the top of the shins just below the knees (IK), elbows out.
const hugArms = {
	LeftShoulder: { dir: [1, 0.2, 0.15], face: [0, 1, 0] },
	RightShoulder: { dir: [-1, 0.2, 0.15], face: [0, 1, 0] },
	LeftHand: { dir: [-0.35, -0.3, 1], face: [-0.2, 1, 0.3] },
	RightHand: { dir: [0.35, -0.3, 1], face: [0.2, 1, 0.3] }
};
const hugHands = (y, z) => ({
	LeftHand: { target: [0.13, y, z], pole: [1, -0.4, 0.2] },
	RightHand: { target: [-0.13, y, z], pole: [-1, -0.4, 0.2] }
});
const hugLegs = (a) => ({
	// `a`: thigh angle past vertical toward the chest.
	LeftUpLeg: { dir: [0.1, Math.cos(deg(a)), -Math.sin(deg(a))], face: [0, Math.sin(deg(a)), Math.cos(deg(a))] },
	RightUpLeg: { dir: [-0.1, Math.cos(deg(a)), -Math.sin(deg(a))], face: [0, Math.sin(deg(a)), Math.cos(deg(a))] },
	LeftLeg: { dir: [0, 0.35, 1], face: [0, 1, -0.35] },
	RightLeg: { dir: [0, 0.35, 1], face: [0, 1, -0.35] },
	LeftFoot: { dir: [0, 0.9, 0.5], face: [0, 0.5, -0.9] },
	RightFoot: { dir: [0, 0.9, 0.5], face: [0, 0.5, -0.9] }
});
const hugPose = (thighDeg, shinDrop, pelvicTilt, pull) => {
	const ca = Math.cos(deg(thighDeg)), sa = Math.sin(deg(thighDeg));
	return {
		// Roll pelvis with the thighs (posterior tilt) so the hip-joint skinning
		// angle stays ~75deg and the glutes curve smoothly without a sharp crease.
		hips: { pos: [0, 0.1, 0], dir: [0, -pelvicTilt, -1], face: [0, 1, -pelvicTilt] },
		bones: {
			...SPINE_FLAT,
			Spine: [0, -pelvicTilt * 0.45, -1],
			Spine1: [0, 0.04, -1],
			Spine2: [0, 0.08, -1],
			// Elbows stay out beside the ribs while forearms reach up to the top of
			// the shins; thumbs point inward (`face: [∓1, ...]`) so palms rest flat
			// across the shins without slicing into the knees.
			LeftShoulder: { dir: [1, 0.25, 0.25], face: [0, 1, 0] },
			RightShoulder: { dir: [-1, 0.25, 0.25], face: [0, 1, 0] },
			LeftArm: { dir: [0.34, 0.80 + pull * 0.04, 0.46 - pull * 0.08], face: [-0.6, 0.5, -0.6] },
			RightArm: { dir: [-0.34, 0.80 + pull * 0.04, 0.46 - pull * 0.08], face: [0.6, 0.5, -0.6] },
			LeftForeArm: { dir: [-0.48, 0.74 - pull * 0.05, 0.44 - pull * 0.08], face: [-0.85, 0.35, -0.4] },
			RightForeArm: { dir: [0.48, 0.74 - pull * 0.05, 0.44 - pull * 0.08], face: [0.85, 0.35, -0.4] },
			LeftHand: { dir: [-0.35, -0.20, 0.91], face: [-0.96, 0.15, -0.22] },
			RightHand: { dir: [0.35, -0.20, 0.91], face: [0.96, 0.15, -0.22] },
			LeftUpLeg: { dir: [0.10, ca, -sa], face: [0, sa, ca] },
			RightUpLeg: { dir: [-0.10, ca, -sa], face: [0, sa, ca] },
			LeftLeg: { dir: [-0.03, -shinDrop, 1], face: [0, 1, shinDrop] },
			RightLeg: { dir: [0.03, -shinDrop, 1], face: [0, 1, shinDrop] },
			LeftFoot: { dir: [-0.02, 0.45, 0.89], face: [0, 0.89, -0.45] },
			RightFoot: { dir: [0.02, 0.45, 0.89], face: [0, 0.89, -0.45] }
		}
	};
};
const HUG = hugPose(34, 0.08, 0.70, 0);
const HUG_ROCK = hugPose(42, 0.12, 0.84, 1);

// ------------------------------------------------- thoracic roller extension
// Fingers laced behind the head, elbows wide. `drop` tips the forearms toward
// the floor as the head goes back in the extension.
const headHands = (drop = 0) => ({
	LeftShoulder: { dir: [1, 0.15, -0.15], face: [0, 1, 0] },
	RightShoulder: { dir: [-1, 0.15, -0.15], face: [0, 1, 0] },
	LeftArm: { dir: [0.85, 0.3 - drop, -0.55], face: [0, 1, 0] },
	RightArm: { dir: [-0.85, 0.3 - drop, -0.55], face: [0, 1, 0] },
	LeftForeArm: { dir: [-0.85, -0.05 - drop, -0.45], face: [0, 1, 0] },
	RightForeArm: { dir: [0.85, -0.05 - drop, -0.45], face: [0, 1, 0] },
	LeftHand: { dir: [-0.8, -0.2 - drop, -0.2], face: [0, 0.5, -1] },
	RightHand: { dir: [0.8, -0.2 - drop, -0.2], face: [0, 0.5, -1] }
});
const ROLLER_BASE = {
	hips: { pos: [0, 0.1, 0], dir: [0, 0.32, -1], face: [0, 1, 0.32] },
	bones: {
		Spine: [0, 0.36, -1],
		Spine1: [0, 0.38, -1],
		Spine2: [0, 0.36, -1],
		Neck: [0, 0.45, -1],
		Head: { dir: [0, 0.4, -1], face: [0, 1, 0.4] },
		...headHands(0),
		LeftFoot: FOOT_FLAT_L,
		RightFoot: FOOT_FLAT_R
	},
	ik: { LeftFoot: plantFoot(0.12, 0.42, 0.09), RightFoot: plantFoot(-0.12, 0.42, 0.09) }
};
const ROLLER_EXTEND = {
	...ROLLER_BASE,
	bones: {
		...ROLLER_BASE.bones,
		Spine1: [0, 0.3, -1],
		Spine2: [0, -0.1, -1],
		Neck: [0, -0.2, -1],
		Head: { dir: [0, -0.3, -1], face: [0, 1, -0.3] },
		...headHands(0.25)
	}
};

export const MOVEMENTS = [
	{
		id: 'single-leg-glute-bridge',
		name: 'Single-Leg Glute Bridge',
		seed: 'Single-Leg Glute Bridge',
		bilateral: true,
		view: { azimuth: 70, elevation: 14 },
		icon: 'up',
		props: [MAT],
		poses: { down: BRIDGE_DOWN, up: BRIDGE_UP },
		timeline: [
			{ pose: 'down', hold: 0.8, in: 1.6 },
			{ pose: 'up', in: 1.6, hold: 1.4 }
		]
	},
	{
		id: 'dead-bug',
		name: 'Dead Bug',
		seed: 'Dead Bug',
		view: { azimuth: 65, elevation: 18 },
		icon: 'reach',
		props: [MAT],
		poses: { table: DEADBUG_TABLE, reach: DEADBUG_REACH, reach2: mirrorSpec(DEADBUG_REACH) },
		timeline: [
			{ pose: 'table', hold: 0.5, in: 1.4 },
			{ pose: 'reach', in: 1.8, hold: 0.8 },
			{ pose: 'table', in: 1.6, hold: 0.5 },
			{ pose: 'reach2', in: 1.8, hold: 0.8 }
		]
	},
	{
		id: 'hollow-hold',
		name: 'Hollow Hold',
		seed: 'Hollow Hold',
		view: { azimuth: 80, elevation: 10 },
		icon: 'hold',
		props: [MAT],
		poses: { hold: HOLLOW, exhale: HOLLOW_EXHALE },
		timeline: [
			{ pose: 'hold', hold: 1.2, in: 1.8 },
			{ pose: 'exhale', in: 1.8, hold: 1.2 }
		]
	},
	{
		id: 'supine-hamstring-stretch',
		name: 'Supine Hamstring Stretch',
		seed: 'Supine Hamstring Stretch',
		bilateral: true,
		view: { azimuth: 75, elevation: 12 },
		icon: 'pull',
		props: [MAT, { kind: 'band', through: ['LeftHand', 'LeftToeBase', 'RightHand'] }],
		poses: { lift: HAM_LIFT, pull: HAM_PULL },
		timeline: [
			{ pose: 'lift', hold: 1.0, in: 2.0 },
			{ pose: 'pull', in: 2.2, hold: 2.0 }
		]
	},
	{
		id: 'lying-spinal-twist',
		name: 'Lying Spinal Twist',
		seed: 'Lying Spinal Twist',
		bilateral: true,
		view: { azimuth: 20, elevation: 58 },
		icon: 'twist',
		props: [MAT],
		poses: { setup: TWIST_SETUP, twist: TWIST },
		timeline: [
			{ pose: 'setup', hold: 0.8, in: 2.2 },
			{ pose: 'twist', in: 2.6, hold: 2.2 }
		]
	},
	{
		id: 'knees-to-chest',
		name: 'Knees to Chest',
		seed: 'Knees to Chest',
		view: { azimuth: 112, elevation: 24 },
		icon: 'rock',
		props: [MAT],
		poses: { hug: HUG, rock: HUG_ROCK },
		timeline: [
			{ pose: 'hug', hold: 0.7, in: 1.8 },
			{ pose: 'rock', in: 1.8, hold: 0.9 }
		]
	},
	{
		id: 'thoracic-roller-extensions',
		name: 'Thoracic Roller Extensions',
		seed: 'Thoracic Roller Extensions',
		view: { azimuth: 78, elevation: 10 },
		icon: 'extend',
		props: [MAT, { kind: 'roller', pos: [0, 0.075, 0], at: { bone: 'Spine2', offset: [0, 0, -0.02] }, axes: 'z' }],
		poses: { neutral: ROLLER_BASE, extend: ROLLER_EXTEND },
		timeline: [
			{ pose: 'neutral', hold: 0.8, in: 2.0 },
			{ pose: 'extend', in: 2.2, hold: 1.6 }
		]
	}
];
