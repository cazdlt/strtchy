// Pose solver for the rigged mannequin.
//
// Poses are authored as WORLD-SPACE directions per bone ("left thigh points
// forward-down") instead of local Euler angles, because the auto-rig's bone
// frames are arbitrary. Every specified bone is absolute, so posing the pelvis
// never drags the legs along. Two-bone IK handles contacts (hands on floor).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// GLTFLoader strips the ':' from 'mixamorig:Hips'.
const PREFIX = /^mixamorig:?/;
// Bones whose axis isn't their longest child (Hips would otherwise aim at a leg).
const AXIS_CHILD = { Hips: 'Spine', Spine2: 'Neck' };
const IK_CHAINS = {
	LeftHand: ['LeftArm', 'LeftForeArm'],
	RightHand: ['RightArm', 'RightForeArm'],
	LeftFoot: ['LeftUpLeg', 'LeftLeg'],
	RightFoot: ['RightUpLeg', 'RightLeg']
};

const Z = new THREE.Vector3(0, 0, 1);
const v3 = (a) => new THREE.Vector3(...a);

export async function loadFigure(url) {
	const gltf = await new GLTFLoader().loadAsync(url);
	const figure = new THREE.Group();
	figure.add(gltf.scene);

	let mesh;
	gltf.scene.traverse((o) => {
		if (o.isSkinnedMesh) mesh = o;
		if (o.isMesh) {
			o.castShadow = true;
			o.frustumCulled = false;
			// Sculpt textures bake in glossy, wet-looking skin; a uniform matte
			// finish reads calmer and hides faceting on the face.
			const mat = o.material;
			mat.roughnessMap = null;
			mat.metalnessMap = null;
			mat.roughness = 0.82;
			mat.metalness = 0;
			mat.needsUpdate = true;
		}
	});

	const bones = {};
	const order = [];
	for (const b of mesh.skeleton.bones) {
		const name = b.name.replace(PREFIX, '');
		bones[name] = b;
		order.push(name);
	}

	// Sculpts occasionally come out facing -Z. Toes point where the figure
	// faces, so turn the whole model around if they point backwards.
	figure.updateMatrixWorld(true);
	if (bones.LeftToeBase && bones.LeftFoot) {
		const toe = bones.LeftToeBase.getWorldPosition(new THREE.Vector3());
		const ankle = bones.LeftFoot.getWorldPosition(new THREE.Vector3());
		if (toe.z < ankle.z) {
			gltf.scene.rotation.y += Math.PI;
			figure.updateMatrixWorld(true);
		}
	}
	const rest = {};
	for (const name of order) {
		const b = bones[name];
		const q0 = b.getWorldQuaternion(new THREE.Quaternion());
		const p0 = b.getWorldPosition(new THREE.Vector3());
		let child = AXIS_CHILD[name] ? bones[AXIS_CHILD[name]] : null;
		for (const c of b.children) {
			if (AXIS_CHILD[name]) break;
			if (c.isBone && (!child || c.position.length() > child.position.length())) child = c;
		}
		const parentName = b.parent?.isBone ? b.parent.name.replace(PREFIX, '') : null;
		const D0 = child
			? child.getWorldPosition(new THREE.Vector3()).sub(p0).normalize()
			: parentName
				? rest[parentName].D0.clone()
				: new THREE.Vector3(0, 1, 0);
		const F0 = orthogonal(Z, D0, new THREE.Vector3(0, -1, 0));
		const qInv = q0.clone().invert();
		rest[name] = {
			D0,
			F0,
			localD: D0.clone().applyQuaternion(qInv),
			localF: F0.clone().applyQuaternion(qInv),
			quat: b.quaternion.clone(),
			pos: b.position.clone(),
			worldPos: p0,
			length: child ? child.getWorldPosition(new THREE.Vector3()).distanceTo(p0) : 0
		};
	}

	return { figure, mesh, bones, order, rest };
}

