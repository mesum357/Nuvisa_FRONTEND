import Link from 'next/link';
import { parseHeroDescription } from '@/utils/parseHeroDescription';

const GuaranteeOval = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 620 280"
    aria-hidden="true"
    className="absolute pointer-events-none h-auto sm:h-[200%]"
    style={{
      width: '135%',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }}
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <mask id="guarantee-oval-mask">
        <g transform="matrix(1,0,0,1,-18.687,-10.376)">
          <g transform="matrix(1,0,0,1,320.411,150.613)">
            <path
              fill="white"
              d="M309.216,-11.293 C307.551,21.085 277.486,52.938 209.061,81.44 C202.201,84.296 195.167,86.773 188.044,88.959 C167.086,95.429 131.531,106.503 127.357,107.727 C-32.052,147.098 -206.581,124.134 -253.052,100.587 C-266.743,93.65 -266.188,108.98 -258.774,110.991 C-166.707,150.013 57.534,150.363 178.411,105.774 C293.481,66.81 320.161,22.863 318.176,-19.686 C315.841,-69.579 282.561,-99.508 188.161,-125.737 C99.393,-150.363 -159.614,-147.215 -248.966,-88.085 C-248.966,-88.085 -297.334,-59 -301.071,-20.356 C-305.42,24.553 -288.927,48.101 -225.263,79.458 C-161.599,110.816 -46.268,110.379 -28.315,111.865 C-4.233,113.876 -8.495,100.529 -16.873,100.878 C-186.732,101.519 -249.754,54.191 -269.545,40.582 C-289.336,26.972 -320.161,-22.921 -262.773,-67.655 C-205.385,-112.389 -62.176,-126.669 51.93,-126.669 C157.598,-126.669 229.001,-105.249 262.131,-84.995 C287.291,-69.637 310.586,-50.606 309.216,-11.293z"
            />
          </g>
        </g>
      </mask>
    </defs>
    <g mask="url(#guarantee-oval-mask)">
      <g transform="matrix(1,0,0,1,-48.922,-12.63)">
        <g transform="matrix(1,0,0,1,343.425,178.867)">
          <path
            className="guarantee-oval-stroke"
            pathLength="1"
            fill="none"
            stroke="rgb(85, 51, 222)"
            strokeWidth="26"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeMiterlimit="10"
            d="M20.767,78.349 C20.767,78.349 -150.952,91.853 -242.525,35.688 C-300.177,0.328 -330.925,-79.233 -196.787,-128.045 C-91.477,-166.367 71.105,-159.562 71.105,-159.562 C71.105,-159.562 313.014,-159.443 321.701,-45.794 C330.925,74.892 -47.659,166.367 -289.526,66.645"
          />
        </g>
      </g>
    </g>
  </svg>
);

export default function HeroDescription({ description }) {
  const { isPill, segments, plainText } = parseHeroDescription(description);

  if (!isPill) {
    return plainText;
  }

  return (
    <span className="inline-flex items-center gap-x-1 sm:gap-x-3 gap-y-2 border rounded-4xl px-2 sm:px-3 py-1.5 sm:px-5 sm:py-3">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const content = segment.url ? (
          <span
            className={
              segment.isGuarantee
                ? 'relative inline-block guarantee-wrapper text-nowrap'
                : 'text-nowrap'
            }
            style={segment.isGuarantee ? { overflow: 'visible' } : undefined}
          >
            <Link
              href={segment.url}
              className={`hover:underline decoration-white/50 transition-all text-xs sm:text-xl${
                segment.isGuarantee ? ' relative z-10' : ''
              }`}
            >
              {segment.text}
            </Link>
            {segment.isGuarantee && <GuaranteeOval />}
          </span>
        ) : (
          <span className="text-sm sm:text-xl text-nowrap">{segment.text}</span>
        );

        return (
          <span
            key={`${segment.text}-${index}`}
            className="inline-flex items-center gap-x-1 sm:gap-x-3"
          >
            {content}
            {!isLast && (
              <span className="text-white/50 select-none">I</span>
            )}
          </span>
        );
      })}
    </span>
  );
}
