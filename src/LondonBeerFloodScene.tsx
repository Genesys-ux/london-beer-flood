import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  getRemotionEnvironment,
  useVideoConfig,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SHOTS, SFX_TRIGGERS, ShotSpec } from './data/storyData';
import { Environment3D } from './components/Environment3D';
import { BillboardCharacter2D } from './components/BillboardCharacter2D';
import { PostFX } from './components/PostFX';
import { CaptionsOverlay } from './components/CaptionsOverlay';

export type SceneProps = {
  qualityMode?: 'auto' | 'ultra-light' | 'full';
};

interface RiggedCameraProps {
  shot: ShotSpec;
}

const RiggedCamera: React.FC<RiggedCameraProps> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);

  const shotFrame = Math.max(0, frame - shot.startFrame);
  const shotDuration = Math.max(1, shot.endFrame - shot.startFrame);

  const progress =
    shot.cameraMode === 'whip_pan'
      ? spring({
          frame: shotFrame,
          fps,
          config: { damping: 14, stiffness: 120 },
        })
      : interpolate(shotFrame, [0, shotDuration], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const impactOffset = shot.impactAtOffset ?? -999;
  const impactAmp = shot.impactAmp ?? 0.18;
  const tShake = shotFrame - impactOffset;
  const k = 0.14;
  const omega = 1.85;
  const deltaX =
    tShake >= 0 ? impactAmp * Math.exp(-k * tShake) * Math.cos(omega * tShake) : 0;
  const deltaY =
    tShake >= 0
      ? impactAmp * 0.65 * Math.exp(-k * tShake) * Math.sin(omega * 1.2 * tShake)
      : 0;

  const microDriftX = Math.sin(frame * 0.04) * 0.03;
  const microDriftY = Math.cos(frame * 0.035) * 0.02;

  const camX =
    shot.camStart[0] +
    (shot.camEnd[0] - shot.camStart[0]) * progress +
    deltaX +
    microDriftX;
  const camY =
    shot.camStart[1] +
    (shot.camEnd[1] - shot.camStart[1]) * progress +
    deltaY +
    microDriftY;
  const camZ =
    shot.camStart[2] + (shot.camEnd[2] - shot.camStart[2]) * progress;

  const lookX =
    shot.lookStart[0] +
    (shot.lookEnd[0] - shot.lookStart[0]) * progress +
    deltaX * 0.5;
  const lookY =
    shot.lookStart[1] +
    (shot.lookEnd[1] - shot.lookStart[1]) * progress +
    deltaY * 0.5;
  const lookZ =
    shot.lookStart[2] + (shot.lookEnd[2] - shot.lookStart[2]) * progress;

  camera.position.set(camX * 0.85, camY + 0.15, camZ * 1.32 + 1.35);
  camera.fov = shot.fov + 14;
  camera.near = 0.1;
  camera.far = 60;
  camera.lookAt(lookX * 0.75, lookY, lookZ);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  return null;
};

export const LondonBeerFloodScene: React.FC<SceneProps> = ({
  qualityMode = 'auto',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const env = getRemotionEnvironment();

  // Automatically enable Ultra-Light mode inside Remotion Studio Preview,
  // and switch to Full Quality when rendering MP4 (e.g. on GitHub Actions Cloud)
  const isUltraLight =
    qualityMode === 'ultra-light' ||
    (qualityMode === 'auto' && !env.isRendering);

  const activeShot = useMemo(() => {
    return (
      SHOTS.find((s) => frame >= s.startFrame && frame < s.endFrame) ||
      SHOTS[SHOTS.length - 1]
    );
  }, [frame]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#120C08' }}>
      {/* ==================== 3D REMOTION + REACT THREE FIBER CANVAS ==================== */}
      <ThreeCanvas
        shadows={!isUltraLight}
        dpr={isUltraLight ? 0.6 : 1}
        width={width}
        height={height}
        gl={{
          antialias: !isUltraLight,
          powerPreference: isUltraLight ? 'low-power' : 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        <RiggedCamera shot={activeShot} />

        {/* 3D Stylized Environment + Lighting */}
        <Environment3D shot={activeShot} isUltraLight={isUltraLight} />

        {/* 2D-in-3D Billboard Characters */}
        <group>
          {activeShot.characters.map((char) => (
            <BillboardCharacter2D
              key={char.id}
              role={char.role}
              position={[
                char.position[0] * 0.68,
                char.position[1],
                char.position[2],
              ]}
              scale={char.scale}
              flipX={char.flipX}
              eyeState={char.eyeState}
              mouthState={char.mouthState}
              browAngle={char.browAngle}
              action={char.action}
              isUltraLight={isUltraLight}
            />
          ))}
        </group>

        {/* Post-Processing Pipeline (Bypassed in Ultra-Light Preview to save ~80% GPU) */}
        {!isUltraLight && <PostFX shot={activeShot} />}
      </ThreeCanvas>

      {/* ==================== TOP HEADER BADGE ==================== */}
      <div
        style={{
          position: 'absolute',
          top: 72,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(26, 26, 26, 0.85)',
            border: '4px solid #FFD700',
            borderRadius: '999px',
            padding: '12px 34px',
            fontFamily: '"Montserrat ExtraBold", "Inter Black", sans-serif',
            fontWeight: 900,
            fontSize: '28px',
            letterSpacing: '2px',
            color: '#FFD700',
            textTransform: 'uppercase',
            boxShadow: '0 8px 20px rgba(0,0,0,0.65)',
          }}
        >
          LONDON, 17 OKTOBER 1814 • HORSE SHOE BREWERY
        </div>
      </div>

      {/* Ultra-Light Mode Indicator Badge (only visible in Studio Preview) */}
      {!env.isRendering && isUltraLight && (
        <div
          style={{
            position: 'absolute',
            top: 152,
            right: 48,
            backgroundColor: 'rgba(16, 185, 129, 0.9)',
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
            fontWeight: 800,
            fontSize: '20px',
            padding: '6px 18px',
            borderRadius: '999px',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          ⚡ ULTRA-LIGHT PREVIEW (GPU SAVER)
        </div>
      )}

      {/* ==================== WORD-BY-WORD CAPTIONS OVERLAY ==================== */}
      <CaptionsOverlay />

      {/* ==================== AUDIO SYNCHRONIZATION LAYERS ==================== */}
      <Audio src={staticFile('audio/voiceover.wav')} volume={1.0} />
      <Audio src={staticFile('audio/bgm.wav')} volume={0.32} />

      {SFX_TRIGGERS.map((sfx, idx) => (
        <Sequence
          key={`sfx-${idx}-${sfx.frame}`}
          from={sfx.frame}
          durationInFrames={75}
          name={sfx.label}
        >
          <Audio src={staticFile(sfx.src)} volume={sfx.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
