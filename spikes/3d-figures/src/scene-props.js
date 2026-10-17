// Per-movement equipment. A movement lists `props`, e.g.
//   { kind: 'wall', pos: [0, 0, -0.35] }                 wall face at z = -0.35, facing +z
//   { kind: 'block', at: { bone: 'LeftToeBase', offset: [0, -0.04, 0] }, axes: 'xz' }
//   { kind: 'anchor', id: 'a', pos: [0, 0, -1.2], height: 1.4 }
//   { kind: 'band', through: ['LeftHand', { prop: 'a' }, 'RightHand'] }
// pos: world position; rotY: degrees about y. `at` places the prop on a bone
// (world offset; `along` = metres along the bone's direction) after every pose,
// `axes` limits which coordinates follow (e.g. 'xz' keeps the prop on the floor).
// Mirroring flips x and swaps Left/Right bone names, like mirrorSpec.
import * as THREE from 'three';
import { loadProp, makeMat, makeWall, makeAnchor, makeBand, makeRoller } from './props.js';

const MADE = {
	wall: (p) => makeWall({ width: p.width ?? 1.6, height: p.height ?? 2.2 }),
	mat: () => makeMat(),
	anchor: (p) => makeAnchor({ height: p.height ?? 1.4 }),
	roller: () => makeRoller()
};
// Big surfaces would blow up the framing box; the camera frames the body + small props.
const UNFRAMED = new Set(['wall', 'mat', 'anchor', 'pullup']);

const swapName = (s) => s.replace(/^Left|^Right/, (m) => (m === 'Left' ? 'Right' : 'Left'));
const flipX = (a) => a && [-a[0], a[1], a[2]];

export function mirrorProps(props = []) {
	return props.map((p) => ({
		...p,
		pos: flipX(p.pos),
		rotY: p.rotY && -p.rotY,
		at: p.at && { ...p.at, bone: swapName(p.at.bone), offset: flipX(p.at.offset) },
		through: p.through?.map((t) => (typeof t === 'string' ? swapName(t) : Array.isArray(t) ? flipX(t) : t))
	}));
}

const cache = new Map();
async function build(p) {
	if (MADE[p.kind]) return MADE[p.kind](p);
	if (!cache.has(p.kind)) cache.set(p.kind, loadProp(p.kind));
	return (await cache.get(p.kind)).clone(true);
}

/** Builds a movement's props into `scene`; call update(fig) after each pose. */
export async function createProps(scene, specs = []) {
	const group = new THREE.Group();
	group.name = 'movement-props';
	const items = [];
	for (const spec of specs) {
		if (spec.kind === 'band') {
			const band = makeBand({ loop: spec.loop, width: spec.width });
			group.add(band);
			items.push({ spec, obj: band });
			continue;
		}
		const obj = await build(spec);
		if (spec.pos) obj.position.set(...spec.pos);
		if (spec.rotY) obj.rotation.y = THREE.MathUtils.degToRad(spec.rotY);
		if (spec.rotX) obj.rotation.x = THREE.MathUtils.degToRad(spec.rotX);
		if (spec.rotZ) obj.rotation.z = THREE.MathUtils.degToRad(spec.rotZ);
		group.add(obj);
		items.push({ spec, obj });
	}
	scene.add(group);

	const v = new THREE.Vector3();
	const boneWorld = (fig, name) => fig.bones[name].getWorldPosition(new THREE.Vector3());
	function update(fig) {
		fig.figure.updateMatrixWorld(true);
		for (const { spec, obj } of items) {
			if (!spec.at) continue;
			const p = boneWorld(fig, spec.at.bone);
			if (spec.at.along) {
				const child = fig.bones[spec.at.bone].children.find((c) => c.isBone);
				if (child) p.addScaledVector(child.getWorldPosition(v).sub(p).normalize(), spec.at.along);
			}
			if (spec.at.offset) p.add(new THREE.Vector3(...spec.at.offset));
			const axes = spec.axes ?? 'xyz';
			// Coordinates that don't follow the bone keep the prop's own placement.
			const base = spec.pos ?? (obj.userData.base ??= obj.position.toArray());
			obj.position.set(axes.includes('x') ? p.x : base[0], axes.includes('y') ? p.y : base[1], axes.includes('z') ? p.z : base[2]);
		}
		group.updateMatrixWorld(true);
		for (const { spec, obj } of items) {
			if (spec.kind !== 'band') continue;
			const pts = spec.through.map((t) => {
				if (typeof t === 'string') return boneWorld(fig, t);
				if (Array.isArray(t)) return new THREE.Vector3(...t);
				const target = items.find((i) => i.spec.id === t.prop)?.obj;
				const local = target?.userData.point ?? new THREE.Vector3();
				return target.localToWorld(local.clone());
			});
			obj.update(pts);
		}
	}

	/** Bounds of the props that should stay in frame. */
	function bounds() {
		const box = new THREE.Box3();
		for (const { spec, obj } of items) if (!UNFRAMED.has(spec.kind) && spec.frame !== false) box.expandByObject(obj);
		return box;
	}

	const dispose = () => scene.remove(group);
	return { group, update, bounds, dispose };
}
