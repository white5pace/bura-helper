import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div>
      <header>
        <h1>БурКозел</h1>
      </header>
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}

// я вижу страницу на ней header делаем его это иконка и надпись шрифта который уже подключил
// потом кнопки из shadcn начать новую и продолжить
// кнопка начать новая перебрасывает на страницу с выбором участников

export default MainLayout;
