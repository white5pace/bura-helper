import type { ReactNode } from "react";

function SecondHeader({
  actions,
  children,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-[24px] flex items-center py-[4px]">
      <h2 className="m-0 text-[24px] font-bold">{children}</h2>
      {actions}
    </div>
  );
}

export default SecondHeader;
