# 3D stretch figures: spike findings (runs 1–2, 2026-10-15)

Goal: replace the SVG movement icons with renders of one 3D character made in
Thrixel, in three output tiers: static icons, looping videos and live three.js.

**Verdict: the pipeline works end to end.** 3 movements done (Forward Fold,
Cat-Cow, Pigeon on both sides). The model is functional but not pretty yet, and
the pose quality varies. Next round: a better-looking model (v3) and pose polish.

## Layout (`spikes/3d-figures/`, not committed, separate package.json)

| Path | What |
|---|---|
| `models/v1.glb`, `models/v2.glb` | Rigged characters (Mixamo bone names). v2 is the default. |
| `src/rig.js` | Pose solver: world-direction posing, 2-bone IK, grounding, mirroring, timeline interpolation |
| `src/poses.js` | Pose data and timelines per movement (**the file that matters**) |
| `src/stage.js` | Renderer, warm 3-light setup, shadow-catcher floor, auto camera framing |
| `src/main.js` + `index.html` | Interactive viewer (orbit, play, mirror, theme), plus `window.api` for headless use |
| `render.mjs` | Headless Chromium (Playwright) renders icons, videos and debug views. **No server needed**: files are served through request interception |
| `probe.mjs` | Debug tool: `node probe.mjs <movement> <pose>` prints joint world positions; add `skel` for a skeleton overlay or `angles '[[az,el],…]'` for camera tests |
| `sheet.sh` | Contact sheet of the icons |
| `out/gallery.html` | Review page (videos in both themes, icons, v1 vs v2) |
| `out/<model>/{icons,video,views}` | Outputs. `views/` = front/side/back/top grid per pose |

Commands: `node render.mjs [all\|stills\|video\|views] [movementId]`,
`MODEL=v1 node render.mjs …`. Interactive viewer: the user runs `npx vite` in
the spike dir (agents must not start servers).

## Thrixel

- Project **Strtchy Stretch Figures** `4426eaa5-29d9-45e1-b253-a214b1e18ced`
- v1: concept image `4b7bccd7-…` → sculpt `c7fe1167-13a1-4268-8cb7-746a45d56e9b` → rig `4ed22b2d-6931-4f8d-936e-6ed21fa2b20f`
- v2: concept image `9638c86b-ff5d-47c4-9043-b955c90b3c2a` → sculpt `9c50fcff-37cb-4bae-9888-109a8af68d64` → rig `5980728f-e682-4df4-a780-65bebab277c1`
- Recipe that works: `generate_image` (n=3, pick the best) → `sculpt_model(reference_image_id, target_size_m=1.75)` → `rig_model(skeleton='mixamo')`. About 20 cubes per character. The whole run cost **38 cubes** (4,216 → 4,178), so cubes are not a constraint.
- Sculpt output is a single ~15–16k-triangle mesh with a 2048px texture (≈7 MB GLB). Before shipping, run `reduce_triangles(texture_size=1024)`, which is free and should land around 2 MB.
- The auto-rig produces 52 bones: Hips, Spine/Spine1/Spine2, Neck, Head, Shoulder/Arm/ForeArm/Hand, 15 finger bones per hand (`bone_10…`), UpLeg/Leg/Foot/ToeBase. There are no toe or head-end bones.

## Run 2 update (same day)

- **v3 woman built** (`models/v3w.glb`, default for the gallery). The concept was "stylized friendly athletic woman, premium fitness-app / animated-film look": high bun, cream raglan crop tee with coral sleeves and blue stripes, high-waisted blue 7/8 leggings with a coral side stripe, barefoot. Image `1facb7b2-89fd-494b-92bb-8629e9867bdf` → sculpt `106c205b-26ee-44a4-a4f4-24d3d5b0fa1f` → rig `160de5ca-685a-40e1-9c07-94f14742e785`. **The back came out clean** (stripe wraps, bun reads). A friendly stylized face plus hair fixes the "blob head" problem.
- **v3 man** (`models/v3m.glb`): concept `dd25f66d-5673-4246-b9b8-0dbd0c805614` (ringer tee, bike shorts, wristbands) → sculpt `6ebad25d-00e0-48c8-9f72-cf6a9989a584` → rig `ca791a9e-f861-4b81-90b9-eae489cae28b`. Good front and face, but **the back is weaker than the woman's**: the chest stripe stops at the sides, and the shirt back and shorts have blotchy, stain-like texture patches (the invented-back problem again). If he's chosen, retexture or regenerate with care.
- **Retexturing v2 from a flat turnaround sheet failed** (`913ce3fd…`, rigged `2121e3ba…`, discarded): the palette drifted (blue headband and stripe, saturated red top, darker overall). A turnaround is still a good idea, but generating a new character with a better concept was the real fix.
- **Cat-Cow fixed:** each phase is a per-segment pitch (`pitch(deg)` helper) spread evenly over Hips→Head, with shoulder blades protracting in cat and retracting in cow. Shoulder height stays within ~1 cm across phases.
- **Forward Fold pose made gentler:** pelvis hinge ~90°, soft knees, hands at the shins, relaxed neck with the crown toward the floor and an explicit head `face`. With a real face, a crown tucked toward the shins makes the face **look back through the legs, upside-down (creepy)**. Never tuck the head in a fold.
- **IK `under: true` (quadruped hands):** the x/z target is relative to where the shoulder sits with a level torso, computed from the model's *rest* proportions (hips + torso length). Contacts adapt to each body, but the anchor is fixed across phases so hands stay planted. (Anchoring to the *current* shoulder made the hands slide between cat and cow.) Poses with absolute coordinates were the remaining model-dependent part; other floor contacts (pigeon hands) should move to this kind of relative anchor too.
- Gallery: `out/gallery.html` now has a model switcher (v3w / v2) and a v1→v2→v3 comparison.

