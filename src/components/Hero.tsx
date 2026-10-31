import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ShoppingBag,
  CheckCircle,
  Shield,
  Ruler,
  Phone,
  Quote,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  Zap,
  MailQuestion,
} from "lucide-react";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { LucideIcon } from "lucide-react";

type Stat = {
  value: string;
  label: string;
  icon: LucideIcon;
};

/* ------------------------------------------------------------------ */
/*  Illustrated product scenes (float directly on the hero, no card)   */
/*  Every scene is a small SVG "window" with the product installed.    */
/* ------------------------------------------------------------------ */

type SceneKey =
  | "roman"
  | "roller"
  | "mesh"
  | "vertical"
  | "pvc"
  | "honeycomb"
  | "skylight"
  | "wooden"
  | "zebra"
  | "motor"
  | "measure";

// Glass area of the standard window (viewBox 0 0 400 270)
const GX = 120;
const GY = 32;
const GW = 160;
const GH = 186;

const SLIDE_MS = 6000; // autoplay delay, matches the 6s scene animations

const SCENE_CSS = `
.hs-a{transform-box:fill-box}
.hs-t0{transform-origin:50% 0}
.hs-tc{transform-origin:50% 50%}

.hs-roller{animation:hs-roller 6s ease-in-out infinite}
@keyframes hs-roller{0%,8%{transform:scaleY(.06)}40%,66%{transform:scaleY(1)}92%,100%{transform:scaleY(.06)}}
.hs-roman{animation:hs-roman 6s ease-in-out infinite}
@keyframes hs-roman{0%,8%{transform:scaleY(.34)}40%,66%{transform:scaleY(1)}92%,100%{transform:scaleY(.34)}}
.hs-honey{animation:hs-honey 6s ease-in-out infinite}
@keyframes hs-honey{0%,8%{transform:scaleY(.26)}40%,66%{transform:scaleY(1)}92%,100%{transform:scaleY(.26)}}

.hs-tilt{animation:hs-tilt 6s ease-in-out infinite}
@keyframes hs-tilt{0%,10%{transform:scaleY(1)}35%,60%{transform:scaleY(.14)}85%,100%{transform:scaleY(1)}}
.hs-vane{animation:hs-vane 6s ease-in-out infinite}
@keyframes hs-vane{0%,10%{transform:scaleX(1)}35%,60%{transform:scaleX(.18)}85%,100%{transform:scaleX(1)}}

.hs-zebra{animation:hs-zebra 6s ease-in-out infinite}
@keyframes hs-zebra{0%,12%{transform:translateY(0)}40%,64%{transform:translateY(15.5px)}92%,100%{transform:translateY(0)}}

.hs-skyshade{animation:hs-skyshade 6s ease-in-out infinite}
@keyframes hs-skyshade{0%,8%{transform:translateY(-170px)}42%,66%{transform:translateY(0)}94%,100%{transform:translateY(-170px)}}
.hs-beam{animation:hs-beam 6s ease-in-out infinite}
@keyframes hs-beam{0%,8%{opacity:1}42%,66%{opacity:.12}94%,100%{opacity:1}}

.hs-fly{animation:hs-fly 6s ease-in-out infinite}
@keyframes hs-fly{
  0%{transform:translate(-80px,46px)}14%{transform:translate(-56px,6px)}
  28%{transform:translate(-30px,34px)}40%{transform:translate(-8px,6px)}
  46%{transform:translate(0,0)}52%{transform:translate(-10px,-4px)}
  58%{transform:translate(0,0)}72%{transform:translate(-44px,-24px)}
  88%{transform:translate(-72px,30px)}100%{transform:translate(-80px,46px)}}
.hs-ring{transform-origin:50% 50%;opacity:0;animation:hs-ring 6s ease-out infinite}
@keyframes hs-ring{0%,44%{opacity:0;transform:scale(.2)}48%{opacity:.95;transform:scale(.4)}66%,100%{opacity:0;transform:scale(1.5)}}
.hs-flap{transform-origin:50% 100%;animation:hs-flap .14s linear infinite alternate}
@keyframes hs-flap{from{transform:scaleY(1)}to{transform:scaleY(.25)}}

.hs-drop{opacity:0;animation:hs-drop 2.4s ease-in infinite}
@keyframes hs-drop{0%{transform:translateY(0);opacity:0}10%{opacity:1}85%{opacity:.9}100%{transform:translateY(166px);opacity:0}}

.hs-knob{animation:hs-knob 6s ease-in-out infinite}
@keyframes hs-knob{0%,8%{transform:translateY(0)}40%,66%{transform:translateY(54px)}92%,100%{transform:translateY(0)}}
.hs-say1{opacity:0;animation:hs-say1 6s ease-in-out infinite}
@keyframes hs-say1{0%{opacity:0}4%,30%{opacity:1}38%,100%{opacity:0}}
.hs-say2{opacity:0;animation:hs-say2 6s ease-in-out infinite}
@keyframes hs-say2{0%,58%{opacity:0}64%,86%{opacity:1}94%,100%{opacity:0}}
.hs-led{animation:hs-led 1.6s ease-in-out infinite}
@keyframes hs-led{0%,100%{opacity:1}50%{opacity:.25}}

.hs-draw{stroke-dasharray:100;animation:hs-draw 6s ease-in-out infinite}
@keyframes hs-draw{0%,4%{stroke-dashoffset:100;opacity:1}28%,88%{stroke-dashoffset:0;opacity:1}96%,100%{stroke-dashoffset:0;opacity:0}}
.hs-fade{animation:hs-fade 6s ease-in-out infinite}
@keyframes hs-fade{0%,24%{opacity:0}34%,88%{opacity:1}96%,100%{opacity:0}}

.hs-prog{transform-origin:0 50%;animation:hs-prog 6s linear forwards}
@keyframes hs-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}

@media (prefers-reduced-motion:reduce){
  [class*="hs-"]{animation:none!important}
  .hs-say1,.hs-say2,.hs-ring,.hs-drop{display:none}
}
`;

