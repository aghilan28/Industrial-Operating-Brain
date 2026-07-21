import * as React from "react";
import { cn } from "@/utils/cn";

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/** Spinner — subtle light-on-dark ring spinner. */
export const Spinner: React.FC<SpinnerProps> = ({
  className,
  size = 20,
  ...props
}) => (
  <svg
    aria-hidden="true"
    role="status"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={cn("animate-spin text-zinc-500", className)}
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="2"
    />
    <path
      d="M22 12a10 10 0 0 1-10 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