/** Typical skin colour (linear RGB) of a mesh's texture under the given vertices. */
function meanTexColor(geometry, material, vertexIds) {
	const img = material.map?.image;
	const uv = geometry.attributes.uv;
	if (!img || !uv || !vertexIds.length) return null;
	const c = document.createElement('canvas');
	c.width = img.width;
	c.height = img.height;
	const ctx = c.getContext('2d', { willReadFrequently: true });
	ctx.drawImage(img, 0, 0);
	const data = ctx.getImageData(0, 0, c.width, c.height).data;
	const samples = [];
	for (const i of vertexIds) {
		let u = uv.getX(i) % 1, w = uv.getY(i) % 1;
		if (u < 0) u += 1;
		if (w < 0) w += 1;
		const x = Math.min(c.width - 1, Math.floor(u * c.width));
		const y = Math.min(c.height - 1, Math.floor((material.map.flipY ? 1 - w : w) * c.height));
		const o = (y * c.width + x) * 4;
		samples.push(new THREE.Color().setRGB(data[o] / 255, data[o + 1] / 255, data[o + 2] / 255, THREE.SRGBColorSpace));
	}
	// Skin dominates, but hair, brows and lips are darker: average the 45–85th
	// luminance percentile, which lands on skin.
	const lum = (k) => 0.2126 * k.r + 0.7152 * k.g + 0.0722 * k.b;
	// Vertices on UV island borders land on the atlas' black gutters: skip those.
	const skin = samples.filter((k) => lum(k) > 0.02);
	if (!skin.length) return null;
	samples.length = 0;
	samples.push(...skin);
	samples.sort((a, b) => lum(a) - lum(b));
	const pick = samples.slice(Math.floor(samples.length * 0.45), Math.max(Math.floor(samples.length * 0.85), Math.floor(samples.length * 0.45) + 1));
	const acc = new THREE.Color(0, 0, 0);
	for (const k of pick) {
		acc.r += k.r;
		acc.g += k.g;
		acc.b += k.b;
	}
	return acc.multiplyScalar(1 / pick.length);
}

/** Per-vertex sRGB luminance (0–1) of the mesh texture; 0 on atlas gutters. */
function vertexLuminance(geometry, material) {
	const img = material.map?.image;
	const uv = geometry.attributes.uv;
	const out = new Float32Array(geometry.attributes.position.count);
	if (!img || !uv) return out;
	const c = document.createElement('canvas');
	c.width = img.width;
	c.height = img.height;
	const ctx = c.getContext('2d', { willReadFrequently: true });
	ctx.drawImage(img, 0, 0);
	const data = ctx.getImageData(0, 0, c.width, c.height).data;
	for (let i = 0; i < out.length; i++) {
		let u = uv.getX(i) % 1, w = uv.getY(i) % 1;
		if (u < 0) u += 1;
		if (w < 0) w += 1;
		const x = Math.min(c.width - 1, Math.floor(u * c.width));
		const y = Math.min(c.height - 1, Math.floor((material.map.flipY ? 1 - w : w) * c.height));
		const o = (y * c.width + x) * 4;
		out[i] = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
	}
	return out;
}

/**
 * Replace the sculpt's own head with a separately sculpted, higher-detail bust.
 * Full-body sculpts give the face only a few dozen pixels of the concept image,
 * so faces come out melted; a head-only sculpt has ~20x the detail.
 *   1. drop body triangles skinned mostly to Head (face, skull, hair)
 *   2. scale the bust by head width, align crown and centre
 *   3. keep the bust's neck down to the base of the neck (hidden by the collar)
 *      and skin it: Head above the head joint, blending to Neck below, so the
 *      neck bends with the body instead of swinging rigidly.
 * Must run while the figure is still in its bind pose (right after loadFigure).
 */
