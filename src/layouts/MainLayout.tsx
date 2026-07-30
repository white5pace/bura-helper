import { Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import styles from "./MainLayout.module.css";

function MainLayout() {
  const navigate = useNavigate();

  return (
    <div className={styles["container"]}>
      <header className={styles["header"]} onClick={() => navigate("/")}>
        <div className={styles["logo"]}>
          <img src={logo} alt="logo" />
          <h1 className={styles["logo-text"]}>БурКозел</h1>
        </div>
      </header>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
