import React from 'react';

/**
 * Small hand-drawn "3D-style" SVG icons (gradient fills + shading) for
 * each Animation Lab three.js demo — matching the site's cyan/violet/pink
 * accent palette instead of generic flat logo icons.
 */

const defs = (id) => (
  <defs>
    <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#00f0ff" />
      <stop offset="100%" stopColor="#0a6fb0" />
    </linearGradient>
    <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#b14aff" />
      <stop offset="100%" stopColor="#5a1f99" />
    </linearGradient>
    <linearGradient id={`${id}-c`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ff5b94" />
      <stop offset="100%" stopColor="#99264f" />
    </linearGradient>
  </defs>
);

export const WireframeIcon3D = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {defs('wf')}
    <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" fill="url(#wf-a)" opacity="0.18" />
    <path d="M16 2 L28 9 L16 16 L4 9 Z" fill="url(#wf-a)" opacity="0.5" />
    <path d="M16 2 L28 9 V23 L16 16 Z" fill="url(#wf-b)" opacity="0.45" />
    <path d="M16 2 L4 9 V23 L16 16 Z" fill="url(#wf-c)" opacity="0.35" />
    <g stroke="#dffcff" strokeWidth="0.9" strokeLinejoin="round" opacity="0.9">
      <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" />
      <path d="M16 2 L16 16 M4 9 L16 16 M28 9 L16 16 M16 16 L16 30" />
    </g>
  </svg>
);

export const MatcapIcon3D = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <defs>
      <radialGradient id="mc-sphere" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#eaf6ff" />
        <stop offset="45%" stopColor="#6fd4ff" />
        <stop offset="100%" stopColor="#0a4a7a" />
      </radialGradient>
      <linearGradient id="mc-half" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff8ac0" />
        <stop offset="100%" stopColor="#6a1f8f" />
      </linearGradient>
      <clipPath id="mc-clip">
        <circle cx="16" cy="16" r="13" />
      </clipPath>
    </defs>
    <circle cx="16" cy="16" r="13" fill="url(#mc-sphere)" />
    <rect x="16" y="3" width="13" height="26" fill="url(#mc-half)" opacity="0.55" clipPath="url(#mc-clip)" />
    <circle cx="11.5" cy="11" r="3" fill="#ffffff" opacity="0.75" />
  </svg>
);

export const SpotlightIcon3D = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {defs('sp')}
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="url(#sp-b)" opacity="0.4" />
    <path d="M14 3 H18 L25 24 H7 Z" fill="url(#sp-a)" opacity="0.8" />
    <path d="M14 3 H18 L15.2 13 H16.8 Z" fill="#ffffff" opacity="0.85" />
    <circle cx="16" cy="3" r="2.4" fill="#dffcff" />
  </svg>
);

export const LayersIcon3D = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {defs('ly')}
    <path d="M16 4 L29 11 L16 18 L3 11 Z" fill="url(#ly-a)" opacity="0.9" />
    <path d="M3 16 L16 23 L29 16 L29 19 L16 26 L3 19 Z" fill="url(#ly-b)" opacity="0.85" />
    <path d="M3 21 L16 28 L29 21 L29 24 L16 31 L3 24 Z" fill="url(#ly-c)" opacity="0.8" />
  </svg>
);

export const OceanIcon3D = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {defs('oc')}
    <circle cx="16" cy="10" r="5.5" fill="none" stroke="url(#oc-a)" strokeWidth="1.3" />
    <path d="M12 8 L20 12 M20 8 L12 12 M16 6 V14" stroke="#dffcff" strokeWidth="0.7" opacity="0.8" />
    <path d="M2 18 Q8 14 16 18 T30 18 V29 H2 Z" fill="url(#oc-b)" opacity="0.5" />
    <path d="M2 22 Q8 18 16 22 T30 22 V29 H2 Z" fill="url(#oc-a)" opacity="0.55" />
  </svg>
);
