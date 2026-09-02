import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "@/components/ui/button";

const ICON_SIZE_MD_CLASS = "[&_svg:not([class*='size-'])]:size-[18px]";
const ICON_SIZE_LG_CLASS = "[&_svg:not([class*='size-'])]:size-6";
const ICON_SIZE_XL_CLASS = "[&_svg:not([class*='size-'])]:size-full";

describe("buttonVariants", () => {
  it("применяет iconSize md по умолчанию", () => {
    const classes = buttonVariants({});

    expect(classes).toContain(ICON_SIZE_MD_CLASS);
    expect(classes).not.toContain(ICON_SIZE_LG_CLASS);
    expect(classes).not.toContain(ICON_SIZE_XL_CLASS);
  });

  it("применяет классы iconSize lg", () => {
    const classes = buttonVariants({ iconSize: "lg" });

    expect(classes).toContain(ICON_SIZE_LG_CLASS);
    expect(classes).not.toContain(ICON_SIZE_MD_CLASS);
    expect(classes).not.toContain(ICON_SIZE_XL_CLASS);
  });

  it("применяет классы iconSize xl", () => {
    const classes = buttonVariants({ iconSize: "xl" });

    expect(classes).toContain(ICON_SIZE_XL_CLASS);
    expect(classes).not.toContain(ICON_SIZE_MD_CLASS);
    expect(classes).not.toContain(ICON_SIZE_LG_CLASS);
  });

  it("сочетает iconSize с другими вариантами", () => {
    const classes = buttonVariants({
      variant: "outline",
      size: "icon-lg",
      iconSize: "xl",
    });

    expect(classes).toContain("size-9");
    expect(classes).toContain(ICON_SIZE_XL_CLASS);
    expect(classes).toContain("border-border");
  });

  it("применяет iconSize к размеру icon", () => {
    const classes = buttonVariants({ size: "icon", iconSize: "xl" });

    expect(classes).toContain("size-8");
    expect(classes).toContain(ICON_SIZE_XL_CLASS);
    expect(classes).not.toContain(ICON_SIZE_MD_CLASS);
  });

  it("добавляет iconSize поверх svg-размера из size", () => {
    const classes = buttonVariants({ size: "sm", iconSize: "lg" });

    expect(classes).toContain("[&_svg:not([class*='size-'])]:size-3.5");
    expect(classes).toContain(ICON_SIZE_LG_CLASS);
    expect(classes).not.toContain(ICON_SIZE_MD_CLASS);
  });
});

describe("Button", () => {
  it("рендерит с iconSize md по умолчанию", () => {
    render(<Button>Действие</Button>);

    const button = screen.getByRole("button", { name: "Действие" });

    expect(button.className).toContain(ICON_SIZE_MD_CLASS);
  });

  it("рендерит с iconSize lg", () => {
    render(<Button iconSize="lg">Действие</Button>);

    const button = screen.getByRole("button", { name: "Действие" });

    expect(button.className).toContain(ICON_SIZE_LG_CLASS);
    expect(button.className).not.toContain(ICON_SIZE_MD_CLASS);
  });

  it("рендерит с iconSize xl", () => {
    render(<Button iconSize="xl">Действие</Button>);

    const button = screen.getByRole("button", { name: "Действие" });

    expect(button.className).toContain(ICON_SIZE_XL_CLASS);
    expect(button.className).not.toContain(ICON_SIZE_MD_CLASS);
  });

  it("пробрасывает iconSize на кнопку с иконкой", () => {
    render(
      <Button iconSize="lg" aria-label="Удалить">
        <svg data-testid="icon" />
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Удалить" });

    expect(button.className).toContain(ICON_SIZE_LG_CLASS);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("пробрасывает iconSize на icon-кнопку", () => {
    render(
      <Button size="icon" iconSize="xl" aria-label="Настройки">
        <svg data-testid="icon" />
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Настройки" });

    expect(button.className).toContain("size-8");
    expect(button.className).toContain(ICON_SIZE_XL_CLASS);
    expect(button.className).not.toContain(ICON_SIZE_MD_CLASS);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("сохраняет iconSize при переданном className", () => {
    render(
      <Button iconSize="lg" className="mt-2">
        Действие
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Действие" });

    expect(button.className).toContain("mt-2");
    expect(button.className).toContain(ICON_SIZE_LG_CLASS);
    expect(button.className).not.toContain(ICON_SIZE_MD_CLASS);
  });
});