/* ---------- shared window ---------- */

const Sky: React.FC = () => (
  <>
    <rect x={GX} y={GY} width={GW} height={GH} fill="url(#hs-sky)" />
    <circle cx={250} cy={74} r={22} fill="#fff6c8" opacity={0.35} />
    <circle cx={250} cy={74} r={13} fill="#fff3b0" />
    <g fill="#fff" opacity={0.92}>
      <ellipse cx={160} cy={104} rx={24} ry={7} />
      <ellipse cx={176} cy={98} rx={14} ry={8} />
    </g>
    <path d="M120 188 Q165 164 210 182 T280 172 V218 H120 Z" fill="#9fd1a0" />
    <path d="M120 202 Q170 186 225 198 T280 192 V218 H120 Z" fill="#7fbf8a" />
    <polygon points="168,32 190,32 140,218 118,218" fill="#fff" opacity={0.18} />
  </>
);

type FrameProps = {
  label: string;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  dx?: number;
  viewBox?: string;
};

const WindowFrame: React.FC<FrameProps> = ({
  label,
  children,
  overlay,
  dx = 0,
  viewBox = "60 0 290 270",
}) => (
  <svg
    viewBox={viewBox}
    role="img"
    aria-label={label}
    className="h-full w-full"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9fd3ff" />
        <stop offset="1" stopColor="#eaf6ff" />
      </linearGradient>
      <radialGradient id="hs-floor">
        <stop offset="0" stopColor="#0f172a" stopOpacity="0.34" />
        <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
      </radialGradient>
      <clipPath id="hs-glass">
        <rect x={GX} y={GY} width={GW} height={GH} />
      </clipPath>
    </defs>
    <g transform={`translate(${dx} 0)`}>
      <ellipse cx={200} cy={247} rx={124} ry={9} fill="url(#hs-floor)" />
      <rect x={110} y={22} width={180} height={206} rx={4} fill="#f4f0e8" stroke="#d6cdbb" strokeWidth={1.2} />
      <g clipPath="url(#hs-glass)">
        <Sky />
        {children}
      </g>
      <rect x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#cfc7b8" strokeWidth={2} />
      {overlay}
      <rect x={98} y={228} width={204} height={9} rx={2} fill="#faf7f1" stroke="#d6cdbb" strokeWidth={1} />
      <rect x={106} y={237} width={188} height={5} fill="#000" opacity={0.25} />
    </g>
  </svg>
);

const Headrail: React.FC<{ fill: string }> = ({ fill }) => (
  <rect x={GX - 4} y={GY - 6} width={GW + 8} height={10} rx={2} fill={fill} />
);

/* ---------- scenes ---------- */