// dropHair: also remove the body sculpt's own long hair (a ponytail hanging
// down the back is skinned to Neck/Spine, so it survives the Head cut): dark
// texels behind the neck, from the head down to the shoulder blades.
export async function attachHead(fig, url, { threshold = 0.5, collar = 0.035, scale = 1, dropHair = false } = {}) {
	const { mesh, bones } = fig;
	const geo = mesh.geometry;
	const headIdx = mesh.skeleton.bones.indexOf(bones.Head);
	const neckIdx = mesh.skeleton.bones.indexOf(bones.Neck);
	const si = geo.attributes.skinIndex;
	const sw = geo.attributes.skinWeight;
	const nV = geo.attributes.position.count;
	const headW = new Float32Array(nV);
	const neckW = new Float32Array(nV);
	for (let i = 0; i < nV; i++)
		for (let k = 0; k < 4; k++) {
			if (si.getComponent(i, k) === headIdx) headW[i] += sw.getComponent(i, k);
			if (si.getComponent(i, k) === neckIdx) neckW[i] += sw.getComponent(i, k);
		}

	fig.figure.updateMatrixWorld(true);
	const neckY = bones.Neck.getWorldPosition(new THREE.Vector3()).y;
	// The bust's neck replaces the body's neck skin down to just above the collar.
	const cutY = neckY + collar;
	// Seam surface: a shallow cone around the neck axis (rises toward the
	// shoulders), so the bust's trapezius never flares over the shirt.
	const wp = [];
	for (let i = 0; i < nV; i++) wp.push(mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
	// Neck cylinder centre: centroid of the body's neck skin in a band above the collar.
	const neckP = new THREE.Vector3();
	let nb = 0;
	for (let i = 0; i < nV; i++)
		if (neckW[i] + headW[i] > 0.5 && wp[i].y > cutY && wp[i].y < cutY + 0.04) {
			neckP.add(wp[i]);
			nb++;
		}
	if (nb) neckP.divideScalar(nb);
	else bones.Neck.getWorldPosition(neckP);
	// Neck radius: mean distance of that band from the centre.
	let neckR = 0;
	for (let i = 0; i < nV; i++)
		if (neckW[i] + headW[i] > 0.5 && wp[i].y > cutY && wp[i].y < cutY + 0.04) neckR += Math.hypot(wp[i].x - neckP.x, wp[i].z - neckP.z);
	neckR = nb ? neckR / nb : 0.06;

	const seamY = (p) => cutY + Math.min(0.03, Math.max(0, Math.hypot(p.x - neckP.x, p.z - neckP.z) - 0.075) * 1.2);
	const radius = (p) => Math.hypot(p.x - neckP.x, p.z - neckP.z);
	const lum = dropHair ? vertexLuminance(geo, mesh.material) : null;
	const isHair = (i) => lum && lum[i] > 0.03 && lum[i] < 0.34 && wp[i].y > cutY - 0.34 && wp[i].z < neckP.z - 0.02 && radius(wp[i]) < 0.2;
	const drop = (i) => headW[i] >= threshold || isHair(i) || (wp[i].y > seamY(wp[i]) + 0.015 && radius(wp[i]) < 0.13 && headW[i] + neckW[i] > 0.05);
	const removed = new THREE.Box3();
	const v = new THREE.Vector3();
	for (let i = 0; i < nV; i++) {
		if (headW[i] < threshold) continue;
		mesh.getVertexPosition(i, v);
		removed.expandByPoint(v.applyMatrix4(mesh.matrixWorld));
	}
	// Skin-tone reference: the front of the old face (cheeks/forehead band).
	const faceBand = (p) => p.y > removed.min.y + (removed.max.y - removed.min.y) * 0.35 && p.y < removed.min.y + (removed.max.y - removed.min.y) * 0.7 && p.z > removed.getCenter(new THREE.Vector3()).z + 0.03;
	const bodySkinIds = [];
	for (let i = 0; i < nV; i++) if (headW[i] >= threshold && faceBand(wp[i])) bodySkinIds.push(i);
	const bodySkin = meanTexColor(geo, mesh.material, bodySkinIds);
	const index = geo.index.array;
	const kept = [];
	for (let t = 0; t < index.length; t += 3) {
		const [a, b, c] = [index[t], index[t + 1], index[t + 2]];
		if (drop(a) && drop(b) && drop(c)) continue;
		// Hair is part of the sculpt's one surface: drop any triangle touching it
		// (tucking its corners onto the neck would stretch long streaks).
		if (dropHair && (isHair(a) || isHair(b) || isHair(c))) continue;
		kept.push(a, b, c);
	}
	geo.setIndex(kept);
	// Dropped corners of kept (straddling) body triangles: tuck them onto the
	// seam, just inside the neck, so they don't poke out as spikes.
	const used = new Uint8Array(nV);
	for (const i of kept) used[i] = 1;
	const inv = mesh.matrixWorld.clone().invert();
	const bodyPos = geo.attributes.position;
	for (let i = 0; i < nV; i++) {
		if (!used[i] || !drop(i) || isHair(i)) continue;
		const p = wp[i];
		const dx = p.x - neckP.x, dz = p.z - neckP.z, r = Math.hypot(dx, dz);
		const k = r > neckR * 0.85 ? (neckR * 0.85) / r : 1;
		const q = new THREE.Vector3(neckP.x + dx * k, cutY + 0.015, neckP.z + dz * k).applyMatrix4(inv);
		bodyPos.setXYZ(i, q.x, q.y, q.z);
	}
	// Vertices of dropped triangles are still in the buffer, and skinned bounds
	// (ground(), framing) count every vertex: park them inside the neck so the
	// removed head/bun can't hold the body off the floor.
	const parked = new THREE.Vector3(neckP.x, cutY, neckP.z).applyMatrix4(inv);
	for (let i = 0; i < nV; i++) if (!used[i]) bodyPos.setXYZ(i, parked.x, parked.y, parked.z);
	bodyPos.needsUpdate = true;
	geo.computeBoundingSphere();

	// Bust placement (world space): match cranium width (top 40% of the bust).
	const gltf = await new GLTFLoader().loadAsync(url);
	const bust = gltf.scene;
	bust.updateMatrixWorld(true);
	const bb = new THREE.Box3().setFromObject(bust);
	const cranium = new THREE.Box3();
	bust.traverse((o) => {
		if (!o.isMesh) return;
		const pos = o.geometry.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
			if (v.y > bb.max.y - (bb.max.y - bb.min.y) * 0.4) cranium.expandByPoint(v);
		}
	});
	const s = ((removed.max.x - removed.min.x) / (cranium.max.x - cranium.min.x)) * scale;
	const rc = removed.getCenter(new THREE.Vector3());
	const cc = cranium.getCenter(new THREE.Vector3());
	const place = new THREE.Matrix4().makeTranslation(rc.x - cc.x * s, removed.max.y - bb.max.y * s, rc.z - cc.z * s).multiply(new THREE.Matrix4().makeScale(s, s, s));

	const headY = bones.Head.getWorldPosition(new THREE.Vector3()).y;
	const toBodyLocal = mesh.matrixWorld.clone().invert();
	const parts = [];
	bust.traverse((o) => {
		if (!o.isMesh) return;
		const g = o.geometry.clone();
		g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(place, o.matrixWorld));
		const pos = g.attributes.position;
		const n = pos.count;
		const below = new Uint8Array(n);
		const bustIds = [];
		const skinIndex = new Uint16Array(n * 4);
		const skinWeight = new Float32Array(n * 4);
		for (let i = 0; i < n; i++) {
			const y = pos.getY(i);
			below[i] = y < seamY(v.fromBufferAttribute(pos, i)) ? 1 : 0;
			if (faceBand(v)) bustIds.push(i);
			const h = THREE.MathUtils.clamp((y - neckY) / Math.max(headY - neckY, 1e-3), 0, 1);
			skinIndex[i * 4] = headIdx;
			skinIndex[i * 4 + 1] = neckIdx;
			skinWeight[i * 4] = h;
			skinWeight[i * 4 + 1] = 1 - h;
		}
		// Triangles fully below the seam go; straddling ones keep their lower
		// vertices clamped onto the seam, giving a clean edge instead of a fringe.
		const idx = g.index ? g.index.array : [...Array(n).keys()];
		const keep = [];
		for (let t = 0; t < idx.length; t += 3) if (!(below[idx[t]] && below[idx[t + 1]] && below[idx[t + 2]])) keep.push(idx[t], idx[t + 1], idx[t + 2]);
		for (let i = 0; i < n; i++) {
			if (!below[i]) continue;
			v.fromBufferAttribute(pos, i);
			const dx = v.x - neckP.x, dz = v.z - neckP.z, r = Math.hypot(dx, dz);
			const k = r > neckR ? neckR / r : 1;
			pos.setXYZ(i, neckP.x + dx * k, cutY, neckP.z + dz * k);
		}
		g.setIndex(keep);
		g.applyMatrix4(toBodyLocal);
		g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
		g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
		const mat = o.material;
		mat.roughnessMap = null;
		mat.metalnessMap = null;
		mat.roughness = 0.82;
		mat.metalness = 0;
		// Match skin tone: tint the bust so its neck band averages the body's.
		const bustSkin = meanTexColor(g, mat, bustIds);
		if (bodySkin && bustSkin) {
			// Half-strength and clamped: the tint also hits hair (same texture).
			const t = (a, b) => 1 + (THREE.MathUtils.clamp(a / Math.max(b, 1e-3), 0.7, 1.4) - 1) * 0.6;
			mat.color.setRGB(t(bodySkin.r, bustSkin.r), t(bodySkin.g, bustSkin.g), t(bodySkin.b, bustSkin.b));
		}
		const sm = new THREE.SkinnedMesh(g, mat);
		sm.castShadow = true;
		sm.frustumCulled = false;
		mesh.parent.add(sm);
		sm.position.copy(mesh.position);
		sm.quaternion.copy(mesh.quaternion);
		sm.scale.copy(mesh.scale);
		sm.updateMatrixWorld(true);
		sm.bind(mesh.skeleton, mesh.bindMatrix);
		parts.push(sm);
	});
	fig.head = parts;
	return parts;
}

