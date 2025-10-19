import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import BackToHomeButton from "./BackToHomeButton.jsx";

// Mock useNavigate from react-router-dom
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
});

describe("BackToHomeButton", () => {
  it("renders the button with the icon and expected classes/attributes", () => {
    const { getByRole, container } = render(<BackToHomeButton />);

    // Button exists and has the styling class
    const btn = getByRole("button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass("BackToHomeButton");
    expect(btn).toHaveAttribute("type", "button");

    // Icon image exists with correct class and decorative alt=""
    const img = container.querySelector("img.BackToHomeButton__icon");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toBe("/Icons/exit.png");
    expect(img).toHaveAttribute("alt", "");
  });

  it('navigates to "/" when clicked', () => {
    const { getByRole } = render(<BackToHomeButton />);
    const btn = getByRole("button");
    fireEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
