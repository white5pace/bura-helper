import type { ReactNode } from "react";

function PageLayout({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {children}
      {footer ? <div className="mt-auto w-full shrink-0">{footer}</div> : null}
    </div>
  );
}

export default PageLayout;
