// Equipment for movements that need it (see `equipment` in src/lib/seed/data.json).
// Rigid props are Thrixel sculpts (models/props/<name>.glb); surfaces and the
// elastic band are generated here, because a band has to stretch between
// moving hands/feet and a wall or mat is just a textured box.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const COLORS = { sage: 0x7aa87a, cream: 0xe8e4dd, coral: 0xe07a5f, blue: 0x5b8db8, track: 0x3d3a36 };

// Real-world size of each sculpt (metres). Sculpts arrive ~1 unit long and in
// whatever orientation the concept showed; `lie` turns the longest axis
// horizontal (along x), e.g. a foam roller sculpted standing on end.
export const PROP_SIZES = {
	ball: { longest: 0.08 },
	block: { longest: 0.23 },
	dumbbell: { longest: 0.26 },
	pullup: { height: 2.25 },
	chair: { height: 0.85 },
	bench: { longest: 1.2 },
	step: { longest: 0.9 },
	bolster: { longest: 0.65, lie: true }
};

/** Sculpted prop at real size, matte, resting on y = 0 and centred on x/z. */
export async function loadProp(name) {
	const gltf = await new GLTFLoader().loadAsync(`./models/props/${name}.glb`);
	const root = new THREE.Group();
	const inner = new THREE.Group();
	inner.add(gltf.scene);
	root.add(inner);
	gltf.scene.traverse((o) => {
		if (!o.isMesh) return;
		o.castShadow = true;
		o.receiveShadow = true;
		o.material.roughnessMap = null;
		o.material.metalnessMap = null;
		o.material.roughness = 0.75;
		o.material.metalness = 0;
	});
	const spec = PROP_SIZES[name] ?? {};
	let size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
	if (spec.lie) {
		if (size.y >= size.x && size.y >= size.z) inner.rotation.z = Math.PI / 2;
		else if (size.z > size.x) inner.rotation.y = Math.PI / 2;
	}
	inner.updateMatrixWorld(true);
	size = new THREE.Box3().setFromObject(inner).getSize(new THREE.Vector3());
	const k = spec.height ? spec.height / size.y : spec.longest ? spec.longest / Math.max(size.x, size.y, size.z) : 1;
	inner.scale.setScalar(k);
	inner.updateMatrixWorld(true);
	const box = new THREE.Box3().setFromObject(inner);
	const c = box.getCenter(new THREE.Vector3());
	inner.position.set(-c.x, -box.min.y, -c.z);
	root.name = name;
	return root;
}

/**
 * Foam roller, 90 x 15 cm, axis along x. Generated: the sculpt came out tilted
 * and over-fat, and a plain cylinder is all a roller is.
 */
export function makeRoller({ color = COLORS.blue } = {}) {
	const g = new THREE.CylinderGeometry(0.075, 0.075, 0.9, 40, 1);
	g.rotateZ(Math.PI / 2);
	const roller = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
	roller.position.y = 0.075;
	roller.castShadow = true;
	roller.receiveShadow = true;
	roller.name = 'roller';
	return roller;
}

/** Yoga mat: 1.83 x 0.61 m, 5 mm, long side along z. */
export function makeMat({ color = COLORS.sage } = {}) {
	const mat = new THREE.Mesh(
		new THREE.BoxGeometry(0.61, 0.005, 1.83),
		new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
	);
	mat.position.y = 0.0025;
	mat.receiveShadow = true;
	mat.name = 'mat';
	return mat;
}

/** Wall panel facing +z, its face at z = 0 (move it with .position.z). */
export function makeWall({ width = 2.4, height = 2.4, color = 0xefe9df } = {}) {
	const wall = new THREE.Mesh(
		new THREE.BoxGeometry(width, height, 0.08),
		// A little self-light: walls turned away from the key light otherwise go
		// a muddy pink-brown under the coral rim light.
		new THREE.MeshStandardMaterial({ color, roughness: 0.95, emissive: 0xefe9df, emissiveIntensity: 0.28 })
	);
	wall.geometry.translate(0, height / 2, -0.04);
	wall.receiveShadow = true;
	wall.castShadow = true;
	wall.name = 'wall';
	return wall;
}

/** Band anchor: a ring on a small wall plate, `height` above the group origin. Ring centre (local) = .userData.point. */
export function makeAnchor({ height = 1.4 } = {}) {
	const g = new THREE.Group();
	const metal = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.5, metalness: 0.6 });
	const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 24), metal);
	plate.rotation.x = Math.PI / 2;
	const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 10, 28), metal);
	plate.position.y = height;
	ring.position.set(0, height, 0.03);
	ring.rotation.x = Math.PI / 2;
	g.add(plate, ring);
	g.userData.point = new THREE.Vector3(0, height, 0.03);
	g.traverse((o) => o.isMesh && (o.castShadow = true));
	g.name = 'anchor';
	return g;
}

/**
 * Elastic band through a list of world points (hands, feet, anchor), updated
 * every frame with band.update(points). Flat-ish tube; `loop` closes it
 * (mini band around the ankles).
 */
export function makeBand({ color = COLORS.coral, width = 0.012, loop = false } = {}) {
	const material = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
	const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
	mesh.castShadow = true;
	mesh.name = 'band';
	mesh.update = (points) => {
		const curve = new THREE.CatmullRomCurve3(points.map((p) => p.clone()), loop, 'centripetal');
		mesh.geometry.dispose();
		mesh.geometry = new THREE.TubeGeometry(curve, Math.max(24, points.length * 16), width, 6, loop);
	};
	return mesh;
}