## Run 3: the cast (in progress)

User feedback on v3: the woman is "much better although kinda video-gamey"; the man is rejected ("gym-rat, not really athletic, dumb face, too cartoon-y"). Goal: a cast of ~8 (at least 4) covering different ethnicities, heights, ages (adults only) and genders, piloting two first.

New tooling:
- `./cast.sh <id>...` renders icons, videos, the sheet and a 5-angle turnaround (`out/<id>/turn.png`).
- `MODEL=<id> node portrait.mjs` writes rest-pose face close-ups (`out/<id>/face.png`).
- **Review the full model, not just the back:** turnaround, face close-up, every pose and the videos.
- `thrixel_download(textures='webp')` cuts GLBs from 6–7 MB to **1.2–4.4 MB** (150k triangles + 4K texture = 4.4 MB). three.js loads them without changes.

Pilot findings:
- **Realistic concepts at 40k triangles melt the face** (`c1` Marcus, `c2` Mei): smeared mouth, black eye holes. The body and clothes are fine.
- **150k triangles + 4096 texture fixes most of it** (`c1h`). The face reads as a real adult face; the eyes are still a bit dark. It is a different sculpt of the same image, so some of the gain may be luck, but the difference is large. **Cast recipe: `decimation_target=150000, texture_size=4096`.** Rigging accepts up to 200k.
- **A "stylized sculpture" concept** (`c1s`, smooth simplified forms, flat colours) gave a legible but blocky face and stain-like patches on the shirt. Rejected; realism plus density wins.
- **Clothes must contrast with skin.** Mei's cream leggings read as bare skin from behind (she looked naked in the back view). Use navy, sage, coral or charcoal on the legs, and keep cream for tops with trims or stripes.
- Prompt for the face explicitly: "calm friendly expression with clearly open eyes looking ahead, evenly lit face, soft studio lighting". Photoreal concepts shade the eye sockets, and that shadow gets baked into the texture as black holes.
- Sculpts aren't deterministic. Sculpting the same image twice is a cheap way (8 cubes) to get a better roll.
- **User on the 150k pilots: "soo creepy overall", plus weird body shapes (shoulders, torso vs legs).** Diagnosis using `body.mjs` (`out/<id>/body.png`: bind pose next to posed standing):
  - **The boxy shoulders were partly my posing.** Rotating T-pose arms straight down bunches the deltoid skin into "shoulder pads". Fix in `ARMS_DOWN`: drop the clavicles (`Shoulder` dir y −0.18) and hold the arms about 11° out from the body. This helps every model.
  - `STAND` no longer forces Neck/Head vertical. Realistic models have a forward head carriage, and forcing it tipped the chin up.
  - **The short legs and boxy torso were in the concept itself:** a T-pose image with an untucked tee down to the hips and low shorts. **A-pose concepts are much better.** Prompt "relaxed A-pose with arms angled 40 degrees away from the body … long legs, natural waist … t-shirt tucked into high-waisted shorts". The 2:3 aspect ratio ("figure fills the frame") also gives the face more pixels.
  - **Closed eyes:** "serene peaceful face with eyes softly closed" fits the zen brand, and it avoids the black-hole / glassy-stare eyes that make the faces creepy. Faces still lack detail up close, but at icon and video size they read as calm.
- **Roll variance is large.** Two concepts from the same prompt gave one good model (`c1a`) and one with a melted face and a stained shirt (`c1b`). Budget **2 rolls per character** and keep the best.
- IDs: Marcus A-pose image `5b6effb7-f2d1-4e02-b135-f18331213fd7` → sculpt `27ef68c0-d88d-4498-997f-c6fc64e3bb16` → rig `eb9b788e-8528-4e40-b98a-62c79cf14dc7` (`models/c1a.glb`).
- IDs (superseded): Marcus T-pose image `f3451eef-7f68-4abf-9c62-bdcbcfd8c6aa` → hi-res sculpt `f8b59b41-c299-4a6c-ac9c-4e535f53bae5` → rig `0c6627e8-f909-4764-b9ba-ff4d355fa6b4` (`models/c1h.glb`).


