// CreateGameScreen.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import CreateGameScreen from "./CreateGameScreen";

describe("CreateGameScreen", () => {
  it("renders the container with background and shows the form", () => {
    const { container } = render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    const root = container.querySelector(".CreateGameScreen");
    expect(root).toBeInTheDocument();

    // Check inline background URL only (JSDOM may omit background-size in style attr)
    const styleAttr = root.getAttribute("style") || "";
    expect(styleAttr).toContain("/Assets/background_pregame.jpg");

    // Sanity: the form from CreateGameForm is mounted
    expect(
      screen.getByRole("heading", { name: /create new game/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create game/i })
    ).toBeInTheDocument();
  });
});
