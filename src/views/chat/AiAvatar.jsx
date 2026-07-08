import React, { useMemo } from 'react';
import Lottie from 'lottie-react';

/**
 * Generates a professional AI orb animation with pulsing rings.
 * Two states: idle (slow gentle pulse) and speaking (active rings + glow).
 */
function generateOrbAnimation(isSpeaking) {
  const baseColor = [0, 0.75, 1]; // cyan #00BFFF
  const glowColor = [0.2, 0.85, 1];

  // Orb core - solid circle
  const orbCore = {
    ty: 'el',
    p: { a: 0, k: [0, 0] },
    s: isSpeaking
      ? { a: 1, k: [
          { t: 0, s: [80, 80], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: 15, s: [90, 90], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: 30, s: [80, 80] },
        ]}
      : { a: 1, k: [
          { t: 0, s: [80, 80], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: 40, s: [85, 85], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: 80, s: [80, 80] },
        ]},
  };

  const makeRing = (delay, maxScale, opacity) => ({
    ty: 'gr',
    it: [
      {
        ty: 'el',
        p: { a: 0, k: [0, 0] },
        s: { a: 1, k: [
          { t: delay, s: [80, 80], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: delay + (isSpeaking ? 20 : 40), s: [maxScale, maxScale], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: delay + (isSpeaking ? 40 : 80), s: [80, 80] },
        ]},
      },
      {
        ty: 'st',
        c: { a: 0, k: [...glowColor, 1] },
        o: { a: 1, k: [
          { t: delay, s: [opacity * 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: delay + (isSpeaking ? 20 : 40), s: [opacity * 50], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
          { t: delay + (isSpeaking ? 40 : 80), s: [opacity * 100] },
        ]},
        w: { a: 0, k: isSpeaking ? 3 : 2 },
      },
      {
        ty: 'tr',
        p: { a: 0, k: [150, 150] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: { a: 0, k: 100 },
      },
    ],
  });

  const layers = [
    // Ring layers (behind the orb)
    ...(isSpeaking ? [
      {
        ty: 4, nm: 'ring3', sr: 1, ks: {
          o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
          p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
        },
        shapes: [makeRing(10, 200, 0.15)],
        ip: 0, op: 40, st: 0,
      },
      {
        ty: 4, nm: 'ring2', sr: 1, ks: {
          o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
          p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
        },
        shapes: [makeRing(5, 160, 0.25)],
        ip: 0, op: 40, st: 0,
      },
    ] : [
      {
        ty: 4, nm: 'ring1', sr: 1, ks: {
          o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
          p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
        },
        shapes: [makeRing(0, 130, 0.2)],
        ip: 0, op: 80, st: 0,
      },
    ]),
    // Core orb
    {
      ty: 4, nm: 'core', sr: 1,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 150] }, a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          it: [
            orbCore,
            {
              ty: 'fl',
              c: { a: 0, k: [...baseColor, 1] },
              o: { a: 0, k: 90 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0, op: isSpeaking ? 40 : 80, st: 0,
    },
  ];

  return {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: isSpeaking ? 40 : 80,
    w: 300,
    h: 300,
    nm: 'AI Avatar',
    layers,
  };
}

const AiAvatar = ({ isSpeaking = false, size = 200 }) => {
  const animationData = useMemo(() => generateOrbAnimation(isSpeaking), [isSpeaking]);

  return (
    <div style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: isSpeaking ? 'drop-shadow(0 0 30px rgba(0,191,255,0.5))' : 'drop-shadow(0 0 15px rgba(0,191,255,0.25))',
      transition: 'filter 0.3s ease',
    }}>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default AiAvatar;
