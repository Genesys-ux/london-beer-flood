import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { SpotLight, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ShotSpec } from '../data/storyData';

interface Environment3DProps {
  shot: ShotSpec;
  isUltraLight?: boolean;
}

// Module-level singleton cache so environment textures & geometries are created ONCE
let cachedAssets: {
  normalMap: THREE.CanvasTexture;
  crateTexture: THREE.CanvasTexture;
  calendarTexture: THREE.CanvasTexture;
  signTexture: THREE.CanvasTexture;
  bannedTexture: THREE.CanvasTexture;
  facetedWallGeo: THREE.PlaneGeometry;
} | null = null;

function createProceduralNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 4) {
      const nx = 128 + Math.round(Math.sin(y * 0.25) * 18);
      ctx.fillStyle = `rgb(${nx}, 128, 245)`;
      ctx.fillRect(0, y, 128, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createLabelTexture(
  title: string,
  subtitle: string,
  bgColor: string,
  textColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, 246, 118);
    ctx.fillStyle = textColor;
    ctx.font = '900 27px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 128, 58);
    ctx.font = '700 19px sans-serif';
    ctx.fillText(subtitle, 128, 92);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getEnvironmentAssets() {
  if (cachedAssets) return cachedAssets;

  const geo = new THREE.PlaneGeometry(16, 10, 16, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const cellX = Math.floor((vx + 8) * 1.3);
    const cellY = Math.floor((vy + 5) * 1.3);
    const facetNoise =
      Math.sin(cellX * 12.9898 + cellY * 78.233) * 0.22 +
      Math.cos(vx * 1.7 - vy * 2.1) * 0.08;
    pos.setZ(i, facetNoise);
  }
  geo.computeVertexNormals();

  cachedAssets = {
    normalMap: createProceduralNormalMap(),
    crateTexture: createLabelTexture(
      'MEUX & CO.',
      'PORTER 1814',
      '#A67C52',
      '#1A1A1A'
    ),
    calendarTexture: createLabelTexture(
      '17 OKT 1814',
      'LONDON',
      '#F5EFE0',
      '#8B1E1E'
    ),
    signTexture: createLabelTexture(
      'HORSE SHOE BREWERY',
      'TOTTENHAM COURT RD',
      '#2B1B12',
      '#FFD700'
    ),
    bannedTexture: createLabelTexture(
      'DILARANG!',
      'ACT OF GOD 1814',
      '#9E1B1B',
      '#FFFFFF'
    ),
    facetedWallGeo: geo,
  };
  return cachedAssets;
}

const PEBBLES = Array.from({ length: 14 }, (_, i) => {
  const px = ((i * 37) % 100) * 0.08 - 4.0;
  const pz = ((i * 53) % 100) * 0.05 - 1.0;
  const scale = 0.055 + ((i * 19) % 10) * 0.01;
  return { px, pz, scale, rot: i * 0.7 };
});

const DUST_MOTES = Array.from({ length: 12 }, (_, i) => ({
  x: ((i * 29) % 100) * 0.06 - 3.0,
  y: 1.0 + ((i * 43) % 100) * 0.035,
  z: ((i * 61) % 100) * 0.04 - 1.5,
  speed: 0.02 + (i % 5) * 0.008,
}));

export const Environment3D: React.FC<Environment3DProps> = ({
  shot,
  isUltraLight = false,
}) => {
  const frame = useCurrentFrame();
  const shotFrame = frame - shot.startFrame;

  const {
    normalMap,
    crateTexture,
    calendarTexture,
    signTexture,
    bannedTexture,
    facetedWallGeo,
  } = useMemo(() => getEnvironmentAssets(), []);

  const isInterior = shot.environment === 'interior_brewery';
  const isExploding =
    shot.storyPhase === 'explosion' || shot.storyPhase === 'wall_breach';
  const isSnap = shot.storyPhase === 'hoop_snap' || isExploding;
  const isFlood =
    shot.storyPhase === 'hook_wave' ||
    shot.storyPhase === 'wall_breach' ||
    shot.storyPhase === 'street_flood';

  const vatBulge =
    shot.storyPhase === 'giant_vat' || shot.storyPhase === 'inspection'
      ? 1 + Math.sin(frame * 0.25) * 0.025
      : 1;
  const snapFlyX = isSnap ? Math.min(4.5, shotFrame * 0.14) : 0;
  const snapFlyRot = isSnap ? shotFrame * 0.08 : 0;

  const waveZ = isFlood ? -0.8 + ((shotFrame * 0.015) % 1.4) : -4.5;

  return (
    <group>
      {/* ==================== SECTION 4: LIGHTING PIPELINE (OPTIMIZED) ==================== */}
      {isInterior ? (
        <>
          <color attach="background" args={['#1A110B']} />
          <fog attach="fog" args={['#1A110B', 6, 18]} />
          <ambientLight intensity={0.38} color="#FFD8A8" />

          {/* Warm Point Lights (#FF9E44, intensity 1.5, distance 15, decay 2) */}
          <pointLight
            position={[-2.6, 3.6, 0.5]}
            color="#FF9E44"
            intensity={1.5}
            distance={15}
            decay={2}
          />
          <pointLight
            position={[2.6, 3.6, 0.5]}
            color="#FF9E44"
            intensity={1.5}
            distance={15}
            decay={2}
          />
          <pointLight
            position={[0, 2.5, 2.6]}
            color="#FF9E44"
            intensity={1.2}
            distance={15}
            decay={2}
          />

          {/* Volumetric Overhead Spotlight (Full Quality) or Lightweight Directional (Ultra-Light) */}
          {isUltraLight ? (
            <directionalLight
              position={[0, 5.6, 1.2]}
              intensity={1.6}
              color="#FFAA44"
            />
          ) : (
            <SpotLight
              position={[0, 5.6, 1.2]}
              angle={0.52}
              penumbra={0.55}
              intensity={3.2}
              distance={14}
              color="#FFAA44"
              attenuation={5}
              anglePower={4}
              castShadow
              shadow-mapSize={[512, 512]}
            />
          )}
        </>
      ) : (
        <>
          <color attach="background" args={['#87CEEB']} />
          <fog attach="fog" args={['#9CC5DC', 8, 24]} />

          <hemisphereLight
            color="#87CEEB"
            groundColor="#5C4033"
            intensity={0.6}
          />

          <directionalLight
            position={[5, 8, 6]}
            color="#FFF8E7"
            intensity={2.5}
            castShadow={!isUltraLight}
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={22}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={6}
            shadow-camera-bottom={-6}
          />
        </>
      )}

      {/* ==================== FLOOR & GROUNDING ==================== */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow={!isUltraLight}
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color={isInterior ? '#8C6239' : '#6E553E'}
          roughness={0.85}
          metalness={0.05}
          normalMap={isUltraLight ? null : normalMap}
        />
      </mesh>

      {/* ContactShadows only in Full Render mode */}
      {!isUltraLight && (
        <ContactShadows
          position={[0, 0.01, 1.2]}
          opacity={0.5}
          scale={10}
          blur={1.5}
          far={3.5}
          resolution={256}
          frames={1}
        />
      )}

      {/* ==================== DISPLACED VORONOI / FACETED BACK WALL ==================== */}
      <mesh
        geometry={facetedWallGeo}
        position={[0, 4.2, -3.6]}
        receiveShadow
      >
        <meshStandardMaterial
          color={isInterior ? '#8C6239' : '#A67C52'}
          roughness={0.85}
          metalness={0.05}
          normalMap={normalMap}
          flatShading
        />
      </mesh>

      {!isInterior && (
        <mesh position={[0, 4.3, -3.25]}>
          <boxGeometry args={[4.4, 1.1, 0.18]} />
          <meshStandardMaterial
            map={signTexture}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>
      )}

      {/* ==================== WOODEN SUPPORT BEAMS & HANGING LANTERNS ==================== */}
      {[-3.4, 3.4].map((bx, idx) => (
        <group key={`beam-${idx}`}>
          <mesh position={[bx, 2.8, -1.8]}>
            <boxGeometry args={[0.42, 5.8, 0.42]} />
            <meshStandardMaterial
              color="#8C6239"
              roughness={0.85}
              metalness={0.05}
              normalMap={normalMap}
            />
          </mesh>
          <mesh position={[0, 5.2, -1.8 + idx * 1.6]}>
            <boxGeometry args={[8.5, 0.36, 0.38]} />
            <meshStandardMaterial
              color="#A67C52"
              roughness={0.85}
              metalness={0.05}
              normalMap={normalMap}
            />
          </mesh>
          <group
            position={[bx * 0.75, 3.7, 0.4]}
            rotation={[0, 0, Math.sin(frame * 0.06 + idx) * 0.06]}
          >
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
              <meshStandardMaterial
                color="#FFD700"
                roughness={0.2}
                metalness={0.9}
                emissive="#FFD700"
                emissiveIntensity={0.3}
              />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.16, 0.12, 0.34, 8]} />
              <meshStandardMaterial
                color="#FF9E44"
                emissive="#FF9E44"
                emissiveIntensity={1.2}
                roughness={0.2}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* ==================== COLOSSAL 22-FOOT OAK FERMENTATION VAT ==================== */}
      <group position={[0, 2.2, -2.0]} scale={[vatBulge, 1, vatBulge]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.65, 1.55, 4.4, 16]} />
          <meshStandardMaterial
            color="#8C6239"
            roughness={0.85}
            metalness={0.05}
            normalMap={normalMap}
          />
        </mesh>

        {[-3.1, 3.1].map((vx, i) => {
          const dominoTilt =
            shot.storyPhase === 'explosion'
              ? (i === 0 ? -1 : 1) * Math.min(0.45, shotFrame * 0.008)
              : 0;
          return (
            <group
              key={`side-vat-${i}`}
              position={[vx, -0.3, -0.5]}
              rotation={[0, 0, dominoTilt]}
            >
              <mesh>
                <cylinderGeometry args={[1.05, 1.0, 3.6, 12]} />
                <meshStandardMaterial
                  color="#A67C52"
                  roughness={0.85}
                  metalness={0.05}
                  normalMap={normalMap}
                />
              </mesh>
              {[-1.1, 0, 1.1].map((hy, hi) => (
                <mesh
                  key={`shoop-${hi}`}
                  position={[0, hy, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <torusGeometry args={[1.05, 0.055, 8, 16]} />
                  <meshStandardMaterial
                    color="#FFD700"
                    roughness={0.2}
                    metalness={0.9}
                    emissive="#FFD700"
                    emissiveIntensity={0.3}
                  />
                </mesh>
              ))}
            </group>
          );
        })}

        {[-1.55, -0.55, 0.45, 1.45].map((hy, idx) => {
          const isSnappingHoop = idx === 1;
          const offsetX = isSnappingHoop ? snapFlyX : 0;
          const rotZ = isSnappingHoop ? snapFlyRot : 0;
          return (
            <mesh
              key={`hoop-${idx}`}
              position={[offsetX, hy, 0]}
              rotation={[Math.PI / 2, 0, rotZ]}
            >
              <torusGeometry args={[1.64, 0.08, 8, 24]} />
              <meshStandardMaterial
                color="#FFD700"
                roughness={0.2}
                metalness={0.9}
                emissive="#FFD700"
                emissiveIntensity={0.3}
              />
            </mesh>
          );
        })}

        <group position={[0, -0.2, 1.66]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.1, 14]} />
            <meshStandardMaterial
              color="#FFD700"
              roughness={0.2}
              metalness={0.9}
              emissive="#FFD700"
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh
            position={[0, 0, 0.07]}
            rotation={[0, 0, -0.4 - Math.sin(frame * 0.4) * 0.35]}
          >
            <boxGeometry args={[0.04, 0.22, 0.02]} />
            <meshStandardMaterial
              color="#FF2222"
              emissive="#FF2222"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>

        {shot.storyPhase === 'court_verdict' && (
          <mesh position={[0, 0.1, 1.75]} rotation={[0, 0, -0.12]}>
            <boxGeometry args={[2.3, 0.95, 0.1]} />
            <meshStandardMaterial map={bannedTexture} roughness={0.6} />
          </mesh>
        )}
      </group>

      {/* ==================== MICRO-DETAILS: LABELED CRATES, WALL CALENDAR, PEBBLES ==================== */}
      <mesh position={[-2.15, 0.45, 0.4]} rotation={[0, 0.28, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          map={crateTexture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[2.25, 0.45, 0.5]} rotation={[0, -0.32, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          map={crateTexture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      <mesh position={[-1.95, 2.35, -1.55]}>
        <boxGeometry args={[0.95, 0.65, 0.06]} />
        <meshStandardMaterial map={calendarTexture} roughness={0.75} />
      </mesh>

      {PEBBLES.map((p, idx) => (
        <mesh
          key={`pebble-${idx}`}
          position={[p.px, p.scale * 0.5, p.pz]}
          rotation={[p.rot, p.rot * 1.3, 0]}
        >
          <dodecahedronGeometry args={[p.scale, 0]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#8C6239' : '#A67C52'}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>
      ))}

      {isInterior &&
        DUST_MOTES.map((m, idx) => (
          <mesh
            key={`mote-${idx}`}
            position={[
              m.x + Math.sin(frame * m.speed + idx) * 0.2,
              m.y + Math.cos(frame * m.speed + idx) * 0.15,
              m.z,
            ]}
          >
            <sphereGeometry args={[0.025, 5, 5]} />
            <meshBasicMaterial color="#FFE5B4" transparent opacity={0.55} />
          </mesh>
        ))}

      {/* ==================== FOAMING DARK PORTER TSUNAMI WAVE & FLOATING BARRELS ==================== */}
      {(isFlood || isExploding) && (
        <group position={[0, 0, waveZ]}>
          <mesh
            position={[0, 1.05, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.95, 1.4, 9.0, 12]} />
            <meshStandardMaterial
              color="#2A1508"
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
          {[-2.4, -1.2, 0, 1.2, 2.4].map((fx, fi) => (
            <mesh
              key={`foam-${fi}`}
              position={[
                fx,
                1.85 + Math.sin(frame * 0.25 + fi) * 0.15,
                0.55,
              ]}
            >
              <sphereGeometry args={[0.68, 8, 8]} />
              <meshStandardMaterial
                color="#FFF8E7"
                roughness={0.6}
                metalness={0.05}
              />
            </mesh>
          ))}
          {[-1.5, 1.4].map((bx, bi) => (
            <mesh
              key={`fbarrel-${bi}`}
              position={[bx, 1.15, 0.85]}
              rotation={[frame * 0.08, frame * 0.05, 0.5]}
            >
              <cylinderGeometry args={[0.36, 0.36, 0.85, 10]} />
              <meshStandardMaterial
                color="#8C6239"
                roughness={0.85}
                metalness={0.05}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
