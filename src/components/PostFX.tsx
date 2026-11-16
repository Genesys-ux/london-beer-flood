import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import { ShotSpec } from '../data/storyData';

interface PostFXProps {
  shot: ShotSpec;
}

export const PostFX: React.FC<PostFXProps> = ({ shot }) => {
  const frame = useCurrentFrame();
  const shotFrame = frame - shot.startFrame;
  const shotDuration = shot.endFrame - shot.startFrame;

  // Dynamically animate focalLength and bokehScale (from 0 to 4) during macro inspection shots
  const bokehScale = shot.macroDof
    ? interpolate(
        shotFrame,
        [0, shotDuration * 0.35, shotDuration * 0.8, shotDuration],
        [0, 4, 4, 1.2],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  const focalLength = shot.macroDof
    ? interpolate(shotFrame, [0, shotDuration * 0.4], [0.02, 0.065], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0.02;

  if (shot.macroDof) {
    return (
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <DepthOfField
          focusDistance={0.015}
          focalLength={focalLength}
          bokehScale={bokehScale}
          height={240}
        />
        <Bloom
          intensity={0.45}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.25}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.18} darkness={0.55} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.18} darkness={0.55} />
    </EffectComposer>
  );
};
