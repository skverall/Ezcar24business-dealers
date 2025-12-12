import React, { useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TiresStatus } from '@/types/inspection';
import {
  BodyStatus,
  BODY_PART_KEYS,
  fillForStatus,
  getTireColor,
} from '../types/inspection.types';

interface BodyConditionSectionProps {
  bodyParts: Record<string, BodyStatus>;
  onBodyPartsChange: (parts: Record<string, BodyStatus>) => void;
  tiresStatus: TiresStatus;
  onTireClick: (tire: keyof TiresStatus) => void;
  readOnly?: boolean;
}

const cycleStatus = (status?: BodyStatus): BodyStatus => {
  switch (status) {
    case 'original':
      return 'painted';
    case 'painted':
      return 'putty';
    case 'putty':
      return 'replaced';
    case 'replaced':
      return 'ppf';
    case 'ppf':
      return 'original';
    default:
      return 'original';
  }
};

const getStatusLabel = (status: BodyStatus) => {
  switch (status) {
    case 'original':
      return 'Original';
    case 'painted':
      return 'Painted';
    case 'replaced':
      return 'Replaced';
    case 'putty':
      return 'Body Repair';
    case 'ppf':
      return 'PPF';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: BodyStatus) => {
  switch (status) {
    case 'original':
      return 'bg-zinc-500';
    case 'painted':
      return 'bg-[#EF4444]';
    case 'replaced':
      return 'bg-[#F59E0B]';
    case 'putty':
      return 'bg-[#8B5CF6]';
    case 'ppf':
      return 'bg-[#06b6d4]';
    default:
      return 'bg-zinc-500';
  }
};

export const BodyConditionSection: React.FC<BodyConditionSectionProps> = ({
  bodyParts,
  onBodyPartsChange,
  tiresStatus,
  onTireClick,
  readOnly,
}) => {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const handlePartClick = (part: string) => {
    setSelectedPart(part);
    if (!readOnly) {
      onBodyPartsChange({ ...bodyParts, [part]: cycleStatus(bodyParts[part] as BodyStatus) });
    }
  };

  return (
    <div className="md:col-span-12 lg:col-span-4 xl:col-span-6 lg:order-none">
      <div className="bg-card rounded-2xl border border-border/70 report-card p-4 sm:p-6 relative min-h-[420px] sm:min-h-[600px] flex flex-col items-center justify-start sm:justify-center overflow-hidden group card-print-clean print:min-h-0 print:h-auto print:block print-diagram-container">
        {/* Background Elements - Hidden in print via CSS */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground/5 via-transparent to-transparent opacity-40 print:hidden" />
        <div className="absolute top-4 sm:top-6 left-0 w-full text-center z-10 print:hidden">
          <span className="text-[9px] sm:text-xs font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground/40">
            Interactive Inspection Diagram
          </span>
        </div>

        {/* Main Content Area: Car + Legend Side-by-Side */}
        <div className="relative w-full flex justify-center items-start mt-8 sm:mt-12 print:mt-0 print:flex-row print:items-start print:justify-between print:gap-8">

          {/* SVG Diagram - Reduced Size */}
          <div className="relative w-[65%] sm:w-[60%] max-w-[260px] aspect-[340/700] transform scale-100 transition-transform duration-500 print-diagram-svg print:w-[200px] print:mx-0">
            <svg viewBox="0 0 340 700" className="w-full h-full drop-shadow-2xl filter saturate-[1.1]">
              <defs>
                {/* Premium Metallic Gradient */}
                <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d1d5db" /> {/* gray-300 */}
                  <stop offset="20%" stopColor="#f3f4f6" /> {/* gray-100 */}
                  <stop offset="50%" stopColor="#ffffff" /> {/* white */}
                  <stop offset="80%" stopColor="#f3f4f6" /> {/* gray-100 */}
                  <stop offset="100%" stopColor="#d1d5db" /> {/* gray-300 */}
                </linearGradient>

                {/* Glass Gradient */}
                <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.6" />
                </linearGradient>

                {/* Rim/Chrome Gradient */}
                <linearGradient id="chrome-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>

                {/* Headlight Glow */}
                <filter id="light-glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Shadow Ground */}
              <ellipse cx="170" cy="350" rx="160" ry="330" fill="black" className="opacity-20 blur-2xl" />

              {/* --- TIRES (Underbody) --- */}
              {/* Front Left */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <g
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTireClick('frontLeft');
                    }}
                    className="cursor-pointer hover:brightness-110 transition-all"
                  >
                    <rect x="25" y="140" width="30" height="70" rx="8" fill="#1f2937" />
                    <rect
                      x="25"
                      y="140"
                      width="30"
                      height="70"
                      rx="8"
                      fill={getTireColor(tiresStatus.frontLeft.condition)}
                      className="opacity-40"
                    />
                    {/* Tread Detail */}
                    <path
                      d="M25 150 H55 M25 160 H55 M25 170 H55 M25 180 H55 M25 190 H55 M25 200 H55"
                      stroke="#374151"
                      strokeOpacity="0.5"
                      strokeWidth="1"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold">Front Left</p>
                    <p className="capitalize">{tiresStatus.frontLeft.condition}</p>
                    {tiresStatus.frontLeft.dot && <p>DOT: {tiresStatus.frontLeft.dot}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Front Right */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <g
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTireClick('frontRight');
                    }}
                    className="cursor-pointer hover:brightness-110 transition-all"
                  >
                    <rect x="285" y="140" width="30" height="70" rx="8" fill="#1f2937" />
                    <rect
                      x="285"
                      y="140"
                      width="30"
                      height="70"
                      rx="8"
                      fill={getTireColor(tiresStatus.frontRight.condition)}
                      className="opacity-40"
                    />
                    <path
                      d="M285 150 H315 M285 160 H315 M285 170 H315 M285 180 H315 M285 190 H315 M285 200 H315"
                      stroke="#374151"
                      strokeOpacity="0.5"
                      strokeWidth="1"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold">Front Right</p>
                    <p className="capitalize">{tiresStatus.frontRight.condition}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Rear Left */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <g
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTireClick('rearLeft');
                    }}
                    className="cursor-pointer hover:brightness-110 transition-all"
                  >
                    <rect x="25" y="460" width="30" height="70" rx="8" fill="#1f2937" />
                    <rect
                      x="25"
                      y="460"
                      width="30"
                      height="70"
                      rx="8"
                      fill={getTireColor(tiresStatus.rearLeft.condition)}
                      className="opacity-40"
                    />
                    <path
                      d="M25 470 H55 M25 480 H55 M25 490 H55 M25 500 H55 M25 510 H55 M25 520 H55"
                      stroke="#374151"
                      strokeOpacity="0.5"
                      strokeWidth="1"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold">Rear Left</p>
                    <p className="capitalize">{tiresStatus.rearLeft.condition}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Rear Right */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <g
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTireClick('rearRight');
                    }}
                    className="cursor-pointer hover:brightness-110 transition-all"
                  >
                    <rect x="285" y="460" width="30" height="70" rx="8" fill="#1f2937" />
                    <rect
                      x="285"
                      y="460"
                      width="30"
                      height="70"
                      rx="8"
                      fill={getTireColor(tiresStatus.rearRight.condition)}
                      className="opacity-40"
                    />
                    <path
                      d="M285 470 H315 M285 480 H315 M285 490 H315 M285 500 H315 M285 510 H315 M285 520 H315"
                      stroke="#374151"
                      strokeOpacity="0.5"
                      strokeWidth="1"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold">Rear Right</p>
                    <p className="capitalize">{tiresStatus.rearRight.condition}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* --- MAIN BODY CHASSIS --- */}

              {/* Front Bumper - Curved & Aerodynamic */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 60 110 C 60 110, 170 80, 280 110 C 280 110, 280 70, 250 50 C 200 20, 140 20, 90 50 C 60 70, 60 110, 60 110 Z"
                    fill={fillForStatus(bodyParts.frontBumper || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'frontBumper' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('frontBumper')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Front Bumper: {bodyParts.frontBumper === 'original' ? 'Original' : bodyParts.frontBumper}
                </TooltipContent>
              </Tooltip>

              {/* Hood - Sculpted Lines */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 60 110 C 60 110, 170 80, 280 110 L 270 230 C 270 230, 170 215, 70 230 L 60 110 Z"
                    fill={fillForStatus(bodyParts.hood || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'hood' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('hood')}
                  />
                </TooltipTrigger>
                <TooltipContent>Hood: {bodyParts.hood === 'original' ? 'Original' : bodyParts.hood}</TooltipContent>
              </Tooltip>
              {/* Hood Detail Lines */}
              <path
                d="M 120 120 C 120 120, 130 200, 110 220"
                fill="none"
                stroke="black"
                strokeOpacity="0.05"
                strokeWidth="2"
                className="pointer-events-none"
              />
              <path
                d="M 220 120 C 220 120, 210 200, 230 220"
                fill="none"
                stroke="black"
                strokeOpacity="0.05"
                strokeWidth="2"
                className="pointer-events-none"
              />

              {/* Front Fenders */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 60 110 L 70 230 L 40 220 C 40 220, 25 150, 60 110 Z"
                    fill={fillForStatus(bodyParts.frontLeftFender || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'frontLeftFender' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('frontLeftFender')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Front Left Fender:{' '}
                  {bodyParts.frontLeftFender === 'original' ? 'Original' : bodyParts.frontLeftFender}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 280 110 L 270 230 L 300 220 C 300 220, 315 150, 280 110 Z"
                    fill={fillForStatus(bodyParts.frontRightFender || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'frontRightFender' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('frontRightFender')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Front Right Fender:{' '}
                  {bodyParts.frontRightFender === 'original' ? 'Original' : bodyParts.frontRightFender}
                </TooltipContent>
              </Tooltip>

              {/* Windshield - Glass Effect */}
              <path
                d="M 70 230 C 170 215, 170 215, 270 230 L 260 290 C 170 280, 170 280, 80 290 Z"
                fill="url(#glass-gradient)"
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {/* Roof - Smooth */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 80 290 C 170 280, 170 280, 260 290 L 255 420 C 170 410, 170 410, 85 420 Z"
                    fill={fillForStatus(bodyParts.roof || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'roof' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('roof')}
                  />
                </TooltipTrigger>
                <TooltipContent>Roof: {bodyParts.roof === 'original' ? 'Original' : bodyParts.roof}</TooltipContent>
              </Tooltip>

              {/* Front Doors */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 40 220 L 80 290 L 85 400 L 40 400 C 35 350, 35 300, 40 220 Z"
                    fill={fillForStatus(bodyParts.frontLeftDoor || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'frontLeftDoor' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('frontLeftDoor')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Front Left Door: {bodyParts.frontLeftDoor === 'original' ? 'Original' : bodyParts.frontLeftDoor}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 300 220 L 260 290 L 255 400 L 300 400 C 305 350, 305 300, 300 220 Z"
                    fill={fillForStatus(bodyParts.frontRightDoor || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'frontRightDoor' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('frontRightDoor')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Front Right Door: {bodyParts.frontRightDoor === 'original' ? 'Original' : bodyParts.frontRightDoor}
                </TooltipContent>
              </Tooltip>
              {/* Mirrors */}
              <path d="M 45 230 L 20 225 L 20 245 L 43 245 Z" fill="#374151" />
              <path d="M 295 230 L 320 225 L 320 245 L 297 245 Z" fill="#374151" />

              {/* Rear Doors */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 40 400 L 85 400 L 85 420 L 70 500 L 40 480 C 35 450, 35 420, 40 400 Z"
                    fill={fillForStatus(bodyParts.rearLeftDoor || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'rearLeftDoor' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('rearLeftDoor')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Rear Left Door: {bodyParts.rearLeftDoor === 'original' ? 'Original' : bodyParts.rearLeftDoor}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 300 400 L 255 400 L 255 420 L 270 500 L 300 480 C 305 450, 305 420, 300 400 Z"
                    fill={fillForStatus(bodyParts.rearRightDoor || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'rearRightDoor' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('rearRightDoor')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Rear Right Door: {bodyParts.rearRightDoor === 'original' ? 'Original' : bodyParts.rearRightDoor}
                </TooltipContent>
              </Tooltip>

              {/* Rear Window */}
              <path
                d="M 85 420 C 170 410, 170 410, 255 420 L 265 470 C 170 480, 170 480, 75 470 Z"
                fill="url(#glass-gradient)"
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {/* Trunk */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 75 470 C 170 480, 170 480, 265 470 L 260 580 C 170 590, 170 590, 80 580 Z"
                    fill={fillForStatus(bodyParts.trunk || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'trunk' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('trunk')}
                  />
                </TooltipTrigger>
                <TooltipContent>Trunk: {bodyParts.trunk === 'original' ? 'Original' : bodyParts.trunk}</TooltipContent>
              </Tooltip>

              {/* Rear Fenders */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 70 500 L 80 580 L 50 600 C 40 570, 40 520, 70 500 Z"
                    fill={fillForStatus(bodyParts.rearLeftFender || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'rearLeftFender' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('rearLeftFender')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Rear Left Fender: {bodyParts.rearLeftFender === 'original' ? 'Original' : bodyParts.rearLeftFender}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 270 500 L 260 580 L 290 600 C 300 570, 300 520, 270 500 Z"
                    fill={fillForStatus(bodyParts.rearRightFender || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'rearRightFender' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('rearRightFender')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Rear Right Fender:{' '}
                  {bodyParts.rearRightFender === 'original' ? 'Original' : bodyParts.rearRightFender}
                </TooltipContent>
              </Tooltip>

              {/* Rear Bumper */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d="M 50 600 C 50 600, 170 610, 290 600 L 290 630 C 290 650, 250 670, 170 670 C 90 670, 50 650, 50 630 Z"
                    fill={fillForStatus(bodyParts.rearBumper || 'original')}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    className={cn(
                      'cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury',
                      selectedPart === 'rearBumper' && 'stroke-luxury stroke-[2px]'
                    )}
                    onClick={() => handlePartClick('rearBumper')}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Rear Bumper: {bodyParts.rearBumper === 'original' ? 'Original' : bodyParts.rearBumper}
                </TooltipContent>
              </Tooltip>

              {/* Headlights */}
              <path
                d="M 70 55 L 100 65 L 90 45 Z"
                fill="#fbbf24"
                style={{ filter: 'url(#light-glow)' }}
                className="opacity-80"
              />
              <path
                d="M 270 55 L 240 65 L 250 45 Z"
                fill="#fbbf24"
                style={{ filter: 'url(#light-glow)' }}
                className="opacity-80"
              />

              {/* Taillights */}
              <path d="M 60 620 L 90 615 L 90 630 Z" fill="#ef4444" className="opacity-80" />
              <path d="M 280 620 L 250 615 L 250 630 Z" fill="#ef4444" className="opacity-80" />
            </svg>
          </div>

          {/* Legend - Moved to the Right Side of Car */}
          <div className="flex flex-col gap-3 text-[10px] sm:text-xs text-muted-foreground ml-2 sm:ml-4 pt-20 print:pt-4 print:ml-0 print:text-xs print:font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#EF4444] print:border print:border-black" /> Painted
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F59E0B] print:border print:border-black" /> Replaced
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#8B5CF6] print:border print:border-black" /> Body Repair
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#06b6d4] print:border print:border-black" /> PPF
            </div>
          </div>
        </div>

        {/* Selected Part Info Card - Always Below */}
        <div className="mt-4 min-h-[90px] w-full max-w-[340px] mx-auto relative px-4 z-20 print:hidden">
          <AnimatePresence mode="wait">
            {selectedPart ? (
              <motion.div
                key="selected-part"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="w-full"
              >
                <div className="bg-card p-4 rounded-lg border border-border/70 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5 tracking-wider">
                      Selected Part
                    </div>
                    <div className="font-bold text-base sm:text-lg text-foreground">
                      {BODY_PART_KEYS.find((k) => k.key === selectedPart)?.label || selectedPart}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider shadow-sm',
                      getStatusColor(bodyParts[selectedPart] || 'original')
                    )}
                  >
                    {getStatusLabel(bodyParts[selectedPart] || 'original')}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex items-center justify-center text-muted-foreground text-xs sm:text-sm italic"
              >
                Tap a part to view details
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
