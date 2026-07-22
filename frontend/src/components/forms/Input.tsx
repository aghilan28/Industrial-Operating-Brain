import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leading, trailing, containerClassName, ...props }, ref) => {
    const hasLeading = Boolean(leading);
    const hasTrailing = Boolean(trailing);
    return (
      <div className={cn("relative", containerClassName)}>
        {hasLeading && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "h-12 w-full rounded-xl border border-white/10 bg-black/40 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/80 transition-colors focus-ring",
            hasLeading && "pl-11",
            hasTrailing && "pr-11",
            !hasLeading && "pl-4",
            !hasTrailing && "pr-4",
            className
          )}
          style={{ boxShadow: tokens.shadows.input }}
          {...props}
        />
        {hasTrailing && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {trailing}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <Input ref={ref} type="search" {...props} />
);
SearchInput.displayName = "SearchInput";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/80 transition-colors resize-y min-h-[6rem] focus-ring",
        className
      )}
      style={{ boxShadow: tokens.shadows.input }}
      {...props}
    />
  )
);
TextArea.displayName = "TextArea";
