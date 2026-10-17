import * as THREE from 'three';

// Palette from design-system.md ("Zen Athletic 80s").
export const THEMES = {
	dark: { bg: '#151515', surface: '#1f1f1f', text: '#faf8f5' },
	light: { bg: '#f5f1ea', surface: '#ffffff', text: '#1a1814' }
};

export function createStage(canvas, { width, height, pixelRatio = 1 } = {}) {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
	renderer.setPixelRatio(pixelRatio);
	renderer.setSize(width, height, false);
	renderer.setClearColor(0x000000, 0);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.AgXToneMapping;
	renderer.toneMappingExposure = 1.15;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(28, width / height, 0.05, 50);

	// Warm key, cool athletic-blue fill, coral rim.
	scene.add(new THREE.HemisphereLight(0xfaf8f5, 0x3d3a36, 1.4));
	const key = new THREE.DirectionalLight(0xfff1e0, 2.6);
	key.position.set(1.8, 3.2, 2.4);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048);
	key.shadow.camera.left = key.shadow.camera.bottom = -1.6;
	key.shadow.camera.right = key.shadow.camera.top = 1.6;
	key.shadow.radius = 6;
	key.shadow.bias = -0.0004;
	key.shadow.normalBias = 0.02; // removes acne specks on the bare floor
	scene.add(key);
	const fill = new THREE.DirectionalLight(0x8ab4d9, 0.7);
	fill.position.set(-2.5, 1.2, 1.0);
	scene.add(fill);
	const rim = new THREE.DirectionalLight(0xe07a5f, 1.3);
	rim.position.set(-0.8, 2.0, -2.8);
	scene.add(rim);

	const floor = new THREE.Mesh(
		new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2),
		new THREE.ShadowMaterial({ opacity: 0.22 })
	);
	floor.receiveShadow = true;
	scene.add(floor);

	function setSize(w, h) {
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}

	/**
	 * Frame `box` from a view given in degrees: azimuth 0 = front (+Z),
	 * 90 = the figure's left side (+X); elevation above the floor.
	 */
	function frame(box, { azimuth = 60, elevation = 10, padding = 1.12 } = {}) {
		const az = THREE.MathUtils.degToRad(azimuth);
		const el = THREE.MathUtils.degToRad(elevation);
		const viewDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
		const center = box.getCenter(new THREE.Vector3());

		camera.position.copy(center).addScaledVector(viewDir, 10);
		camera.lookAt(center);
		camera.updateMatrixWorld();
		const inv = camera.matrixWorldInverse;

		// Re-centre on the projected extents, then back off until every corner fits.
		const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / padding;
		const tanH = tanV * camera.aspect;
		const corners = [];
		for (const x of [box.min.x, box.max.x])
			for (const y of [box.min.y, box.max.y])
				for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z).applyMatrix4(inv));
		const xs = corners.map((c) => c.x);
		const ys = corners.map((c) => c.y);
		const shift = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, 0)
			.applyQuaternion(camera.quaternion);
		center.add(shift);

		let dist = 0;
		for (const c of corners) {
			const cx = c.x - (Math.min(...xs) + Math.max(...xs)) / 2;
			const cy = c.y - (Math.min(...ys) + Math.max(...ys)) / 2;
			const depth = c.z + 10; // camera-space z relative to centre (negative = in front)
			dist = Math.max(dist, Math.abs(cx) / tanH + depth, Math.abs(cy) / tanV + depth);
		}
		camera.position.copy(center).addScaledVector(viewDir, dist);
		camera.lookAt(center);
		camera.updateMatrixWorld();
		return center;
	}

	const render = () => renderer.render(scene, camera);
	return { renderer, scene, camera, setSize, frame, render };
}
