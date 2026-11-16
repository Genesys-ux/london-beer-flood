import React from 'react';
import { Composition } from 'remotion';
import { LondonBeerFloodScene } from './LondonBeerFloodScene';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LondonBeerFlood"
        component={LondonBeerFloodScene}
        durationInFrames={3600}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          qualityMode: 'auto',
        }}
      />
    </>
  );
};
