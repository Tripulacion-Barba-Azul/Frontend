import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Instructions from "./Instructions";

describe("Instructions (preGame mode)", () => {
  it("renders the launcher button", () => {
    render(<Instructions mode="preGame" />);
    const launcher = screen.getByLabelText(/open instructions/i);
    expect(launcher).toBeInTheDocument();
  });

  it("opens modal with title, arrows and counter", async () => {
    const user = userEvent.setup();
    render(<Instructions mode="preGame" />);

    // Open by clicking the launcher
    await user.click(screen.getByLabelText(/open instructions/i));

    // Dialog and title
    const dialog = screen.getByRole("dialog", { name: /how to play/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/how to play/i)).toBeInTheDocument();

    // Arrows and counter should be visible in preGame
    expect(screen.getByLabelText(/previous image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/next image/i)).toBeInTheDocument();
    expect(screen.getByText(/1\s*\/\s*9/i)).toBeInTheDocument();
  });

  it("navigates slides with arrows and keyboard; closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Instructions mode="preGame" />);

    await user.click(screen.getByLabelText(/open instructions/i));

    // Next arrow -> counter should change to 2 / 9
    await user.click(screen.getByLabelText(/next image/i));
    expect(screen.getByText(/2\s*\/\s*9/i)).toBeInTheDocument();

    // Keyboard left arrow -> back to 1 / 9
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText(/1\s*\/\s*9/i)).toBeInTheDocument();

    // Close with Escape
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: /how to play/i })
    ).not.toBeInTheDocument();
  });

  it("closes when clicking the backdrop (outside the modal)", async () => {
    const user = userEvent.setup();
    const { container } = render(<Instructions mode="preGame" />);
    await user.click(screen.getByLabelText(/open instructions/i));

    const overlay = container.querySelector(".ins-overlay");
    expect(overlay).toBeInTheDocument();

    // Click the overlay to close (component listens onMouseDown)
    await user.click(overlay);
    expect(
      screen.queryByRole("dialog", { name: /how to play/i })
    ).not.toBeInTheDocument();
  });

  it("closes with the X button", async () => {
    const user = userEvent.setup();
    render(<Instructions mode="preGame" />);
    await user.click(screen.getByLabelText(/open instructions/i));

    const closeBtn = screen.getByLabelText(/close/i);
    await user.click(closeBtn);
    expect(
      screen.queryByRole("dialog", { name: /how to play/i })
    ).not.toBeInTheDocument();
  });
});

describe("Instructions (inGame mode)", () => {
  it("renders the launcher and opens a single-image modal without arrows/counter", async () => {
    const user = userEvent.setup();
    render(<Instructions mode="inGame" />);

    await user.click(screen.getByLabelText(/open instructions/i));

    // Dialog + title
    expect(
      screen.getByRole("dialog", { name: /how to play/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/how to play/i)).toBeInTheDocument();

    // No arrows/counter in inGame mode
    expect(screen.queryByLabelText(/previous image/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/next image/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*\d+/i)).not.toBeInTheDocument();

    // The in-game help image is present (alt mentions help)
    const img = screen.getByRole("img", { name: /help/i });
    expect(img).toBeInTheDocument();

    // Close with X
    await user.click(screen.getByLabelText(/close/i));
    expect(
      screen.queryByRole("dialog", { name: /how to play/i })
    ).not.toBeInTheDocument();
  });
});
