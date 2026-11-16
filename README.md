# London Beer Flood (1814) — Hybrid 2.5D Narrative Short-Form Animation

60-second vertical animated short ($1080 \times 1920$, $60\text{ fps}$, $3600\text{ frames}$) built with **Remotion**, **Three.js (`@react-three/fiber`)**, **`@react-three/drei`**, and **`@react-three/postprocessing`**.

## Architecture & Visual Specification
1. **Tech Stack & Format (`src/Root.tsx`, `src/LondonBeerFloodScene.tsx`)**:
   - Vertical $1080 \times 1920$, $60\text{ fps}$, $3600\text{ frames}$ ($60.0\text{s}$).
   - `@react-three/fiber` wrapped inside `<ThreeCanvas>` from `@remotion/three`.
   - Post-processing pipeline (`src/components/PostFX.tsx`) with `DepthOfField`, `Bloom`, and `Vignette`.

2. **2D-in-3D Billboard Character System (`src/components/BillboardCharacter2D.tsx`)**:
   - **Head:** Pure white circle (`#FFFFFF`) with a thick black stroke (`#1A1A1A`, `6px` equivalent).
   - **Body:** Period-dressed trapezoid/rounded-rectangle torso (1814 Regency brewery owner coat & gold waistcoat, Foreman George Crick leather apron & suspenders, 1814 Judge crimson robe & powdered wig, St Giles townsperson vest).
   - **Limbs:** Procedural cubic Bezier curves (`<CubicBezierLine>`) colored solid black (`#1A1A1A`) with dynamic IK control points.
   - **Shadows:** Custom `alphaTest={0.5}` material + `MeshDepthMaterial` so 2D silhouettes cast accurate 3D shadows onto walls and floors.
   - **Parametric Facial Rigging:**
     - `eyeState`: `'normal' | 'blink' | 'wide_shock' | 'squint_skeptical' | 'happy_arc' | 'wink'`
     - `mouthState`: `'neutral' | 'talk_open' | 'talk_wide' | 'chewing' | 'greedy_grin' | 'nervous_teeth'`
     - `browAngle`: Float value ($-30^\circ$ to $+30^\circ$) interpolated via `spring()`.

3. **Environment, Shading & Lighting (`src/components/Environment3D.tsx`)**:
   - Displaced Voronoi/faceted rock & brick walls (`roughness: 0.85`, `metalness: 0.05`, warm earth tones `#8C6239` & `#A67C52`, procedural normal maps).
   - Colossal 6.7-meter oak fermentation vat bound with 700-kg metallic hoops (`roughness: 0.2`, `metalness: 0.9`, `#FFD700` emissive tint `0.3`).
   - Contextual set dressing: labeled wooden crates (`MEUX & CO. PORTER 1814`), hanging lanterns, wall calendar (`17 OKT 1814`), scattered floor pebbles, overhead timber beams, and foaming dark porter tsunami wave.
   - Interior warm point lights (`#FF9E44`, `intensity: 1.5`, `distance: 15`, `decay: 2`) + volumetric `<SpotLight>` with floating dust motes; exterior directional sunlight (`#FFF8E7`, `intensity: 2.5`, `2048x2048` shadows) + sky hemisphere light (`#87CEEB` / `#5C4033`) + `<ContactShadows>` (`opacity={0.5}`, `blur={1.5}`).

4. **Camera Choreography (`src/LondonBeerFloodScene.tsx`, `src/data/storyData.ts`)**:
   - 27 dynamic shots across $3600\text{ frames}$ (every cut $120\text{–}150\text{ frames}$ / $2.0\text{s–}2.5\text{s}$).
   - Push-In / Pull-Back via `Easing.out(Easing.cubic)`.
   - Whip-Pan / Projectile Follow via damped `spring({ damping: 14, stiffness: 120 })`.
   - Exponential sinusoidal Impact Shake: $\Delta x = A \cdot e^{-kt} \cos(\omega t)$.
   - Dynamic `DepthOfField` animating `bokehScale` ($0 \rightarrow 4$) and `focalLength` during macro inspection shots.

5. **Audio & Word-by-Word Captions (`src/components/CaptionsOverlay.tsx`, `scripts/generate_audio.py`)**:
   - Bahasa Indonesia narration (`public/audio/voiceover.wav`) + 138 word-by-word captions (`src/data/captions.json`) in bold sans-serif (`Montserrat ExtraBold` / `Inter Black`), white fill with thick black stroke, drop shadow, and `#FFD700` gold highlights on key narrative words.
   - Frame-accurate `<Audio>` triggers for explosions + cave reverb (`sfx_blast.wav`), barrel/wood collisions (`sfx_thud.wav`), iron hoop strain (`sfx_clink.wav`), camera transitions (`sfx_whoosh.wav`), and tsunami wave roar (`sfx_wave.wav`).
