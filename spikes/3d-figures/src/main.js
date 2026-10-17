import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadFigure, attachHead, applyPose, applyBlend, mirrorSpec, sampleTimeline, timelineDuration } from './rig.js';
import { createStage } from './stage.js';
import { MOVEMENTS } from './poses.js';
import { loadProp, makeMat, makeWall, makeAnchor, makeBand, makeRoller } from './props.js';
import { createProps, mirrorProps } from './scene-props.js';

const params = new URLSearchParams(location.search);
const headless = params.has('headless');
const canvas = document.getElementById('stage');

const stage = createStage(canvas, {
	width: canvas.clientWidth || 720,
	height: canvas.clientHeight || 720,
	pixelRatio: headless ? 1 : Math.min(devicePixelRatio, 2)
});
const fig = await loadFigure(`./models/${params.get('model') ?? 'v2'}.glb`);
// Optional high-detail head: models/<id>.head.glb (?nohead to compare).
// Per-character tweaks: collar = seam height above the neck base (m), scale = head size.
const HEAD_OPTS = { karim: { collar: 0.045 }, priya: { collar: 0.055 }, sione: { scale: 0.9 } };
const headUrl = `./models/${params.get('model') ?? 'v2'}.head.glb`;
if (!params.has('nohead') && (await fetch(headUrl, { method: 'HEAD' })).ok) await attachHead(fig, headUrl, HEAD_OPTS[params.get('model')]);
stage.scene.add(fig.figure);

const specFor = (movement, spec, mirrored) => (mirrored ? mirrorSpec(spec) : spec);

// The current movement's equipment (rebuilt when the movement or side changes).
let props = null;
let propsKey = null;
async function useProps(m, mirrored = false) {
	const key = m ? `${m.id}:${mirrored}` : null;
	if (key === propsKey) return;
	props?.dispose();
	props = null;
	propsKey = key;
	if (m?.props?.length) props = await createProps(stage.scene, mirrored ? mirrorProps(m.props) : m.props);
}
/** Moves bone-attached props and bands onto the posed body; returns body + props bounds. */
function withProps(box) {
	if (!props) return box;
	props.update(fig);
	return box.union(props.bounds());
}
const posePose = (m, spec, mirrored) => withProps(applyPose(fig, specFor(m, spec, mirrored)));
const applySample = (m, s, mirrored) => withProps(applyBlend(fig, specFor(m, s.from, mirrored), specFor(m, s.to, mirrored), s.t));

/** Union of the figure's bounds over a whole loop, so the camera never cuts it. */
function loopBounds(movement, mirrored, samples = 40) {
	const box = new THREE.Box3();
	const dur = timelineDuration(movement.timeline);
	for (let i = 0; i < samples; i++) {
		box.union(applySample(movement, sampleTimeline(movement.timeline, movement.poses, (dur * i) / samples), mirrored));
	}
	return box;
}

const viewFor = (movement, mirrored) =>
	mirrored ? { ...movement.view, azimuth: -movement.view.azimuth } : movement.view;