const RomanScene: React.FC = () => (
  <WindowFrame label="Roman blind illustration" overlay={<Headrail fill="#7a5f45" />}>
    <defs>
      <linearGradient id="hs-fold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3e7cf" />
        <stop offset="0.6" stopColor="#e4d0ae" />
        <stop offset="1" stopColor="#c7ad86" />
      </linearGradient>
    </defs>
    <g className="hs-a hs-t0 hs-roman">
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={GX} y={GY + i * 31} width={GW} height={31} fill="url(#hs-fold)" />
      ))}
      <rect x={GX} y={GY + GH - 5} width={GW} height={5} fill="#a68a63" />
    </g>
  </WindowFrame>
);

const RollerScene: React.FC = () => (
  <WindowFrame
    label="Roller blind illustration"
    overlay={
      <>
        <rect x={GX - 5} y={GY - 8} width={GW + 10} height={13} rx={6.5} fill="#d6d0c2" />
        <rect x={GX - 5} y={GY - 8} width={GW + 10} height={4} rx={2} fill="#fff" opacity={0.5} />
        <line x1={GX + GW + 18} y1={GY - 2} x2={GX + GW + 18} y2={GY + 76} stroke="#9aa5ae" strokeWidth={2} strokeDasharray="2 3" />
      </>
    }
  >
    <g className="hs-a hs-t0 hs-roller">
      <rect x={GX} y={GY} width={GW} height={GH} fill="#f3f1ea" />
      <rect x={GX} y={GY + GH - 7} width={GW} height={7} fill="#d4cfc2" />
    </g>
  </WindowFrame>
);

const Mosquito: React.FC = () => (
  <g>
    <g className="hs-a hs-flap">
      <ellipse cx={-1} cy={-3.4} rx={4.2} ry={1.7} fill="#fff" opacity={0.8} />
    </g>
    <ellipse cx={0} cy={0} rx={5} ry={1.9} fill="#1f2937" />
    <circle cx={6} cy={0} r={1.7} fill="#1f2937" />
    <line x1={7.4} y1={0.2} x2={11.5} y2={1.8} stroke="#1f2937" strokeWidth={0.6} />
    <path d="M-2 1.6 L-4.5 5 M0 1.8 L0 5.6 M2 1.6 L4.5 5" stroke="#1f2937" strokeWidth={0.5} fill="none" />
  </g>
);

const MeshScene: React.FC = () => (
  <WindowFrame
    label="Mosquito net illustration"
    overlay={
      <>
        <rect x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#8d949c" strokeWidth={5} />
        <rect x={GX + GW / 2 - 9} y={GY + GH - 4} width={18} height={4} rx={2} fill="#5b636b" />
      </>
    }
  >
    <defs>
      <pattern id="hs-mesh" width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M4 0H0V4" fill="none" stroke="#1f2937" strokeWidth="0.6" opacity="0.5" />
      </pattern>
    </defs>
    <g className="hs-fly">
      <g transform="translate(212 104) scale(1.8)">
        <Mosquito />
      </g>
    </g>
    <rect x={GX} y={GY} width={GW} height={GH} fill="url(#hs-mesh)" />
    <circle className="hs-a hs-ring" cx={212} cy={104} r={16} fill="none" stroke="#34d399" strokeWidth={2} />
  </WindowFrame>
);

const VerticalScene: React.FC = () => (
  <WindowFrame label="Vertical blind illustration" overlay={<Headrail fill="#5c5870" />}>
    <defs>
      <linearGradient id="hs-vanefill" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#cdc7e4" />
        <stop offset="0.5" stopColor="#f6f4ff" />
        <stop offset="1" stopColor="#bbb5d6" />
      </linearGradient>
    </defs>
    {Array.from({ length: 8 }, (_, i) => (
      <rect
        key={i}
        className="hs-a hs-t0 hs-vane"
        style={{ animationDelay: `${i * 0.07}s` }}
        x={GX + i * 20 + 1}
        y={GY - 2}
        width={18}
        height={GH - 4}
        rx={1}
        fill="url(#hs-vanefill)"
      />
    ))}
    <line x1={GX} y1={GY + GH - 10} x2={GX + GW} y2={GY + GH - 10} stroke="#8d86a8" strokeWidth={1.2} strokeDasharray="3 2" />
  </WindowFrame>
);

