import type { SVGProps } from "react";

/** Minimal inline icons, so the game needs no icon library. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" stroke="none" />
  </Icon>
);

export const RestartIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M2.75 8a5.25 5.25 0 1 0 1.54-3.71" />
    <path d="M2.5 2.5v2.75h2.75" />
  </Icon>
);

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon>
);

export const ArrowIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Icon>
);

export const LinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M6.5 9.5 9.5 6.5" />
    <path d="M7.25 4.75 8.5 3.5a2.83 2.83 0 0 1 4 4l-1.25 1.25" />
    <path d="M8.75 11.25 7.5 12.5a2.83 2.83 0 0 1-4-4l1.25-1.25" />
  </Icon>
);

export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Icon>
);

export const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M8 2.5 14 13H2L8 2.5Z" />
    <path d="M8 6.75v2.5M8 11.25h.01" />
  </Icon>
);
