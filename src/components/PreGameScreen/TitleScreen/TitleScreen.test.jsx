import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import TitleScreen from "./TitleScreen";

describe("TitleScreen", () => {
  it("renders the main title", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );
    // We don't assert the exact text to avoid failing on minor copy changes.
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it("renders the 'Create Game' button", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );
    expect(screen.getByText("Create Game")).toBeInTheDocument();
  });

  it("renders the 'Join Game' button", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );
    expect(screen.getByText("Join Game")).toBeInTheDocument();
  });

  it("renders the Instructions launcher (bottom-right icon)", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );
    // The launcher button has an accessible label set in Instructions.jsx
    const launcher = screen.getByLabelText(/open instructions/i);
    expect(launcher).toBeInTheDocument();
  });

  it("opens the Instructions modal in preGame mode with arrows and counter", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );

    // Open the modal by clicking the launcher
    const launcher = screen.getByLabelText(/open instructions/i);
    await user.click(launcher);

    // Modal dialog should be visible with the correct accessible name
    const dialog = screen.getByRole("dialog", { name: /how to play/i });
    expect(dialog).toBeInTheDocument();

    // Title text inside the modal
    expect(screen.getByText(/how to play/i)).toBeInTheDocument();

    // In preGame mode we should have both arrows and the counter
    const prevArrow = screen.getByLabelText(/previous image/i);
    const nextArrow = screen.getByLabelText(/next image/i);
    expect(prevArrow).toBeInTheDocument();
    expect(nextArrow).toBeInTheDocument();

    // Counter "1 / 9" should be visible initially
    expect(screen.getByText(/1\s*\/\s*9/i)).toBeInTheDocument();

    // Close modal via the close (X) button
    const closeBtn = screen.getByLabelText(/close/i);
    await user.click(closeBtn);
    expect(
      screen.queryByRole("dialog", { name: /how to play/i })
    ).not.toBeInTheDocument();
  });
});