/** Component of `v` perpendicular to unit `d` (falls back if parallel). */
function orthogonal(v, d, fallback) {
	const out = v.clone().addScaledVector(d, -v.dot(d));
	if (out.lengthSq() < 1e-6) return orthogonal(fallback, d, new THREE.Vector3(1, 0, 0));
	return out.normalize();
}

/** Orient `name` so its bone axis points along world `dir`, its front along `face`. */
function orient(fig, name, dir, face) {
	const { bones, rest } = fig;
	const b = bones[name];
	const r = rest[name];
	const d = dir.clone().normalize();
	const f = face
		? orthogonal(face, d, r.F0)
		: orthogonal(r.F0.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(r.D0, d)), d, r.F0);

	const mRest = new THREE.Matrix4().makeBasis(r.localD, r.localF, r.localD.clone().cross(r.localF));
	const mTgt = new THREE.Matrix4().makeBasis(d, f, d.clone().cross(f));
	const qWorld = new THREE.Quaternion().setFromRotationMatrix(mTgt.multiply(mRest.transpose()));
	const qParent = b.parent.getWorldQuaternion(new THREE.Quaternion());
	b.quaternion.copy(qParent.invert().multiply(qWorld));
	b.updateMatrixWorld(true);
}

/** Two-bone IK: returns world dirs for upper/lower so the chain end lands on target. */
function solveIK(fig, upper, lower, target, pole) {
	const { bones, rest } = fig;
	const A = bones[upper].getWorldPosition(new THREE.Vector3());
	const l1 = rest[upper].length;
	const l2 = rest[lower].length;
	const toT = target.clone().sub(A);
	const d = Math.min(toT.length(), (l1 + l2) * 0.999);
	const u = toT.normalize();
	const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
	const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
	const p = orthogonal(pole, u, new THREE.Vector3(0, 0, 1));
	const B = A.clone().addScaledVector(u, along).addScaledVector(p, h);
	const C = A.clone().addScaledVector(u, d);
	return { upperDir: B.clone().sub(A), lowerDir: C.sub(B), bend: p };
}