**Full cast, first pass (8 people, `models/<name>.glb`)**

| id | who | height | concept image | rig |
|---|---|---|---|---|
| `c1a` | Marcus, 40s, Black, lean | 1.82 | `5b6effb7-f2d1-4e02-b135-f18331213fd7` | `eb9b788e-8528-4e40-b98a-62c79cf14dc7` |
| `mei-a` | Mei, late 20s, East Asian, slim | 1.64 | `db4ebd78-b093-489b-abdf-254c4e6d380d` | `ecaeef68-410b-4e4b-b3f8-29f0e0a9b238` |
| `priya` | Priya, 50s, South Asian, fuller | 1.60 | `5ee020ba-1e89-4536-a16a-08844188544f` | `f18ca5d9-4a94-4f82-bb9d-b946ba3d9b59` |
| `diego` | Diego, 30s, Latino, tall swimmer | 1.88 | `c476a859-7be5-4419-b751-a1be07d4e317` | `abae9045-a31a-4e84-94a7-d7be3fe125d2` |
| `amara` | Amara, 30s, Black, tall dancer | 1.80 | `d4966f92-bb48-4719-84f0-3beedf27d3b3` | `ef3bc3ac-8935-43f4-a46d-c42d3e97f463` |
| `karim` | Karim, 60s, Middle Eastern, sturdy | 1.72 | `09033a88-c85e-4a30-a750-82a1b98f542f` | `26edcd31-8021-4b8f-a958-eac54dfa5621` |
| `ruth` | Ruth, 70s, white, petite | 1.58 | `42b2c147-90f2-4bd0-ad01-ee8eb7eef050` | `c3c123ec-f8bb-4766-96c2-9f11d1fa46a4` |
| `sione` | Sione, late 20s, Pacific Islander, broad | 1.85 | `714d23c8-00f2-4fb8-885d-844d896b31e7` | `0ec02306-7a1e-4028-bacb-55a1a6629c84` |

Each costs ≈ 7 (concept share) + 8 (sculpt) + 5 (rig) cubes. `node lineup.mjs <ids…>` renders the cast at true relative heights (`out/lineup.png`).

What the first pass showed:
- **Bodies are solved.** Every cast member has a believable, distinct adult body (older, fuller, petite, tall, broad), clean backs, and contrasting clothes. Poses transfer to all 8 with no per-model tuning.
- **Faces are not solved, and this is a pipeline limit.** In a full-body concept the face covers only a few dozen pixels, so the sculpt invents it: black or white eye holes, smeared mouths. Things that did *not* fix it: 150k triangles, 4K textures, 2:3 concepts, closed eyes, and an "animated-film simplified face" prompt (`mei-s`). Faces read fine at icon size and in videos, but are creepy in close-ups. Options for the future: (a) frame renders so the face stays small or turned away (most stretches already do this); (b) a separate head-only sculpt from a face close-up concept, attached to the Head bone (heads are rigid, so this works with skinning); (c) a stylized/abstract face treatment in the shader (flatten the face to skin tone, like Nike/Headspace illustrations).
- **Palette drift in sculpt textures:** sage → grey (Karim), lavender → grey (Ruth), navy → black (`mei-s`). Saturated muted colours wash toward grey; strong ones (coral, navy, blue) survive.
- **Some sculpts come out facing −Z** (Amara). `loadFigure` now detects this from the toe direction and turns the model around.
- **Matte material:** `loadFigure` drops the baked roughness/metalness maps and uses roughness 0.82. Skin looked wet and plastic before, and this also softens faceting on faces.
- **Account concurrency is shared with the user's other projects**, so the 10-job cap can fill up from elsewhere. Submit in small waves.

**Faces solved: head swap (option b).** Each cast member is now a full-body sculpt plus a separately sculpted head.
- **Head concept:** "3D character bust of <person>, head and neck only, <hair>, serene peaceful face with eyes softly closed, three-quarter view, soft even studio lighting, stylized realism, smooth matte skin, plain warm light grey background".
- **Head sculpt:** `target_size_m=0.32, decimation_target=60000, texture_size=2048`. About 15 cubes per head (7 for the image + 8 for the sculpt). The bust is only rendered, never rigged.
- **Loading:** `attachHead(fig, url, opts)` in `src/rig.js`. The viewer loads `models/<id>.head.glb` automatically if it exists. `?nohead` shows the original head for comparison.
- **What `attachHead` does:**
  - It drops body triangles skinned mostly to Head.
  - It scales the bust by head width and aligns the crown.
  - It turns the bust into a SkinnedMesh on the same skeleton: Head weight above the head joint, blending to Neck at the base. The neck bends naturally in folds.
