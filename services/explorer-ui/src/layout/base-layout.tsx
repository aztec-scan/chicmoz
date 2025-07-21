import { type FC, type ReactNode } from "react";
import { cn } from "~/lib/utils";

interface BaseLayoutProps {
  children: ReactNode;
  className?: string;
}

export const BaseLayout: FC<BaseLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("mx-auto px-5 max-w-[1440px] md:px-[70px]", className)}>
      {children}
    </div>
  );
};
