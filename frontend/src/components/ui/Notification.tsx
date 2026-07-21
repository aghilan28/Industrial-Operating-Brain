import * as React from "react";
import { cn } from "@/utils/cn";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  unread?: boolean;
}

export interface NotificationProps extends React.HTMLAttributes<HTMLDivElement> {
  item: NotificationItem;
}

/** Single notification row (used in dropdowns/lists). */
export const Notification: React.FC<NotificationProps> = ({
  item,
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex items-start gap-3 rounded-lg p-3 transition hover:bg-white/5",
      item.unread && "bg-white/[0.02]",
      className
    )}
    {...props}
  >
    <span
      className={cn(
        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
        item.unread ? "bg-indigo-400" : "bg-zinc-600"
      )}
    />
    <div className="flex-1 min-w-0">
      <p className="truncate text-xs font-medium text-zinc-200 font-sans">
        {item.title}
      </p>
      {item.description && (
        <p className="mt-0.5 line-clamp-2 text-[0.7rem] leading-4 text-zinc-500 font-sans">
          {item.description}
        </p>
      )}
      {item.time && (
        <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-zinc-600 font-sans">
          {item.time}
        </p>
      )}
    </div>
  </div>
);
