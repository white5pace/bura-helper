import { Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

function MainLayout() {
  const navigate = useNavigate();

  return (
    <div className="box-border flex min-h-0 flex-1 flex-col p-[16px]">
      <header className="mb-[32px] cursor-pointer" onClick={() => navigate("/")}>
        <div className="flex h-[50px] items-end justify-start gap-2.5">
          <img src={logo} alt="logo" />
          <h1 className="m-0 text-[32px] font-normal tracking-[1px] [font-family:var(--heading)]">
            БурКозел
          </h1>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