const PvcScene: React.FC = () => {
  const N = 14;
  const P = GH / N;
  return (
    <WindowFrame label="PVC blind illustration" overlay={<Headrail fill="#b4c0c6" />}>
      <defs>
        <linearGradient id="hs-pvc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d3e0e6" />
        </linearGradient>
      </defs>
      {Array.from({ length: N }, (_, i) => (
        <rect
          key={i}
          className="hs-a hs-tc hs-tilt"
          x={GX}
          y={GY + i * P + 0.8}
          width={GW}
          height={P - 1.6}
          rx={1.5}
          fill="url(#hs-pvc)"
          stroke="#c4d2d8"
          strokeWidth={0.6}
        />
      ))}
      <line x1={GX + 26} y1={GY} x2={GX + 26} y2={GY + GH} stroke="#aebdc4" strokeWidth={1.2} />
      <line x1={GX + GW - 26} y1={GY} x2={GX + GW - 26} y2={GY + GH} stroke="#aebdc4" strokeWidth={1.2} />
      {[
        { x: GX + 30, d: 0 },
        { x: GX + 92, d: 0.9 },
        { x: GX + 132, d: 1.7 },
      ].map((drop) => (
        <ellipse
          key={drop.x}
          className="hs-a hs-drop"
          style={{ animationDelay: `${drop.d}s` }}
          cx={drop.x}
          cy={GY + 8}
          rx={2.2}
          ry={3.2}
          fill="#7dd3fc"
          stroke="#fff"
          strokeWidth={0.8}
        />
      ))}
    </WindowFrame>
  );
};

const HoneycombScene: React.FC = () => (
  <WindowFrame
    label="Honeycomb blind illustration"
    overlay={
      <>
        <Headrail fill="#8a7358" />
        <defs>
          <clipPath id="hs-loupe">
            <circle cx={300} cy={176} r={32} />
          </clipPath>
        </defs>
        <circle cx={300} cy={176} r={32} fill="#bba983" />
        <g clipPath="url(#hs-loupe)">
          {[-2, -1, 0, 1, 2].map((k) => (
            <polygon
              key={k}
              transform={`translate(300 ${176 + 24 * k})`}
              points="-22,0 -11,-12 11,-12 22,0 11,12 -11,12"
              fill="#eadfc8"
              stroke="#a8956f"
              strokeWidth={2.5}
            />
          ))}
        </g>
        <circle cx={300} cy={176} r={32} fill="none" stroke="#8a7358" strokeWidth={3.5} />
        <line x1={323} y1={199} x2={339} y2={215} stroke="#8a7358" strokeWidth={5} strokeLinecap="round" />
      </>
    }
  >
    <defs>
      <linearGradient id="hs-cell" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2e9d5" />
        <stop offset="1" stopColor="#d9c9a8" />
      </linearGradient>
    </defs>
    <g className="hs-a hs-t0 hs-honey">
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={GX} y={GY + i * 20.67} width={GW} height={20.67} fill="url(#hs-cell)" stroke="#b9a785" strokeWidth={0.8} />
      ))}
      <rect x={GX} y={GY + GH - 5} width={GW} height={5} fill="#a8956f" />
    </g>
  </WindowFrame>
);

const SkylightScene: React.FC = () => (
  <svg
    viewBox="30 0 340 270"
    role="img"
    aria-label="Skylight blind illustration"
    className="h-full w-full"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fcbff" />
        <stop offset="1" stopColor="#eaf6ff" />
      </linearGradient>
      <linearGradient id="hs-beamg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbbf24" stopOpacity="0.4" />
        <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
      </linearGradient>
      <pattern id="hs-pleat" width="4" height="9" patternUnits="userSpaceOnUse">
        <rect width="4" height="9" fill="#efe7d6" />
        <rect y="7" width="4" height="2" fill="#d6c9ae" />
      </pattern>
      <clipPath id="hs-skyglass">
        <polygon points="132,44 268,44 300,200 100,200" />
      </clipPath>
    </defs>
    <polygon className="hs-beam" points="78,214 322,214 392,270 8,270" fill="url(#hs-beamg)" />
    <polygon points="118,30 282,30 322,214 78,214" fill="#efeadf" stroke="#d6cdbb" strokeWidth={1.2} />
    <g clipPath="url(#hs-skyglass)">
      <rect x={90} y={40} width={220} height={170} fill="url(#hs-sky)" />
      <circle cx={224} cy={84} r={22} fill="#fff6c8" opacity={0.4} />
      <circle cx={224} cy={84} r={13} fill="#fff3b0" />
      <g fill="#fff" opacity={0.92}>
        <ellipse cx={156} cy={116} rx={24} ry={7} />
        <ellipse cx={172} cy={110} rx={14} ry={8} />
      </g>
      <g className="hs-skyshade">
        <rect x={90} y={44} width={220} height={160} fill="url(#hs-pleat)" />
        <rect x={90} y={198} width={220} height={6} fill="#bfae8c" />
      </g>
    </g>
    <polygon points="132,44 268,44 300,200 100,200" fill="none" stroke="#cfc7b8" strokeWidth={2} />
    <polyline points="132,44 100,200" fill="none" stroke="#8c97a4" strokeWidth={2.5} />
    <polyline points="268,44 300,200" fill="none" stroke="#8c97a4" strokeWidth={2.5} />
  </svg>
);

