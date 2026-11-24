import { Outlet, useNavigate } from "react-router-dom";
import AppHeader from "@/shared/ui/AppHeader";

function MainLayout() {
  const navigate = useNavigate();

  return (
    <div className="box-border flex min-h-0 flex-1 flex-col p-[16px]">
      <AppHeader className="cursor-pointer" onClick={() => navigate("/")} />
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