/** Normalise shorthand (`Bone: [x,y,z]`) into `{dir, face}` vectors. */
export function normalizeSpec(spec) {
	const bones = {};
	for (const [k, val] of Object.entries(spec.bones ?? {})) {
		bones[k] = Array.isArray(val) ? { dir: val } : val;
	}
	return { hips: spec.hips ?? {}, bones, ik: spec.ik ?? {} };
}

export function applyPose(fig, rawSpec) {
	const spec = normalizeSpec(rawSpec);
	poseBody(fig, spec);
	return finishPose(fig, spec);
}

/**
 * Blend two poses by slerping each bone's rotation RELATIVE TO ITS PARENT
 * (i.e. joint angles), not its world direction. Lerping world directions makes
 * a bone that flips from up to down (the head in a forward fold) pass through
 * "pointing backwards" mid-transition. Contacts still use lerped IK targets.
 */
export function applyBlend(fig, rawA, rawB, t) {
	if (t <= 0) return applyPose(fig, rawA);
	if (t >= 1) return applyPose(fig, rawB);
	const a = normalizeSpec(rawA);
	const b = normalizeSpec(rawB);
	const { bones, order } = fig;
	poseBody(fig, a);
	const qa = order.map((n) => bones[n].quaternion.clone());
	const pa = bones.Hips.position.clone();
	poseBody(fig, b);
	order.forEach((n, i) => bones[n].quaternion.slerpQuaternions(qa[i], bones[n].quaternion.clone(), t));
	bones.Hips.position.lerpVectors(pa, bones.Hips.position.clone(), t);
	fig.figure.updateMatrixWorld(true);

	const spec = lerpSpec(a, b, t);
	parkIK(fig, spec);
	return finishPose(fig, spec);
}

