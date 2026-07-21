import * as React from "react";
import { cn } from "@/utils/cn";

/** Styled table primitives matching the dark zinc / indigo panel language. */

export const TableContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full overflow-x-auto rounded-xl border border-white/10",
      className
    )}
    style={{ background: "rgba(0,0,0,0.35)" }}
    {...props}
  >
    <table className="w-full caption-bottom text-sm">{children}</table>
  </div>
));
TableContainer.displayName = "TableContainer";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b border-white/10 bg-white/[0.02]", className)}
    {...props}
  >
    {children}
  </thead>
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  >
    {children}
  </tbody>
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, children, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-white/5 transition-colors hover:bg-white/[0.03]",
      className
    )}
    {...props}
  >
    {children}
  </tr>
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle text-[0.68rem] font-sans font-medium uppercase tracking-widest text-zinc-500",
      className
    )}
    {...props}
  >
    {children}
  </th>
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle text-xs font-sans text-zinc-300",
      className
    )}
    {...props}
  >
    {children}
  </td>
));
TableCell.displayName = "TableCell";