- **Seam:** a flat ring about 3.5 cm above the neck base, just above the collar.
  - Bust triangles below it are dropped.
  - Straddling vertices are clamped onto the ring at the neck radius.
  - Body neck skin above it is removed. The corners of straddling body triangles are tucked inside the bust's neck.
  - Getting here took several attempts. Dropping whole triangles left a jagged fringe. Cutting at the neck base covered the collar. A cone-shaped cut chopped off the chin. An unclamped cut left spikes and a gap.
- **Skin-tone match:** sample the texture under the old face's cheek/forehead band and the bust's equivalent band, using the 45–85th luminance percentile after discarding the atlas' black gutters. Then tint the bust by 60% of the ratio, clamped. Sampling the neck failed: it picked up hair and the shadow under the chin.
- **Per-character options** (`HEAD_OPTS` in `src/main.js`):
  - `collar`: raise the seam when the bust concept has clothing at the neck (Priya's shawl, Karim's shirt collar).
  - `scale`: head size (Sione 0.9).
  - Tried re-rolling the Karim and Priya busts with "bare neck, no clothing" (images `c93fc632…`, `7bd2653d…`; sculpts `9d76dcba…`, `c76ff5e7…`). **Both were worse, so I reverted.**
    - Karim's concept image had a thin frame/vignette border, and the sculpt turned it into flat background panels around the head.
    - Priya's sculpt came out at 56k triangles with shredded, see-through hair.
    - Lessons: reject bust concepts with a visible frame or border, and check hair density in the thumbnail.
    - The `collar` option stays the workaround.
- **Result:** natural, calm, recognisably distinct adult faces on all 8; the close-up creepiness is gone. Known leftovers: a faint seam ring, a Karim collar remnant, Sione's neck tone step, Ruth's hair slightly warmed by the tint.
- **Second body rolls aren't needed now that faces come from busts:** Priya and Diego roll 2 weren't better, and the body was already fine on roll 1.
- Head IDs (concept → sculpt):

| cast member | concept | sculpt |
|---|---|---|
| Marcus | `0a886373-1213-4a16-9d67-80f8fbe3f84f` | `d3c169df-a01e-4c36-bc36-dbab0b8958fb` |
| Mei | `dec01901-721b-4dc7-94fc-f94e001a8758` | `4a330500-f11e-4c5f-bda3-8a018114ef86` |
| Priya | `d79b8a78-7806-4a7c-8311-24eeb19beec0` | `0be4772d-282a-462c-b861-9f7eff282448` |
| Diego | `084cc05a-4d22-418d-80ab-b2d61a7eab3f` | `c4fef402-9352-4c57-91ef-2d49b7b157da` |
| Amara | `54d99dfc-0c63-449b-8117-a38b65a7e087` | `5cb9aab9-063a-490e-bc1c-465cc5cb99a8` |
| Karim | `0b9c4539-488e-427c-8f1b-f14171da5b6e` | `d004fafe-fef9-4773-8d77-ae602e2fc538` |
| Ruth | `f1535170-31ac-4aca-8cd1-736590066dc7` | `4b7cedf9-00e8-4906-bcf2-778bbb6e2d18` |
| Sione | `13b889ae-7393-4a0f-8ca1-3794a2d35d29` | `1f4b9453-643c-4b02-98b5-8592af544a33` |

**Cast next steps:**
1. Optionally re-roll the Karim and Priya busts again (bare neck, no frame in the concept); the current `collar` workaround is acceptable.
2. Retexture or re-roll Karim's and Ruth's shirts back to sage and lavender.
3. Optionally soften the seam ring with a vertex-colour blend.
4. Shrink the cast's files for the app: about 3 MB body + 3 MB head per character as webp.

## Run 4: equipment, environments, more cast, all movements (2026-10-16)

The Thrixel credits expired on 2026-10-16. The user asked for the leftover cubes to go to useful things: equipment first ("how are we gonna create some of the movements without it"), then the whole app ("be creative"). About 200 of ~3,250 cubes were used, which is plenty. Cubes were not the constraint.

**More cast (body diversity):**

| id | who | body concept → sculpt → rig | head concept → sculpt |
|---|---|---|---|
| `kenji` | Kenji, early 80s, East Asian, slight, 1.68 | `f6635cd8-c071-4d37-a483-4e9778449df3` → `c4159f6b-4c14-466b-91e8-8372545a4434` → `fb71ae4e-c80e-49ec-aadc-af75331a4330` | `4bdea8dd-c92c-4ff7-9896-37e003272b77` → `87a0d277-058c-4253-9467-848d80170b62` |
| `lucia` | Lucía, 40s, Latina, plus-size, 1.62 | `276d083d-c907-4e9e-9658-d9d57907361c` → `7d52d5bc-800c-435d-a367-5ddc04d55d0f` → `65429603-1c7a-4263-b6a0-2bef72ec04be` | `7e853515-2fac-40fd-b1fc-77620978f0f9` → `dfa2f6be-251d-459d-95b2-a3f84f9eb172` |

