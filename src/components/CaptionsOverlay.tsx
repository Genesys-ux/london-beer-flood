import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import captionsData from '../data/captions.json';

interface CaptionWord {
  word: string;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  highlight: boolean;
  segmentId: number;
}

const WORDS: CaptionWord[] = captionsData as CaptionWord[];

export const CaptionsOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Group words into 3-word punchy chunks per segment so center-bottom stays super readable
  const chunks = useMemo(() => {
    const result: CaptionWord[][] = [];
    let currentChunk: CaptionWord[] = [];
    for (const w of WORDS) {
      if (
        currentChunk.length >= 3 ||
        (currentChunk.length > 0 &&
          currentChunk[0].segmentId !== w.segmentId)
      ) {
        result.push(currentChunk);
        currentChunk = [];
      }
      currentChunk.push(w);
    }
    if (currentChunk.length > 0) {
      result.push(currentChunk);
    }
    return result;
  }, []);

  const activeChunk = useMemo(() => {
    return chunks.find((chunk) => {
      const start = chunk[0].startFrame - 3;
      const end = chunk[chunk.length - 1].endFrame + 8;
      return frame >= start && frame <= end;
    });
  }, [chunks, frame]);

  if (!activeChunk) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 210,
        left: 60,
        right: 60,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {activeChunk.map((w, idx) => {
        const isCurrent = frame >= w.startFrame - 1 && frame <= w.endFrame + 2;
        const pop = spring({
          frame: Math.max(0, frame - w.startFrame),
          fps,
          config: { damping: 11, stiffness: 220 },
        });
        const scale = isCurrent ? 1 + 0.12 * pop : 1.0;
        const fillColor = w.highlight || isCurrent && w.highlight
          ? '#FFD700'
          : isCurrent
          ? '#FFD700'
          : '#FFFFFF';

        return (
          <span
            key={`${w.startFrame}-${idx}`}
            style={{
              fontFamily:
                '"Montserrat ExtraBold", "Inter Black", "Arial Black", sans-serif',
              fontWeight: 900,
              fontSize: '56px',
              lineHeight: 1.15,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: fillColor,
              WebkitTextStroke: '11px #1A1A1A',
              paintOrder: 'stroke fill',
              textShadow:
                '0px 8px 0px #1A1A1A, 0px 14px 28px rgba(0, 0, 0, 0.85)',
              transform: `scale(${scale})`,
              display: 'inline-block',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