const orientSpec = (fig, name, b) => {
	const dir = b.dir instanceof THREE.Vector3 ? b.dir : v3(b.dir);
	const face = b.face && (b.face instanceof THREE.Vector3 ? b.face : v3(b.face));
	orient(fig, name, dir, face);
};

const ikChainsOf = (spec) => Object.entries(IK_CHAINS).filter(([end]) => spec.ik[end]);

/** IK limbs are parked straight up so they can't affect grounding. */
function parkIK(fig, spec) {
	for (const name of ikChainsOf(spec).flatMap(([, chain]) => chain)) orient(fig, name, new THREE.Vector3(0, 1, 0));
}

/** Pass 1: reset to rest, place the pelvis, orient every specified bone. */
function poseBody(fig, spec) {
	const { bones, order, rest, figure } = fig;
	figure.position.set(0, 0, 0);
	for (const name of order) {
		bones[name].quaternion.copy(rest[name].quat);
		bones[name].position.copy(rest[name].pos);
	}
	figure.updateMatrixWorld(true);

	const hips = bones.Hips;
	if (spec.hips.pos) {
		hips.position.copy(hips.parent.worldToLocal(v3(spec.hips.pos)));
		hips.updateMatrixWorld(true);
	}
	if (spec.hips.dir) orient(fig, 'Hips', v3(spec.hips.dir), spec.hips.face && v3(spec.hips.face));

	const parked = new Set(ikChainsOf(spec).flatMap(([, chain]) => chain));
	for (const name of order) {
		if (name === 'Hips') continue;
		if (parked.has(name)) orient(fig, name, new THREE.Vector3(0, 1, 0));
		else if (spec.bones[name]) orientSpec(fig, name, spec.bones[name]);
	}
}

/** Pass 2: rest the body on the floor, then solve IK in true floor coordinates. */
function finishPose(fig, spec) {
	ground(fig, 'rest');
	for (const [end, [upper, lower]] of ikChainsOf(spec)) {
		const ik = spec.ik[end];
		// `under: true` (quadruped): x/z are offsets from where the shoulder sits
		// with a level torso, from the model's REST proportions (hips + torso
		// length). Adapts to each body yet stays fixed across phases, so hands
		// stay planted while the spine moves. y stays a floor height.
		const target = v3(ik.target);
		if (ik.under) {
			const r = fig.rest[upper].worldPos;
			const h = fig.rest.Hips.worldPos;
			const hips = fig.bones.Hips.getWorldPosition(new THREE.Vector3());
			target.x += r.x;
			target.z += hips.z + (r.y - h.y);
		}
		const s = solveIK(fig, upper, lower, target, v3(ik.pole));
		// Knees face where they bend; elbows bend away from the arm's front.
		const face = upper.endsWith('Arm') ? s.bend.clone().negate() : s.bend;
		orient(fig, upper, s.upperDir, face);
		orient(fig, lower, s.lowerDir, face);
		if (spec.bones[end]) orientSpec(fig, end, spec.bones[end]);
	}
	// Lift only if a limb now pokes through the floor.
	return ground(fig, 'lift');
}

/** Rest the lowest skinned vertex on y = 0 ('rest'), or only fix penetration ('lift'). */
function ground(fig, mode) {
	const { figure, mesh } = fig;
	figure.updateMatrixWorld(true);
	mesh.computeBoundingBox();
	const box = mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
	for (const h of fig.head ?? []) {
		h.computeBoundingBox();
		box.union(h.boundingBox.clone().applyMatrix4(h.matrixWorld));
	}
	const dy = mode === 'rest' || box.min.y < 0 ? -box.min.y : 0;
	figure.position.y += dy;
	figure.updateMatrixWorld(true);
	return box.translate(new THREE.Vector3(0, dy, 0));
}