- The same A-pose recipe worked first time for an 80-year-old and a plus-size body. Bust concepts that show **bare skin down to the shoulders** (Kenji #2) swap in with no collar remnant at all, so prefer them over busts wearing clothes.
- **Long hair breaks the head swap.** Lucía's first body (curly high ponytail, rig `4486636c…`, now `models/_old/lucia-ponytail.glb`) failed:
  - The bust's big ponytail threw off the cranium-width fit, so the head came out too big and low and the collar cut the face at the mouth.
  - The ponytail sculpted as faceted shards.
  - The body's own ponytail is skinned to Neck/Spine, so it survives the Head cut and hangs from nowhere. It is part of the one continuous surface: cutting it (the `dropHair` option in `attachHead`, dark texels behind the neck) leaves holes and streaks.
  - **Fix: re-roll the body with the hair in a low bun** that matches the bust. Rule for the cast: **body and bust both use short or tied-up hair, nothing hanging below the head.**
- **Karim and Priya heads re-rolled** from no-frame concepts (`15b366b5-3a7a-4357-8dc8-a437ded453b6`, `3ae05507-b8e6-4d91-80c3-f117c589bb28`). Both are better than the originals: Karim's beard no longer ends in a dark slit, and Priya's face is softer. `HEAD_OPTS` is now Karim `collar 0.045` (0.07 opened black holes under the chin) and Priya `collar 0.055`. The old heads are in `models/_old/`.

**Equipment** (`out/equipment.png`; sizes and loader in `src/props.js`):
- Seed equipment: massage ball, block, elastic band, bar, foam roller, wall, dumbbells. Most floor moves also need a mat, which none of them list. Equipment that isn't in the seed data but that user movements will want: chair, bench, aerobic step, bolster.
- **Sculpted** (prompt-only sculpts, ~15 cubes each): ball `bcb797d1`, block `e2bbdebe`, dumbbell `49270f51`, pull-up station `beec90a2`, chair `fc198eef`, bench `50157422`, step `35e8621c`, bolster `38ef5f3a`.
- **Generated in code:** wall, mat (sage), band anchor (ring on a plate), foam roller (the sculpt came out tilted and too fat, and a roller is just a cylinder), and the **elastic band**, a TubeGeometry on a CatmullRom curve rebuilt every frame through hands, feet and anchors.
- Sculpts arrive about 1 unit long in arbitrary orientation, so `PROP_SIZES` scales each to its real size (longest side or height), and `lie` lays long props down.
- **Movements declare props in their pose data** (`src/scene-props.js`):
  - `{ kind, pos, rotY }` places a prop at a fixed spot.
  - `at: { bone, offset, along }` with `axes` makes a prop follow a bone after every pose (a dumbbell in the hand, a block under the foot).
  - Bands go `through` a list of bones, points and anchors.
  - Bilateral mirroring flips props as well.
  - Walls, mats, anchors and the pull-up bar are left out of the camera framing box.

**Environments** (`env/*.png`, `envshots.mjs` → `out/env/*.jpg`):
- Seven 3:2 backdrop plates from `generate_image` (~4 cubes each): yoga studio, home living room, retro gym, city park, alpine meadow, countryside deck, beach.
- **Compositing beats building 3D sets.** `api.envShot()` renders the posed figure, on a shadow catcher, over the plate with a low eye-level camera. The figure is turned by `azimuth`, not the camera, so the plate's perspective holds. Placement is set by `feetY`, `x` and `heightFrac`. The plates' painted borders are cropped by `zoom`.
- The result reads as one image because the plates and the renderer share the warm, soft light.
- Gotchas:
  - Ask for "no text or lettering" (the first yoga plates had posters with words).
  - Some generations come with a painted frame (the beach plate, one wilderness plate), which is why `zoom` exists.
  - Use 3:2 aspect: 16:9 errored.

**App art** (`out/app-art/`): app icon concepts, two flat pictograms and two soft-3D clay figures, all in the brand palette.

## Run 4: all 37 seed movements posed (5 parallel agents)

Pose data is now split by body position. `src/poses.js` only aggregates the groups: `src/poses/core.js` holds the original 3 movements and the shared blocks, and `standing.js`, `wall.js`, `supine.js`, `prone.js` and `seated.js` hold the rest. Each movement has a `seed` field (its name in `src/lib/seed/data.json`) and optional `props`. One agent per group authored the poses, checked them on mei-a and karim, and graded each movement good, acceptable or weak. Their notes are summarised below.

| Group | Movements | Result |
|---|---|---|
| wall | Kneeling Wall Stretch, Trap Release, Wall Pec Stretch, Scapular Wall Slides, Y-Raises, Ankle Inversion | 3 good, 3 acceptable (the ankle motion is subtle; the pec stretch has to be viewed from behind) |
| supine | Single-Leg Glute Bridge, Dead Bug, Hollow Hold, Supine Hamstring Stretch, Lying Spinal Twist, Knees to Chest, Thoracic Roller Extensions | 5 good, 2 acceptable (the twist reads only from a high view; knees-to-chest creases the glutes) |
| prone | Cobra, Quad Release, Front Plank, Side Plank, Downward Dog, Wrist Rocks, Thread the Needle | 3 good, 4 acceptable |
| seated | Seated Straddle, 90/90 Hip Switch, Butterfly, Side Child's Pose, Lunge with Rotation | 4 good, 1 acceptable-to-good (the 90/90 stops briefly at each key) |
| standing | Plantar Fascia Release, Calf Stretch, Arch Raises, Single-Leg Balance, Monster Walks, Deep Squat, Passive Hang, Band Pull-Aparts, Face Pulls | 5 good, 4 acceptable (the ball is small at icon size; arch raises barely move, which is true of the exercise; monster walks step in place; the hang is static, its toes graze the floor and the bar follows the hands) |

**Fixed during the run:**
- **Removed-head vertices held bodies off the floor.** `attachHead` drops the triangles but the vertices stayed in the buffer, and skinned bounds count every vertex. Mei's hidden bun was the floor contact in lying poses (3–6 cm float). Fix: unused vertices are parked inside the neck.
- **Props following some axes sank into the floor.** With `at` plus limited `axes`, the non-following coordinates defaulted to 0. They now default to the prop's own position.
- **Walls turned away from the key light rendered muddy pink.** Walls now get a little emissive.
- **Shadow acne on the bare floor.** Fixed with `normalBias 0.02`.

**Solver to-do, merged from the agents' reports, ordered by payoff:**
1. **Hand contacts change between bodies.** Karim's thicker palms lift his whole body 2–4 cm, and curled fingertips are often the lowest point (1–2 cm lifts). Options: flatten the finger bones when a palm is down; leave fingers out of grounding; per-model palm-thickness offsets.
2. **Body-relative IK targets for more than hands-under-shoulders.** For example `relTo: bone` plus an offset for feet relative to the hips, hands beside or behind the hips, and wall contacts. Absolute targets are the main model-dependent part (pec stretch elbow height, plank/dog end contacts).
3. **IK limbs are parked straight up during grounding,** so seated poses with foot IK rest on the wrong vertices. The seated agent posed the legs directly instead (`legFK`). Options: ground with the IK solved, or add an explicit seat/contact option.
4. **One-sided IK snaps in blends.** `lerpSpec` keeps a target that exists in only one pose for the whole blend. Fix: blend from the other pose's solved wrist/ankle.
5. **Pass-through keys:** the timeline needs keys without an ease-stop (multi-key paths such as the 90/90).
6. **Lift tolerance and reporting:** silent whole-body lifts took the most debugging time.
7. **Props:**
   - an `orient` option so a dumbbell follows the hand's rotation;
   - `through` points with bone-plus-offset, so a band can wrap a forefoot or lie on a forearm;
   - prop origin at the centre or the base.
8. **Per-model head pitch.** Karim reads slightly chin-up wherever a pose sets a head `face`.
9. **A hanging ground mode** (the hands fix the height instead of the lowest vertex) for the passive hang. A thinner bar sculpt and a finger-curl block would fix grips.
10. **probe.mjs output names should be unique per call.** Parallel agents overwrote each other's `out/angles.png` and `out/skel.png`.

## Approach: poses are data, not baked animations

- Each bone gets a **world-space direction** (`dir`, joint → next joint) plus an optional `face` (where the segment's front points: kneecap, top of foot, front of torso). Directions are absolute, so tilting the pelvis never drags the legs along.
- Convention: +Y up, +Z = the way the figure faces, **+X = the figure's LEFT**.
- `ik: { LeftHand: { target, pole } }` places the wrist or ankle at a floor coordinate.
- Timeline: `[{ pose, hold, in }]`. It loops, the first step's `in` is the loop-back transition, and interpolation uses a cosine ease. `sampleTimeline` returns `{from, to, t}`, which is applied with `applyBlend` (joint-space slerp, see gotcha 0).
- `mirrorSpec` swaps Left/Right and flips X, so the other side of a bilateral move is free.
- **This approach is model-independent:** the v1 poses ran on v2 unchanged (only small contact retunes were needed). Swapping in a v3 model should be cheap.

## Solver gotchas (already fixed, keep in mind)

0. **The "exorcist head" bug (the user's description, and accurate).** The worst
   problem in the forward fold video was the head's MOVEMENT during the
   transition, not the held pose. Timelines used to lerp each bone's
   world-space `dir`. The head goes from `[0,1,0.02]` (stand) to
   `[0,-1,-0.15]` (fold), so the lerped vector passes near zero at t≈0.5 and
   points straight **backwards** (`[0,0,-1]`): the neck snaps back, then the
   head flips down. **Fix:** `applyBlend` solves both key poses and slerps each
   bone's rotation *relative to its parent* (joint angles), so the head rides
   along with the spine. The pelvis position is lerped, and only the IK contacts
   (hands, feet) use lerped `ik` targets. The fold now rolls down and up smoothly
   (frames checked). Rule: **never interpolate world-space bone directions**
   between key poses. Any bone that swings more than ~90° will misbehave.

1. GLTFLoader strips the `:` from bone names (`mixamorig:Hips` becomes `mixamorigHips`).
2. A bone's axis is normally its longest child, but Hips must point at Spine (otherwise it picks a leg) and Spine2 at Neck (`AXIS_CHILD`).
3. **Grounding order matters.** Pass 1 poses the body with the IK limbs parked straight up, then rests the lowest skinned vertex on y=0. Pass 2 solves IK in true floor coordinates. Finally, the body is lifted only if a limb went through the floor. Grounding after IK had made hands float.
4. A **`face` depends on the rest pose.** In v2's T-pose rest, the hand's front is the thumb side, so palms flat on the floor means `face` = thumb inward (`[-1,0,0]` for the left hand). Using `face: up` put the hands on their edge, which pushed through the floor and lifted the whole body.
5. Mesh thickness below the joints is large (knee about 6–10 cm, palm a few cm, v1 sneakers about 10 cm). Contact targets need to allow for it. Use `probe.mjs` to check the numbers instead of guessing.
6. Use `PCFShadowMap`, not `PCFSoftShadowMap` (removed in three r186).
7. The skeleton-overlay render (`probe … skel`) clears up confusion fast: twice the opaque render "looked wrong" while the bones were correct.

## Model findings

**v1** (A-pose, cream sweater, leggings, sneakers) was rejected because:
- the sneakers held the body off the floor;
- the cream sleeves vanished on the cream background;
- the baked wrinkle texture smeared when bent;
- the blank egg head gave no facing cue.

**v2** (T-pose, barefoot, coral tank top, blue bike shorts, cream headband, sand-coloured skin) fixed readability and contact. But the **user finds it ugly**:
- a bald, muscular "mannequin guy";
- the tank top reads as a long singlet or dress, and the shorts are boxy;
- the skin tone plus bald head looks odd;
- the headband on a bald head looks strange.

- **The headband looks weird on the back of the head** (user). Cause: a sculpt is
  built from ONE three-quarter image, so Thrixel invents the back of the model.
  The back of the headband came out as a smeared, oddly shaped patch. The same
  risk applies to anything that wraps around (hair ties, waistbands, stripes).

**v3 brief (next):**
- **Hair:** sculpted as part of the mesh, something short or tied back (a bun or short ponytail close to the head). Avoid anything loose or long, because it only follows the head bone.
- **Shape:** a softer, friendlier stylized body (think a premium fitness-app illustration, not a bodybuilder), slightly larger head/hands/feet for readability at icon size, and maybe simple facial hints (nose/brow plane) so the head never reads as a blob.
- **Clothes, 80s athletic:** a cropped or fitted short-sleeve tee or raglan with coral/blue stripes; high-waist fitted 7/8 leggings or bike shorts; optional sweatbands or leg warmers; stay barefoot (or thin socks). Everything fitted (loose cloth skins badly) and in flat colours (no baked wrinkles).
- Wrap-around details (headband, hair, waistband) need checking from behind
  before rigging: render the back view (`probe … angles '[[180,10]]'`). Prefer
  details that read from the front and sides, or use `create_model` with several
  reference views, or fix the texture with `retexture_model`.
- Keep what worked: T-pose, clearly separated limbs and fingers, high contrast against both `#f5f1ea` and `#151515`.
- Generate 3–4 concept images first and let the user pick before sculpting. Expect to retune `face` vectors if the rest pose changes, and to recheck contacts with `probe.mjs`.

## Pose findings

| Movement | State | Problems / fixes for next round |
|---|---|---|
| Forward Fold | Structure OK. Head movement **fixed** (see gotcha 0). | The user's main complaint was the exorcist-style head snap mid-transition, now fixed. The held pose could still be gentler: the neck over-stretches and the head dangles below the chest like a detached egg, tilted back toward the shins (`Neck [0,-1,0.05]`, `Head [0,-1,-0.15]`). Fix: head continues the spine curve, crown toward the floor, chin slightly tucked toward the shins; shorter neck drop. Also make it less extreme: hands at the shins/ankles instead of past the toes, a slight knee bend, and keep the thighs vertical. |
| Cat-Cow | Works; the user calls it **"a bit exaggerated"**. | Cat: the rounding is concentrated at Spine2/Neck (a hunch plus a 90° chin tuck) and the shoulders look pinched. Spread the curve evenly over Hips→Spine2 with smaller angles and keep the head roughly in line. Cow: the sag concentrates in the lumbar spine and the head is cranked up (`Neck 0.75`, `Head [0,1,0.6]`); halve it and gaze forward-down. Shoulder blades (the `*Shoulder` bones) should rise or protract a bit in cat and retract in cow; right now they're static and the mesh pinches. v2's long arms leave the elbows slightly soft, which is acceptable. |
| Pigeon (L + mirrored R) | Best of the three. | The upright version sits on fingertips (the arm can't reach the floor from an upright torso, which matches real life). Some shadow-acne streaks appear near the floor shadow; try adjusting `shadow.bias` / `normalBias`. |

General pose lessons:
- Check every pose from 4 angles (`render.mjs views`). A single angle hides errors.
- **Camera angle is part of the design.** Pigeon side-on reads as the splits; a raised three-quarter view (az 45°, el 30°) shows the crossed shin. Side views (az ~82°) work for the fold and cat-cow.
- Keep ranges of motion moderate. These are teaching illustrations for regular people, not a show of maximum flexibility.
- Each pose took roughly 3–5 iterations. Budget about 15–30 minutes per movement, plus a human form review (it's a safety concern).

## Output numbers

- Icons: transparent 1024px PNGs, 225–360 KB each. They could become WebP or smaller sizes for lists.
- Videos: 720px H.264 mp4, 30 fps, 6.7–8 s loops, **108–128 KB each**, rendered once per theme (dark `#151515`, light `#f5f1ea`) by compositing the transparent frames in ffmpeg.
- Full render of 3 movements (icons plus both video themes) takes about **17 s**.
- Not done yet: alpha video (VP9 alpha works in Chrome/Firefox; Safari needs HEVC alpha, so per-theme mp4 is simpler), and WebGL performance on low-end phones.

## App integration (done in run 4, uncommitted)

- `node export-app.mjs [movements|covers|all] [id…]` renders into the app:
  - `static/assets/movements/3d/<slug>.webp`: a 512 px transparent icon, ~15 KB.
  - `static/assets/movements/3d/<slug>-{dark,light}.mp4`: a 540 px loop, 40–90 KB.
  - `static/assets/routines/<slug>.jpg`: built-in routine covers, plus `plate-*.jpg` backdrops for custom routines.
  - `static/assets/hero/{login,register}.jpg`.
  - `src/lib/art/manifest.json`.
  - Each movement is drawn by a different cast member (`CAST` rotation; `CAST_FOR` overrides).
- `src/lib/art/index.ts` maps by **name** at render time: `movementArt`, `movementImage`, `routineCover`. Existing databases (and the remote instance) get the art with no migration. Custom movements (`isCustom`) keep their uploaded image. The seed also writes the icon into `illustrationPath` for fresh databases.
- `src/components/ui/MovementArt.svelte` shows the theme-matched loop. The loop's background is baked to the theme base colour, so it sits on `bg-base`. It falls back to the still image, the SVG, an upload or a placeholder, and honours reduced motion.
- **Where the art appears:**
  - MovementCard: a 64 px still.
  - Movement page: a large loop, with a left/right toggle for bilateral moves.
  - MovementDetailModal: the loop.
  - Practice MovementBlock: a still in the header and the loop while the movement is active, **mirrored automatically on the right side**.
  - Routine covers: RoutineCard and the home-page routine cards.
  - Heroes on sign-in and sign-up.
  - Empty states on home and history (a cast member in Butterfly Stretch).
- The PWA precache only globs png/svg/etc., so webp/mp4/jpg are not precached and the service worker stays small.
- `npm run check` reports 0 errors and `npm run build` passes. **Not seen in a browser yet:** agents can't start the dev server.
- App icon: **Flat B** vectorized and wired in everywhere (`src/lib/assets/favicon.svg`, `src/lib/assets/logo.svg`, `static/favicon.svg`, `static/icon-192.png`, `static/icon-512.png`, `static/maskable-512.png`, `static/apple-touch-icon.png`, `vite.config.ts`, `src/routes/+layout.svelte`, and `src/components/ui/PageHeader.svelte`).


- `movements.illustration_path` already exists, and uploads live in `static/uploads/movements`. Rendered icons can be stored there for built-in movements. User-created movements keep user-uploaded images (decided).
- Planned tiers: PNG icon in lists, mp4 loop for previews and the practice player, lazy-loaded three.js for movement detail (never more than one WebGL canvas at a time).
- Pose data could later live in the DB or seed data per movement (the `seed/data.json` names map to pose ids).

## Next steps

1. v3 concepts (3–4 options) → user picks → sculpt + rig → re-render with the existing poses.
2. Pose polish: fold head/neck and depth; tone down cat-cow and distribute the curvature.
3. Reduce texture to 1024px and check GLB size and mobile performance in the viewer.
4. Then batch the remaining 34 seed movements, a few at a time, with a form review.