const WoodenScene: React.FC = () => {
  const N = 12;
  const P = GH / N;
  return (
    <WindowFrame label="Wooden blind illustration" overlay={<Headrail fill="#5d3f27" />}>
      <defs>
        <linearGradient id="hs-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cb925e" />
          <stop offset="1" stopColor="#8f5d36" />
        </linearGradient>
      </defs>
      {Array.from({ length: N }, (_, i) => {
        const y = GY + i * P + 1;
        return (
          <g
            key={i}
            className="hs-a hs-tc hs-tilt"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <rect x={GX} y={y} width={GW} height={P - 2} rx={1} fill="url(#hs-wood)" />
            <rect x={GX} y={y} width={GW} height={1.6} fill="#e6bb8c" />
            <path
              d={`M${GX + 8 + ((i * 37) % 70)} ${y + 6} h${30 + ((i * 13) % 40)} M${GX + 20 + ((i * 53) % 80)} ${y + 10} h${24 + ((i * 7) % 30)}`}
              stroke="#7b4f2d"
              strokeOpacity={0.4}
              strokeWidth={0.8}
              fill="none"
            />
          </g>
        );
      })}
      <line x1={GX + 30} y1={GY} x2={GX + 30} y2={GY + GH} stroke="#f0e2c8" strokeWidth={1.4} />
      <line x1={GX + GW - 30} y1={GY} x2={GX + GW - 30} y2={GY + GH} stroke="#f0e2c8" strokeWidth={1.4} />
    </WindowFrame>
  );
};

const ZebraScene: React.FC = () => (
  <WindowFrame label="Zebra blind illustration" overlay={<Headrail fill="#b8ae9c" />}>
    {/* back layer: opaque bands that slide behind the sheer front bands */}
    <g className="hs-zebra">
      {[0, 2, 4, 6, 8, 10].map((i) => (
        <rect key={i} x={GX} y={GY + i * 15.5} width={GW} height={15.5} fill="#d8cfbe" />
      ))}
    </g>
    {/* front layer: alternating opaque + sheer */}
    {Array.from({ length: 12 }, (_, i) => (
      <rect
        key={i}
        x={GX}
        y={GY + i * 15.5}
        width={GW}
        height={15.5}
        fill={i % 2 === 0 ? "#efe9dd" : "#ffffff"}
        fillOpacity={i % 2 === 0 ? 1 : 0.4}
      />
    ))}
  </WindowFrame>
);

const MotorScene: React.FC = () => (
  <WindowFrame
    dx={-44}
    viewBox="46 0 304 270"
    label="Motorised blind illustration"
    overlay={
      <>
        <rect x={GX - 5} y={GY - 8} width={GW + 10} height={13} rx={6.5} fill="#cfd5e1" />
        <rect x={GX + GW + 5} y={GY - 8} width={12} height={13} rx={3} fill="#1e293b" />
        <circle className="hs-led" cx={GX + GW + 11} cy={GY - 1.5} r={1.8} fill="#5eead4" />

        {/* voice bubbles */}
        <g className="hs-say1">
          <rect x={300} y={26} width={92} height={22} rx={11} fill="#fff" stroke="#cbd5e1" strokeWidth={1} />
          <polygon points="344,48 352,48 348,55" fill="#fff" />
          <text x={346} y={40.5} fontSize={8.5} fontWeight={600} fill="#0f172a" textAnchor="middle">
            Close the blinds
          </text>
        </g>
        <g className="hs-say2">
          <rect x={300} y={26} width={92} height={22} rx={11} fill="#fff" stroke="#cbd5e1" strokeWidth={1} />
          <polygon points="344,48 352,48 348,55" fill="#fff" />
          <text x={346} y={40.5} fontSize={8.5} fontWeight={600} fill="#0f172a" textAnchor="middle">
            Open the blinds
          </text>
        </g>

        {/* phone */}
        <rect x={314} y={64} width={72} height={138} rx={12} fill="#0b1220" stroke="#475569" strokeWidth={2} />
        <rect x={320} y={72} width={60} height={122} rx={8} fill="#14213a" />
        <text x={350} y={87} fontSize={7.5} fontWeight={600} fill="#a5b4d0" textAnchor="middle">
          Living room
        </text>
        <rect x={345} y={96} width={10} height={64} rx={5} fill="#26364f" />
        <rect className="hs-a hs-t0 hs-roller" x={345} y={96} width={10} height={64} rx={5} fill="#5eead4" />
        <circle className="hs-a hs-knob" cx={350} cy={100} r={6.5} fill="#fff" />
        <rect x={328} y={168} width={44} height={14} rx={7} fill="#0f766e" />
        <text x={350} y={177.8} fontSize={7} fontWeight={600} fill="#fff" textAnchor="middle">
          7:00 AM
        </text>
      </>
    }
  >
    <g className="hs-a hs-t0 hs-roller">
      <rect x={GX} y={GY} width={GW} height={GH} fill="#e9edf5" />
      <rect x={GX} y={GY + GH - 7} width={GW} height={7} fill="#c3cad9" />
    </g>
  </WindowFrame>
);

