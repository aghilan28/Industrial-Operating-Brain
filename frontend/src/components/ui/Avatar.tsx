import * as React from "react";
import { cn } from "@/utils/cn";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  grayscale?: boolean;
}

const SIZES = {
  sm: "h-8 w-8 text-[0.65rem]",
  md: "h-9 w-9 text-xs",
  lg: "h-10 w-10 text-sm",
};

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, src, alt = "", initials, size = "md", grayscale = false, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-950 bg-zinc-800 text-zinc-300 font-sans",
          SIZES[size],
          className
        )}
        {...props}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className={cn("h-full w-full object-cover", grayscale && "grayscale")}
          />
        ) : (
          <span className="font-medium">{initials}</span>
        )}
      </span>
    );
  }
);
Avatar.displayName = "Avatar";

/**
 * AvatarStack — overlapping avatar group used for session/team previews.
 */
export const AvatarStack: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("flex -space-x-2", className)} {...props}>
    {children}
  </div>
);
