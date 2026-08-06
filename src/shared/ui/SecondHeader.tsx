import type { ReactNode } from "react";

function SecondHeader({
  actions,
  children,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-[32px] flex">
      <h2 className="m-0!">{children}</h2>
      {actions}
    </div>
  );
}

export default SecondHeader;