const MeasureScene: React.FC = () => (
  <WindowFrame
    label="Window measurement illustration"
    overlay={
      <g className="text-amber-600 dark:text-amber-300" stroke="currentColor" fill="none" strokeWidth={1.4}>
        <path className="hs-draw" pathLength={100} d="M110 14 H290" />
        <path className="hs-draw" pathLength={100} d="M312 22 V228" />
        <g className="hs-fade" strokeWidth={1}>
          <path d="M110 8 V24 M290 8 V24 M290 22 H318 M302 228 H318" />
          <path d="M110 14 l6 -3 v6 z M290 14 l-6 -3 v6 z M312 22 l-3 6 h6 z M312 228 l-3 -6 h6 z" fill="currentColor" />
        </g>
        <g className="hs-fade" fill="currentColor" stroke="none" fontSize={10} fontWeight={600}>
          <text x={200} y={9} textAnchor="middle">1200 mm</text>
          <text x={329} y={125} textAnchor="middle" transform="rotate(90 329 125)">1500 mm</text>
        </g>
      </g>
    }
  />
);

const SCENES: Record<SceneKey, { Art: React.FC; accent: string }> = {
  roman: { Art: RomanScene, accent: "#d9a66b" },
  roller: { Art: RollerScene, accent: "#60a5fa" },
  mesh: { Art: MeshScene, accent: "#34d399" },
  vertical: { Art: VerticalScene, accent: "#a78bfa" },
  pvc: { Art: PvcScene, accent: "#22d3ee" },
  honeycomb: { Art: HoneycombScene, accent: "#f59e0b" },
  skylight: { Art: SkylightScene, accent: "#38bdf8" },
  wooden: { Art: WoodenScene, accent: "#d97706" },
  zebra: { Art: ZebraScene, accent: "#a8a29e" },
  motor: { Art: MotorScene, accent: "#2dd4bf" },
  measure: { Art: MeasureScene, accent: "#fbbf24" },
};

type Slide = {
  id: number;
  title: string;
  description: string;
  scene: SceneKey;
  features: string[];
};