// ---------------------------------------------------------------- interpolation

const lerpArr = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const lerpOpt = (a, b, t) => (a && b ? lerpArr(a, b, t) : (a ?? b));

export function lerpSpec(rawA, rawB, t) {
	const a = normalizeSpec(rawA);
	const b = normalizeSpec(rawB);
	const out = { hips: {}, bones: {}, ik: {} };
	for (const k of ['pos', 'dir', 'face']) {
		const val = lerpOpt(a.hips[k], b.hips[k], t);
		if (val) out.hips[k] = val;
	}
	for (const k of new Set([...Object.keys(a.bones), ...Object.keys(b.bones)])) {
		const A = a.bones[k];
		const B = b.bones[k];
		if (!A || !B) {
			out.bones[k] = A ?? B;
			continue;
		}
		out.bones[k] = { dir: lerpArr(A.dir, B.dir, t) };
		const face = lerpOpt(A.face, B.face, t);
		if (face) out.bones[k].face = face;
	}
	for (const k of new Set([...Object.keys(a.ik), ...Object.keys(b.ik)])) {
		const A = a.ik[k];
		const B = b.ik[k];
		out.ik[k] = A && B ? { ...A, target: lerpArr(A.target, B.target, t), pole: lerpArr(A.pole, B.pole, t) } : (A ?? B);
	}
	return out;
}

/** Swap Left/Right and reflect across the sagittal plane (for bilateral moves). */
export function mirrorSpec(raw) {
	const spec = normalizeSpec(raw);
	const flip = (a) => a && [-a[0], a[1], a[2]];
	const swap = (k) => k.replace(/^Left|^Right/, (m) => (m === 'Left' ? 'Right' : 'Left'));
	const out = { hips: {}, bones: {}, ik: {} };
	for (const [k, val] of Object.entries(spec.hips)) out.hips[k] = flip(val);
	for (const [k, val] of Object.entries(spec.bones)) {
		out.bones[swap(k)] = { dir: flip(val.dir), ...(val.face && { face: flip(val.face) }) };
	}
	for (const [k, val] of Object.entries(spec.ik)) {
		out.ik[swap(k)] = { ...val, target: flip(val.target), pole: flip(val.pole) };
	}
	return out;
}

const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * A timeline is a list of `{ pose, in, hold }` steps; `in` is the transition
 * time into that pose. It loops back to the first step, whose `in` is the
 * loop-back transition.
 */
export function timelineDuration(timeline) {
	return timeline.reduce((s, step) => s + (step.in ?? 0) + (step.hold ?? 0), 0);
}

/** Returns `{ from, to, t }`: apply with applyBlend (t = 0 is a held pose). */
export function sampleTimeline(timeline, poses, time) {
	const steps = [...timeline.slice(1), timeline[0]];
	const hold = (pose) => ({ from: poses[pose], to: poses[pose], t: 0 });
	let t = time % timelineDuration(timeline);
	let prev = timeline[0];
	if (t < (prev.hold ?? 0)) return hold(prev.pose);
	t -= prev.hold ?? 0;
	for (let i = 0; i < steps.length; ) {
		// Group pass-through steps (no hold) into one smooth cosine-eased span.
		let j = i;
		let span = 0;
		while (j < steps.length) {
			span += steps[j].in ?? 0;
			if (j === steps.length - 1 || (steps[j].hold ?? 0) > 0) break;
			j++;
		}
		if (t < span) {
			let u = ease(t / span) * span;
			for (let k = i; k <= j; k++) {
				const dur = steps[k].in ?? 0;
				if (u <= dur || k === j) return { from: poses[prev.pose], to: poses[steps[k].pose], t: dur ? u / dur : 0 };
				u -= dur;
				prev = steps[k];
			}
		}
		t -= span;
		prev = steps[j];
		if (prev === timeline[0]) break;
		if (t < (prev.hold ?? 0)) return hold(prev.pose);
		t -= prev.hold ?? 0;
		i = j + 1;
	}
	return hold(timeline[0].pose);
}