if (headless) {
	let anim = null;
	const helper = new THREE.SkeletonHelper(fig.figure);
	helper.material.depthTest = false;
	helper.material.linewidth = 3;
	helper.visible = false;
	stage.scene.add(helper);
	window.api = {
		movements: MOVEMENTS.map((m) => ({ id: m.id, name: m.name, seed: m.seed, icon: m.icon, bilateral: !!m.bilateral, poses: Object.keys(m.poses) })),

		async still(id, { size = 512, mirrored = false, pose, view, skeleton = false } = {}) {
			const m = MOVEMENTS.find((x) => x.id === id);
			await useProps(m, mirrored);
			stage.setSize(size, size);
			helper.visible = skeleton;
			fig.mesh.material.transparent = skeleton;
			fig.mesh.material.opacity = skeleton ? 0.35 : 1;
			const box = posePose(m, m.poses[pose ?? m.icon], mirrored);
			stage.frame(box, view ?? viewFor(m, mirrored));
			stage.render();
			return canvas.toDataURL('image/png');
		},

		/** Unposed bind pose, front view (mesh review). */
		async rest({ size = 512, view = { azimuth: 0, elevation: 4 } } = {}) {
			await useProps(null);
			stage.setSize(size, size);
			helper.visible = false;
			fig.order.forEach((n) => { fig.bones[n].quaternion.copy(fig.rest[n].quat); fig.bones[n].position.copy(fig.rest[n].pos); });
			fig.figure.updateMatrixWorld(true);
			fig.mesh.computeBoundingBox();
			const box = fig.mesh.boundingBox.clone().applyMatrix4(fig.mesh.matrixWorld);
			stage.frame(box, view);
			stage.render();
			return canvas.toDataURL('image/png');
		},

		/** Standing pose in a fixed 2 m frame, so renders of different models line up at true height. */
		async lineup({ width = 300, height = 640, azimuth = 20 } = {}) {
			await useProps(null);
			stage.setSize(width, height);
			helper.visible = false;
			const m = MOVEMENTS.find((x) => x.id === 'forward-fold');
			applyPose(fig, m.poses.stand);
			stage.frame(new THREE.Box3(new THREE.Vector3(-0.35, 0, -0.3), new THREE.Vector3(0.35, 1.95, 0.3)), { azimuth, elevation: 4, padding: 1.02 });
			stage.render();
			return canvas.toDataURL('image/png');
		},

		/** Every piece of equipment beside the standing figure, for a scale check. */
		async equipment({ width = 1600, height = 700, props = ['ball', 'block', 'dumbbell', 'roller', 'bolster', 'step', 'chair', 'bench', 'pullup'] } = {}) {
			await useProps(null);
			stage.setSize(width, height);
			helper.visible = false;
			const group = new THREE.Group();
			const m = MOVEMENTS.find((x) => x.id === 'forward-fold');
			applyPose(fig, m.poses.stand);
			fig.figure.position.x = -0.9;
			const wall = makeWall({ width: 9, height: 2.4 });
			wall.position.z = -0.9;
			const anchor = makeAnchor({ height: 1.3 });
			anchor.position.set(1.6, 0, -0.9);
			const mat = makeMat();
			mat.rotation.y = Math.PI / 2;
			mat.position.set(0.6, 0.0025, 0.45);
			group.add(wall, anchor, mat);
			let x = -0.25;
			for (const name of props) {
				try {
					const p = name === 'roller' ? makeRoller() : await loadProp(name);
					const size = new THREE.Box3().setFromObject(p).getSize(new THREE.Vector3());
					p.position.set(x + size.x / 2, 0.005, name === 'pullup' ? -0.45 : 0.3);
					if (name === 'roller') p.position.y += 0.075;
					x += size.x + 0.15;
					group.add(p);
				} catch (e) {
					console.warn('missing prop', name);
				}
			}
			// Band: from the anchor ring, sagging, to the figure's right hand.
			const hand = fig.bones.RightHand.getWorldPosition(new THREE.Vector3());
			const a = anchor.userData.point.clone().add(anchor.position);
			const band = makeBand();
			band.update([a, a.clone().lerp(hand, 0.5).add(new THREE.Vector3(0, -0.15, 0.1)), hand]);
			group.add(band);
			stage.scene.add(group);
			stage.frame(new THREE.Box3(new THREE.Vector3(-1.3, 0, -0.9), new THREE.Vector3(Math.max(2.2, x), 2.3, 0.6)), { azimuth: 8, elevation: 10, padding: 1.02 });
			stage.render();
			const url = canvas.toDataURL('image/png');
			stage.scene.remove(group);
			fig.figure.position.x = 0;
			return url;
		},

		/**
		 * Figure composited onto an environment plate (env/<env>.png). The plates
		 * are eye-level wide shots, so a low camera keeps the perspective close;
		 * the shadow catcher still grounds the feet. feetY / x are fractions of
		 * the image, heightFrac the share of image height a standing figure takes.
		 */
		async envShot({ env = 'yoga', id = 'forward-fold', pose = 'stand', mirrored = false, width = 1200, height = 800, feetY = 0.86, x = 0.5, heightFrac = 0.5, azimuth = 30, mat = false, zoom = 1.05 } = {}) {
			stage.setSize(width, height);
			helper.visible = false;
			const m = MOVEMENTS.find((q) => q.id === id);
			await useProps(m, mirrored);
			const group = new THREE.Group();
			if (mat) group.add(makeMat());
			stage.scene.add(group);
			posePose(m, m.poses[pose], mirrored);
			if (props) group.attach(props.group);
			// Scale from the standing height, so floor poses keep true size.
			const Hs = 1.75 / heightFrac;
			const W = Hs * (width / height);
			const cx = -(x - 0.5) * W;
			const box = new THREE.Box3(new THREE.Vector3(cx - W / 2, -(1 - feetY) * Hs, -0.01), new THREE.Vector3(cx + W / 2, feetY * Hs, 0.01));
			stage.frame(box, { azimuth: 0, elevation: 4, padding: 1 });
			// Turn the figure rather than the camera, so the plate perspective holds.
			fig.figure.rotation.y = group.rotation.y = THREE.MathUtils.degToRad(-azimuth);
			stage.render();
			fig.figure.rotation.y = group.rotation.y = 0;
			if (props) stage.scene.attach(props.group);
			stage.scene.remove(group);
			const img = new Image();
			img.src = `./env/${env}.png`;
			await img.decode();
			const out = document.createElement('canvas');
			out.width = width;
			out.height = height;
			const ctx = out.getContext('2d');
			// Cover-fit the plate; zoom crops the painted borders some plates have.
			const s = Math.max(width / img.width, height / img.height) * zoom;
			ctx.drawImage(img, (width - img.width * s) / 2, (height - img.height * s) / 2, img.width * s, img.height * s);
			ctx.drawImage(canvas, 0, 0, width, height);
			return out.toDataURL('image/jpeg', 0.9);
		},

		/** Close-up of the head in the rest pose (face review). */
		async portrait({ size = 512, view = { azimuth: 25, elevation: 5 } } = {}) {
			await useProps(null);
			stage.setSize(size, size);
			helper.visible = false;
			fig.mesh.material.transparent = false;
			fig.mesh.material.opacity = 1;
			applyPose(fig, {});
			const head = fig.bones.Head.getWorldPosition(new THREE.Vector3());
			const box = new THREE.Box3().setFromCenterAndSize(head.add(new THREE.Vector3(0, 0.06, 0)), new THREE.Vector3(0.3, 0.34, 0.3));
			stage.frame(box, { ...view, padding: 1 });
			stage.render();
			return canvas.toDataURL('image/png');
		},

		async prepareAnimation(id, { size = 720, fps = 30, mirrored = false } = {}) {
			const m = MOVEMENTS.find((x) => x.id === id);
			await useProps(m, mirrored);
			stage.setSize(size, size);
			stage.frame(loopBounds(m, mirrored), viewFor(m, mirrored));
			anim = { m, fps, mirrored, frames: Math.round(timelineDuration(m.timeline) * fps) };
			return anim.frames;
		},

		frame(i) {
			applySample(anim.m, sampleTimeline(anim.m.timeline, anim.m.poses, i / anim.fps), anim.mirrored);
			stage.render();
			return canvas.toDataURL('image/png');
		}
	};
	window.apiReady = true;
} else {
	const controls = new OrbitControls(stage.camera, canvas);
	controls.enableDamping = true;
	const state = { movement: MOVEMENTS[0], playing: true, mirrored: false, time: 0 };

	function resize() {
		stage.setSize(canvas.clientWidth, canvas.clientHeight);
	}
	async function select(m) {
		await useProps(m, state.mirrored);
		state.movement = m;
		state.time = 0;
		const center = stage.frame(loopBounds(m, state.mirrored), viewFor(m, state.mirrored));
		controls.target.copy(center);
		document.querySelectorAll('#movements button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === m.id));
		document.getElementById('mirror').disabled = !m.bilateral;
	}

	const list = document.getElementById('movements');
	for (const m of MOVEMENTS) {
		const b = document.createElement('button');
		b.textContent = m.name;
		b.dataset.id = m.id;
		b.onclick = () => select(m);
		list.append(b);
	}
	document.getElementById('play').onclick = (e) => {
		state.playing = !state.playing;
		e.target.setAttribute('aria-pressed', state.playing);
		e.target.textContent = state.playing ? 'Playing' : 'Paused';
	};
	document.getElementById('mirror').onclick = (e) => {
		state.mirrored = !state.mirrored;
		e.target.setAttribute('aria-pressed', state.mirrored);
		select(state.movement);
	};
	document.getElementById('theme').onclick = (e) => {
		const light = document.body.classList.toggle('light');
		e.target.textContent = light ? 'Dark theme' : 'Light theme';
	};

	addEventListener('resize', resize);
	resize();
	select(MOVEMENTS[0]);

	const clock = new THREE.Clock();
	stage.renderer.setAnimationLoop(() => {
		const dt = clock.getDelta();
		if (state.playing) state.time += dt;
		const m = state.movement;
		applySample(m, sampleTimeline(m.timeline, m.poses, state.time), state.mirrored);
		controls.update();
		stage.render();
		document.getElementById('time').textContent =
			`${(state.time % timelineDuration(m.timeline)).toFixed(1)}s / ${timelineDuration(m.timeline).toFixed(1)}s`;
	});
}
