// CreateGameForm.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";

/* ===========================
   Safe hoisted mocks (paths match the real imports)
   This test MUST live next to CreateGameForm.jsx
   =========================== */
const { navigateMock, avatarPickerId, generalMapsId } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  // CreateGameForm imports:
  //   import AvatarPicker from "../../AvatarPicker/AvatarPicker";
  //   import { AVATAR_MAP } from "../../../generalMaps";
  avatarPickerId: new URL(
    "../../AvatarPicker/AvatarPicker.jsx",
    import.meta.url
  ).pathname,
  generalMapsId: new URL("../../../generalMaps.js", import.meta.url).pathname,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock(avatarPickerId, () => ({
  __esModule: true,
  default: ({ isOpen, onSelect, onClose }) =>
    isOpen ? (
      <div data-testid="mock-avatar-picker">
        <button
          type="button"
          onClick={() => {
            onSelect(2);
            onClose?.();
          }}
        >
          Pick #2
        </button>
      </div>
    ) : null,
}));

vi.mock(generalMapsId, () => ({
  AVATAR_MAP: { 1: "/avatars/1.png", 2: "/avatars/2.png", 3: "/avatars/3.png" },
}));

// Import AFTER mocks
import CreateGameForm from "./CreateGameForm";

/* Helpers */
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const getPreviewImg = () =>
  screen.queryByAltText(/selected avatar/i) || screen.getAllByRole("img")[0];

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  if (global.fetch) global.fetch = undefined;
});

describe("CreateGameForm (simple & robust)", () => {
  it("renders main fields and actions", () => {
    render(<CreateGameForm />);

    expect(screen.getByLabelText(/game name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min(imum)? players/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max(imum)? players/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your birthday/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /choose/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create game/i })
    ).toBeInTheDocument();
  });

  it("blocks submission with invalid inputs (no fetch, no navigation)", async () => {
    render(<CreateGameForm />);

    // Intentionally invalid values
    fireEvent.change(screen.getByLabelText(/game name/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/min(imum)? players/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText(/max(imum)? players/i), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "" },
    });

    const future = new Date();
    future.setDate(future.getDate() + 1);
    fireEvent.change(screen.getByLabelText(/your birthday/i), {
      target: { value: future.toISOString().slice(0, 10) },
    });

    global.fetch = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    // Simple & robust: just ensure no side-effect happened
    await Promise.resolve();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("blocks when MinPlayers > MaxPlayers (no fetch, no navigation)", () => {
    render(<CreateGameForm />);

    fireEvent.change(screen.getByLabelText(/min(imum)? players/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/max(imum)? players/i), {
      target: { value: "3" },
    });

    global.fetch = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("opens AvatarPicker and updates the preview image", () => {
    render(<CreateGameForm />);

    // Before: default avatar 1
    const before = getPreviewImg();
    expect(before).toHaveAttribute("src", "/avatars/1.png");

    // Open picker and pick #2 (mock)
    fireEvent.click(screen.getByRole("button", { name: /choose/i }));
    const picker = screen.getByTestId("mock-avatar-picker");
    expect(picker).toBeInTheDocument();
    fireEvent.click(within(picker).getByRole("button", { name: /pick #2/i }));

    // Picker closes and preview updates to avatar 2
    expect(screen.queryByTestId("mock-avatar-picker")).not.toBeInTheDocument();

    const after = getPreviewImg();
    expect(after).toHaveAttribute("src", "/avatars/2.png");
  });

  it("submits once with valid data, locks UI and navigates on success", async () => {
    render(<CreateGameForm />);

    fireEvent.change(screen.getByLabelText(/game name/i), {
      target: { value: "MyGame" },
    });
    fireEvent.change(screen.getByLabelText(/min(imum)? players/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/max(imum)? players/i), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText(/your birthday/i), {
      target: { value: "1990-01-01" },
    });

    const d = deferred();
    global.fetch = vi.fn().mockImplementation(() => d.promise);

    const submit = screen.getByRole("button", { name: /create game/i });
    const choose = screen.getByRole("button", { name: /choose/i });

    fireEvent.click(submit);

    // Locked while pending
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");
    expect(choose).toBeDisabled();

    // No double submit
    fireEvent.click(submit);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Success response
    d.resolve({ ok: true, json: async () => ({ gameId: 123, ownerId: 45 }) });
    await Promise.resolve();
    await Promise.resolve();

    expect(navigateMock).toHaveBeenCalledWith("/game/123?playerId=45");
  });

  it("navigates to '/' on HTTP error", async () => {
    render(<CreateGameForm />);

    const d = deferred();
    global.fetch = vi.fn().mockImplementation(() => d.promise);

    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    d.resolve({ ok: false, status: 500, statusText: "Server Error" });
    await Promise.resolve();

    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
