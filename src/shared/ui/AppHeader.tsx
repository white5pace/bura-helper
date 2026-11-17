import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

function AppHeader({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <header className={cn("mb-[32px]", className)} onClick={onClick}>
      <div className="flex h-[50px] items-end justify-start gap-2.5">
        <img src={logo} alt="logo" />
        <h1 className="m-0 text-[32px] font-normal tracking-[1px] [font-family:var(--heading)]">
          БурКозел
        </h1>
      </div>
    </header>
  );
}

export default AppHeader;
