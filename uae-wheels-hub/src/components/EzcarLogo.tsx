interface EzcarLogoProps {
  className?: string;
  variant?: 'header' | 'footer';
}

const EzcarLogo = ({ className, variant = 'header' }: EzcarLogoProps) => {
  const fillColor = variant === 'footer' ? '#FFFFFF' : '#15172E';

  return (
    <svg
      className={className}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      aria-label="EZCAR24 Logo"
    >
      <g transform="translate(0,1024) scale(0.1,-0.1)" fill={fillColor} stroke="none">
        <path d="M5579 6852 c-9 -4 -115 -110 -235 -236 l-219 -229 3 -1281 4 -1281
66 -70 c37 -38 137 -143 224 -232 l158 -163 288 0 288 0 89 93 c49 50 149 153
222 227 l133 136 1 289 1 290 -166 3 -166 2 0 -216 0 -216 -111 -116 c-62 -65
-121 -125 -131 -134 -17 -15 -41 -18 -163 -18 l-143 0 -128 138 c-71 75 -135
141 -141 145 -10 6 -13 243 -13 1130 l0 1122 143 142 142 141 138 1 138 0 134
-137 134 -137 1 -222 0 -223 165 0 165 0 0 301 0 301 -226 228 -226 229 -277
0 c-152 0 -283 -3 -292 -7z"/>
        <path d="M3360 5100 l0 -1750 910 0 c771 0 910 2 903 14 -4 7 -78 88 -163 179
l-155 166 -577 0 -578 1 -2 623 c0 342 -2 634 -3 650 l-2 27 358 0 359 0 0
175 0 175 -355 2 -354 3 -4 558 -5 557 573 0 573 0 164 171 c89 94 167 177
171 185 7 12 -118 14 -903 14 l-910 0 0 -1750z"/>
        <path d="M4792 6067 l-162 -162 0 -800 1 -800 164 -169 165 -168 2 1131 c2
622 1 1131 -2 1131 -3 0 -78 -73 -168 -163z"/>
      </g>
    </svg>
  );
};

export default EzcarLogo;
