import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { CubicBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import {
  CharacterAction,
  CharacterRole,
  EyeState,
  MouthState,
} from '../data/storyData';

export interface BillboardCharacterProps {
  role: CharacterRole;
  position: [number, number, number];
  scale?: number;
  flipX?: boolean;
  eyeState: EyeState;
  mouthState: MouthState;
  browAngle: number;
  action: CharacterAction;
  isUltraLight?: boolean;
}

// Global cache so each unique character + expression is drawn and uploaded to GPU only ONCE
const TEXTURE_CACHE = new Map<
  string,
  { colorTexture: THREE.CanvasTexture; depthMaterial: THREE.MeshDepthMaterial }
>();

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getOrCreateCharacterTextures(
  role: CharacterRole,
  eyeState: EyeState,
  mouthState: MouthState,
  quantizedBrow: number
) {
  const key = `${role}_${eyeState}_${mouthState}_${quantizedBrow}`;
  const cached = TEXTURE_CACHE.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 256, 384);
    ctx.scale(0.5, 0.5); // Draw in 512x768 coordinate space at 1/4th memory footprint
    const cx = 256;
    const headY = 235;
    const headR = 96;

    // --- 1. PERIOD TORSO ---
    ctx.save();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1A1A1A';

    ctx.beginPath();
    ctx.moveTo(cx - 78, 330);
    ctx.lineTo(cx + 78, 330);
    ctx.quadraticCurveTo(cx + 96, 465, cx + 84, 575);
    ctx.lineTo(cx - 84, 575);
    ctx.quadraticCurveTo(cx - 96, 465, cx - 78, 330);
    ctx.closePath();

    if (role === 'owner_meux') {
      ctx.fillStyle = '#5B1D28';
      ctx.fill();
      ctx.stroke();

      drawRoundedRect(ctx, cx - 42, 338, 84, 225, 14);
      ctx.fillStyle = '#D9A026';
      ctx.fill();
      ctx.stroke();

      drawRoundedRect(ctx, cx - 22, 330, 44, 52, 10);
      ctx.fillStyle = '#F7F4EB';
      ctx.fill();
      ctx.stroke();
    } else if (role === 'foreman_crick') {
      ctx.fillStyle = '#E6DEC8';
      ctx.fill();
      ctx.stroke();

      drawRoundedRect(ctx, cx - 58, 375, 116, 195, 12);
      ctx.fillStyle = '#7A4924';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2B2118';
      ctx.fillRect(cx - 52, 332, 18, 240);
      ctx.fillRect(cx + 34, 332, 18, 240);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(cx - 54, 390, 22, 14);
      ctx.fillRect(cx + 32, 390, 22, 14);
    } else if (role === 'judge') {
      ctx.fillStyle = '#7C1623';
      ctx.fill();
      ctx.stroke();

      drawRoundedRect(ctx, cx - 34, 332, 68, 238, 10);
      ctx.fillStyle = '#F4F1EA';
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#4A5D4E';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(cx - 48, 334, 15, 236);
      ctx.fillRect(cx + 33, 334, 15, 236);
    }
    ctx.restore();

    // --- 2. HEAD: Pure White Circle (#FFFFFF) with Thick Black Stroke (#1A1A1A) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1A1A1A';
    ctx.stroke();
    ctx.restore();

    // --- 3. PERIOD HEADGEAR ---
    ctx.save();
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 8;
    if (role === 'owner_meux') {
      drawRoundedRect(ctx, cx - 68, headY - 195, 136, 115, 10);
      ctx.fillStyle = '#1F1F24';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(cx - 66, headY - 102, 132, 18);
      drawRoundedRect(ctx, cx - 105, headY - 88, 210, 20, 9);
      ctx.fillStyle = '#1F1F24';
      ctx.fill();
      ctx.stroke();
    } else if (role === 'foreman_crick') {
      ctx.beginPath();
      ctx.ellipse(cx, headY - 86, 92, 28, 0, Math.PI, 0, false);
      ctx.closePath();
      ctx.fillStyle = '#6E4726';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + 28, headY - 84, 72, 12, 0.08, 0, Math.PI * 2);
      ctx.fillStyle = '#4A2E16';
      ctx.fill();
      ctx.stroke();
    } else if (role === 'judge') {
      ctx.fillStyle = '#F2EFE9';
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(
            cx + side * (headR - 8),
            headY - 35 + i * 32,
            24,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.ellipse(cx, headY - 86, 86, 26, 0, Math.PI, 0, false);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // --- 4. FACIAL RIGGING: EYES ---
    ctx.save();
    ctx.strokeStyle = '#1A1A1A';
    ctx.fillStyle = '#1A1A1A';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';

    const eyeOffsetX = 34;
    const eyeY = headY - 10;

    const drawSingleEye = (ex: number, isRight: boolean) => {
      if (eyeState === 'blink') {
        ctx.beginPath();
        ctx.moveTo(ex - 16, eyeY);
        ctx.lineTo(ex + 16, eyeY);
        ctx.stroke();
      } else if (eyeState === 'wide_shock') {
        ctx.beginPath();
        ctx.arc(ex, eyeY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, eyeY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#1A1A1A';
        ctx.fill();
      } else if (eyeState === 'squint_skeptical') {
        ctx.beginPath();
        ctx.arc(ex, eyeY + 4, 14, Math.PI, 0, false);
        ctx.closePath();
        ctx.fillStyle = '#1A1A1A';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex - 18, eyeY + 4);
        ctx.lineTo(ex + 18, eyeY + 4);
        ctx.stroke();
      } else if (eyeState === 'happy_arc') {
        ctx.beginPath();
        ctx.arc(ex, eyeY + 6, 15, Math.PI * 1.1, Math.PI * 1.9, false);
        ctx.stroke();
      } else if (eyeState === 'wink') {
        if (isRight) {
          ctx.beginPath();
          ctx.moveTo(ex - 16, eyeY - 5);
          ctx.lineTo(ex + 12, eyeY + 2);
          ctx.lineTo(ex - 16, eyeY + 9);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(ex, eyeY, 11, 0, Math.PI * 2);
          ctx.fillStyle = '#1A1A1A';
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(ex, eyeY, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#1A1A1A';
        ctx.fill();
      }
    };

    drawSingleEye(cx - eyeOffsetX, false);
    drawSingleEye(cx + eyeOffsetX, true);

    // --- 5. EYEBROWS ---
    const browRad = (quantizedBrow * Math.PI) / 180;
    const browY = eyeY - 30;
    ctx.lineWidth = 8;

    ctx.save();
    ctx.translate(cx - eyeOffsetX, browY);
    ctx.rotate(-browRad);
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx + eyeOffsetX, browY);
    ctx.rotate(browRad);
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.restore();

    // --- 6. MOUTH ---
    const mouthY = headY + 42;
    ctx.lineWidth = 6.5;
    if (mouthState === 'talk_open') {
      ctx.beginPath();
      ctx.ellipse(cx, mouthY, 18, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2B090E';
      ctx.fill();
      ctx.stroke();
    } else if (mouthState === 'talk_wide') {
      ctx.beginPath();
      ctx.ellipse(cx, mouthY + 2, 28, 22, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2B090E';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, mouthY + 14, 14, Math.PI, 0, false);
      ctx.fillStyle = '#D95B5B';
      ctx.fill();
    } else if (mouthState === 'chewing') {
      ctx.beginPath();
      ctx.moveTo(cx - 20, mouthY + 3);
      ctx.quadraticCurveTo(cx - 4, mouthY - 9, cx + 18, mouthY + 5);
      ctx.stroke();
    } else if (mouthState === 'greedy_grin') {
      ctx.beginPath();
      ctx.arc(cx, mouthY - 8, 34, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, mouthY - 6);
      ctx.lineTo(cx, mouthY + 24);
      ctx.moveTo(cx - 16, mouthY - 6);
      ctx.lineTo(cx - 14, mouthY + 20);
      ctx.moveTo(cx + 16, mouthY - 6);
      ctx.lineTo(cx + 14, mouthY + 20);
      ctx.stroke();
    } else if (mouthState === 'nervous_teeth') {
      drawRoundedRect(ctx, cx - 28, mouthY - 12, 56, 26, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 26, mouthY + 1);
      ctx.lineTo(cx + 26, mouthY + 1);
      ctx.moveTo(cx - 10, mouthY - 12);
      ctx.lineTo(cx - 10, mouthY + 14);
      ctx.moveTo(cx + 10, mouthY - 12);
      ctx.lineTo(cx + 10, mouthY + 14);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 18, mouthY);
      ctx.quadraticCurveTo(cx, mouthY + 6, cx + 18, mouthY);
      ctx.stroke();
    }
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const dMat = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: tex,
    alphaTest: 0.5,
  });

  const entry = { colorTexture: tex, depthMaterial: dMat };
  TEXTURE_CACHE.set(key, entry);
  return entry;
}

export const BillboardCharacter2D: React.FC<BillboardCharacterProps> = ({
  role,
  position,
  scale = 1,
  flipX = false,
  eyeState,
  mouthState,
  browAngle,
  action,
  isUltraLight = false,
}) => {
  const frame = useCurrentFrame();

  // Quantize animation step (12 frames in Ultra-Light, 6 frames in Full Render)
  const stepSize = isUltraLight ? 12 : 6;
  const stepFrame = Math.floor(frame / stepSize) * stepSize;

  // Periodic blink every ~90 frames
  const isAutoBlink =
    eyeState === 'normal' && frame % 90 >= 84 && frame % 90 <= 89;
  const activeEyeState: EyeState = isAutoBlink ? 'blink' : eyeState;

  // Syllable mouth cycle when talking
  const activeMouthState: MouthState = useMemo(() => {
    if (mouthState === 'talk_open' || mouthState === 'talk_wide') {
      const cycle = Math.floor(frame / 8) % 3;
      if (cycle === 0) return 'talk_open';
      if (cycle === 1) return 'talk_wide';
      return 'neutral';
    }
    return mouthState;
  }, [mouthState, frame]);

  const quantizedBrow = Math.round(Math.max(-30, Math.min(30, browAngle)) / 5) * 5;

  const { colorTexture, depthMaterial } = useMemo(
    () =>
      getOrCreateCharacterTextures(
        role,
        activeEyeState,
        activeMouthState,
        quantizedBrow
      ),
    [role, activeEyeState, activeMouthState, quantizedBrow]
  );

  const dir = flipX ? -1 : 1;
  const runCycle =
    action === 'panic_run'
      ? Math.sin(stepFrame * 0.45)
      : Math.sin(stepFrame * 0.12) * 0.12;
  const bobY =
    action === 'panic_run'
      ? Math.abs(Math.sin(frame * 0.45)) * 0.1
      : Math.sin(frame * 0.1) * 0.025;

  const rightHandPos: [number, number, number] = useMemo(() => {
    if (action === 'inspect_glass') {
      return [0.46 * dir, 1.48 + Math.sin(stepFrame * 0.15) * 0.04, 0.12];
    }
    if (action === 'pointing') {
      return [0.68 * dir, 1.56 + Math.sin(stepFrame * 0.2) * 0.05, 0.08];
    }
    if (action === 'writing') {
      return [0.42 * dir + Math.sin(stepFrame * 0.5) * 0.06, 1.12, 0.12];
    }
    if (action === 'gavel_slam') {
      const slam = Math.sin(stepFrame * 0.35);
      return [0.5 * dir, 1.25 + slam * 0.28, 0.14];
    }
    if (action === 'cheer_gold') {
      return [0.55 * dir, 1.75 + Math.sin(stepFrame * 0.25) * 0.1, 0.08];
    }
    if (action === 'panic_run') {
      return [0.52 * dir, 1.65 + Math.sin(stepFrame * 0.45) * 0.22, 0.1];
    }
    return [0.38 * dir, 0.96 + Math.sin(stepFrame * 0.15) * 0.05, 0.05];
  }, [action, dir, stepFrame]);

  const leftHandPos: [number, number, number] = useMemo(() => {
    if (action === 'panic_run') {
      return [-0.52 * dir, 1.65 - Math.sin(stepFrame * 0.45) * 0.22, 0.1];
    }
    if (action === 'cheer_gold') {
      return [-0.52 * dir, 1.72 + Math.cos(stepFrame * 0.25) * 0.1, 0.08];
    }
    return [-0.38 * dir, 0.95 - Math.sin(stepFrame * 0.12) * 0.04, 0.05];
  }, [action, dir, stepFrame]);

  return (
    <group position={[position[0], position[1] + bobY, position[2]]} scale={scale}>
      <mesh
        position={[0, 1.25, 0]}
        castShadow={!isUltraLight}
        receiveShadow={false}
        customDepthMaterial={isUltraLight ? undefined : depthMaterial}
      >
        <planeGeometry args={[1.45, 2.18]} />
        <meshStandardMaterial
          map={colorTexture}
          transparent
          alphaTest={0.5}
          roughness={0.55}
          metalness={0.02}
          emissive="#FFFFFF"
          emissiveMap={colorTexture}
          emissiveIntensity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      <CubicBezierLine
        start={[-0.24 * dir, 1.18, 0.03]}
        midA={[-0.36 * dir, 1.12, 0.06]}
        midB={[-0.42 * dir, 1.04, 0.08]}
        end={leftHandPos}
        color="#1A1A1A"
        lineWidth={5}
      />

      <CubicBezierLine
        start={[0.24 * dir, 1.18, 0.03]}
        midA={[0.38 * dir, 1.18, 0.08]}
        midB={[0.46 * dir, 1.26, 0.1]}
        end={rightHandPos}
        color="#1A1A1A"
        lineWidth={5}
      />

      <CubicBezierLine
        start={[-0.14, 0.56, 0.02]}
        midA={[-0.18 - runCycle * 0.12, 0.36, 0.05]}
        midB={[-0.2 - runCycle * 0.18, 0.18, 0.04]}
        end={[-0.18 - runCycle * 0.25, 0.02, 0.03]}
        color="#1A1A1A"
        lineWidth={5.5}
      />

      <CubicBezierLine
        start={[0.14, 0.56, 0.02]}
        midA={[0.18 + runCycle * 0.12, 0.36, 0.05]}
        midB={[0.2 + runCycle * 0.18, 0.18, 0.04]}
        end={[0.18 + runCycle * 0.25, 0.02, 0.03]}
        color="#1A1A1A"
        lineWidth={5.5}
      />

      {action === 'inspect_glass' && (
        <group position={rightHandPos}>
          <mesh rotation={[0, 0, -0.4]}>
            <torusGeometry args={[0.14, 0.025, 8, 16]} />
            <meshStandardMaterial
              color="#FFD700"
              roughness={0.2}
              metalness={0.9}
              emissive="#FFD700"
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[0.13, 14]} />
            <meshStandardMaterial
              color="#B8E8FF"
              transparent
              opacity={0.45}
              roughness={0.1}
            />
          </mesh>
        </group>
      )}

      {action === 'gavel_slam' && (
        <group position={rightHandPos} rotation={[0, 0, Math.sin(stepFrame * 0.35) * 0.6]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.22, 8]} />
            <meshStandardMaterial color="#8C6239" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
            <meshStandardMaterial color="#A67C52" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>
      )}

      {action === 'cheer_gold' && (
        <mesh position={rightHandPos}>
          <cylinderGeometry args={[0.11, 0.11, 0.03, 12]} />
          <meshStandardMaterial
            color="#FFD700"
            roughness={0.2}
            metalness={0.9}
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};