const Hero: React.FC = () => {
  const { get } = useSiteSettings();
  const [activeSlide, setActiveSlide] = useState(0);
  const [_isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const phoneNumber = get("phone_number") || "+91 9738101408";

  const stats: Stat[] = [
    { value: "500+", label: "Happy Clients", icon: Users },
    { value: "24h", label: "Installation", icon: Zap },
    { value: "5 Years", label: "Warranty", icon: ShieldCheck },
    { value: "4.9", label: "Rating", icon: Star },
  ];

  const slides: Slide[] = [
    {
      id: 1,
      title: "Roman Blinds",
      description: "Soft fabric folds that add a touch of luxury",
      scene: "roman",
      features: ["Luxurious Fabrics", "Soft Folding", "Decorative"],
    },
    {
      id: 8,
      title: "Roller Blinds",
      description: "Perfect light control with premium fabrics",
      scene: "roller",
      features: ["UV Protection", "Remote Control", "Child Safe"],
    },
    {
      id: 2,
      title: "Mosquito Nets",
      description: "Invisible protection with fine mesh",
      scene: "mesh",
      features: ["Fine Mesh", "Easy Cleaning", "Custom Fit"],
    },
    {
      id: 3,
      title: "Vertical Blinds",
      description: "Elegant solutions for large windows",
      scene: "vertical",
      features: ["Space Saving", "Easy Control", "Elegant Look"],
    },
    {
      id: 4,
      title: "PVC Blinds",
      description: "Durable and moisture-resistant, ideal for wet areas",
      scene: "pvc",
      features: ["Waterproof", "Easy Wipe", "Mold Resistant"],
    },
    {
      id: 5,
      title: "Honeycomb Blinds",
      description: "Cellular design for superior thermal insulation",
      scene: "honeycomb",
      features: ["Energy Saving", "Sound Absorbing", "Blackout Options"],
    },
    {
      id: 6,
      title: "Skylight Blinds",
      description: "Specialized control for roof windows and attics",
      scene: "skylight",
      features: ["Thermal Comfort", "Perfect Fit", "Glare Reduction"],
    },
    {
      id: 7,
      title: "Wooden Blinds",
      description: "Classic natural wood for a warm, timeless aesthetic",
      scene: "wooden",
      features: ["Real Wood", "Natural Grain", "Robust Slats"],
    },
    {
      id: 9,
      title: "Zebra Blinds",
      description: "Alternating sheer and solid stripes for modern light control",
      scene: "zebra",
      features: ["Day & Night", "Dual Layer", "Modern Style"],
    },
    {
      id: 10,
      title: "Motorised Solutions",
      description: "Smart automation for effortless convenience",
      scene: "motor",
      features: ["Voice Control", "App Enabled", "Scheduling"],
    },
    {
      id: 11,
      title: "Free Measurement",
      description: "We measure every window on site, down to the millimetre",
      scene: "measure",
      features: ["On-site Visit", "Millimetre Precise", "No Charge"],
    },
  ];

  const current = slides[activeSlide];
  const { Art, accent } = SCENES[current.scene];

  const benefits = [
    {
      icon: Ruler,
      text: "Free Measurement",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      icon: CheckCircle,
      text: "Certified Quality",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      icon: Clock,
      text: "Fast Installation",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      icon: Shield,
      text: "5-Year Warranty",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, SLIDE_MS);
    return () => clearInterval(interval);
  }, [activeSlide]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-white dark:bg-neutral-950 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5 dark:opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-20">
          {/* Instant Help & Consultation Badge */}


          <div className="flex items-center gap-2 mb-5 animate-fade-up">
            {/* Need Help Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
    bg-neutral-100 dark:bg-neutral-900
    border border-neutral-200 dark:border-neutral-800"
            >
              <MailQuestion className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                Need Help?
              </span>
            </div>

            {/* Call Badge */}
            <a
              href={`tel:${phoneNumber}`}
              title={`Call ${phoneNumber}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
      bg-neutral-900 dark:bg-white
      text-white dark:text-neutral-900
      text-xs font-semibold
      hover:bg-neutral-800 dark:hover:bg-neutral-100
      active:scale-95 transition-all shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>Call Now</span>
            </a>
          </div>
          {/* Updated Layout: Stack vertically on mobile, grid on desktop */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content - Now comes first on mobile */}
            <div className="w-full lg:order-1">
              {/* Heading Hierarchy */}
              <div className="mb-6">
                {/* Designer Kicker Pill */}

                <div className="inline-flex items-center gap-2 mb-6 animate-fade-up">
                  <span className="text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase
    text-neutral-900 dark:text-white">
                    Decor Drapes Instyle
                  </span>

                  <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" />

                  <span className="text-[10px] sm:text-xs font-medium tracking-wide
    text-neutral-500 dark:text-neutral-400">
                    Bespoke Window Treatments
                  </span>
                </div>


                {/* Designer Typography Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.035em] leading-[1.08] sm:leading-[1.04] mb-5 animate-fade-up delay-100">
                  <span className="block text-neutral-900 dark:text-white font-display">
                    Transform Your
                  </span>
                  <span className="block font-serif font-normal italic tracking-[-0.015em] text-transparent bg-clip-text bg-gradient-to-r from-neutral-950 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-neutral-400 pt-1">
                    Living Space.
                  </span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl mb-8 font-normal animate-fade-up delay-150">
                  Custom blinds & mosquito nets with precise measurement, expert
                  installation, and comprehensive{" "}
                  <span className="font-semibold text-neutral-900 dark:text-neutral-200 underline decoration-emerald-500/40 decoration-2 underline-offset-4">
                    5-year warranty
                  </span>
                  .
                </p>
              </div>

              {/* Infinite Horizontal Scroll Badges */}
              <div className="relative mb-8 overflow-hidden animate-fade-up delay-200">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent z-10" />

                <div className="flex animate-scroll-horizontal hover:pause-scroll" style={{ width: "max-content" }}>
                  {[0, 1].map((copy) => (
                    <div key={`badge-group-${copy}`} className="flex gap-3 pr-3">
                      {/* Benefits */}
                      {benefits.map((item, index) => (
                        <div
                          key={`benefit-${copy}-${index}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium min-w-max border border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <span>{item.text}</span>
                        </div>
                      ))}

                      {/* Stats */}
                      {stats.map((item, index) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={`stat-${copy}-${index}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold min-w-max border border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${
                              index % 4 === 0
                                ? "text-purple-600 dark:text-purple-400"
                                : index % 4 === 1
                                  ? "text-pink-600 dark:text-pink-400"
                                  : index % 4 === 2
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-teal-600 dark:text-teal-400"
                            }`} />
                            <span className="whitespace-nowrap">
                              {item.value} {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scene animations */}
              <style>{SCENE_CSS}</style>

              {/* Scroll animation */}
              <style>
                {`
                  @keyframes scroll-horizontal {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                  }

                  .animate-scroll-horizontal {
                    animation: scroll-horizontal 40s linear infinite;
                  }

                  .hover\\:pause-scroll:hover {
                    animation-play-state: paused;
                  }
                `}
              </style>

              {/* CTA Buttons - Not full width */}
              <div className="flex flex-nowrap gap-2 sm:gap-3.5 justify-start animate-fade-up delay-250">
                <a href="/products" className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-base bg-[#0fa5e5] text-white font-semibold rounded-full hover:bg-[#0b8fc5] hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95">
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="whitespace-nowrap">View Products</span>
                </a>

                <a href="/estimate" className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-base bg-transparent border border-[#c78d2e] text-[#c78d2e] font-semibold rounded-full hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95">
                  <Quote className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="whitespace-nowrap">Get Free Quote</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </a>

                {/* Call Button - Mobile Visible, Desktop Hidden
                {isMobile && (
                  <a href={`tel:${phoneNumber}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95">
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                )} */}
              </div>
            </div>
            {/* Right Column - Carousel - Comes after content on mobile */}
            <div className="w-full lg:order-2 mt-8 lg:mt-0 animate-fade-up delay-150">
              <div className="relative">
                {/* Stage: the window floats straight on the hero, no card or frame */}
                <div className="relative h-[320px] sm:h-[420px] lg:h-[470px]">
                  <div key={current.id} className="absolute inset-0 animate-scene-glide">
                    {/* Soft colour glow that changes with the product */}
                    <div
                      aria-hidden
                      className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 dark:opacity-30"
                      style={{
                        background: `radial-gradient(closest-side, ${accent}, transparent)`,
                      }}
                    />

                    <div className="relative h-full w-full">
                      <Art />
                    </div>

                    {/* Floating feature chips (tablet and desktop) */}
                    <div className="hidden md:block">
                      {current.features.map((feature, i) => (
                        <span key={feature} className="absolute inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 shadow-lg text-xs xl:text-sm font-medium text-neutral-800 dark:text-neutral-100 animate-chip-float" style={{
                          top: ["14%", "42%", "68%"][i],
                          left: ["2%", "0%", "5%"][i],
                        }}>
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: accent }}
                          />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Caption + arrows */}
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div key={current.id} className="animate-scene-glide">
                      <h3 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white">
                        {current.title}
                      </h3>
                      <p className="mt-1 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md">
                        {current.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 md:hidden">
                        {current.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={prevSlide}
                      aria-label="Previous product"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:shadow-lg transition-all duration-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextSlide}
                      aria-label="Next product"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:shadow-lg transition-all duration-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress dots (active one fills while the slide plays) */}
                <div className="mt-5 flex items-center gap-1.5">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSlide(i)}
                      aria-label={`Show ${s.title}`}
                      className={`relative h-1.5 rounded-full overflow-hidden bg-neutral-300 dark:bg-neutral-700 transition-all duration-300 ${i === activeSlide
                        ? "w-8"
                        : "w-1.5 hover:bg-neutral-400 dark:hover:bg-neutral-500"
                        }`}
                    >
                      {i === activeSlide && (
                        <span className="hs-prog absolute inset-0 bg-neutral-900 dark:bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;