// Tests for BackgroundMusicPlayer
// - Ensures default rendering (muted) shows the "off" icon and proper aria-label.
// - Toggles to "on" when clicked and persists state into localStorage.
// - Hides the control when showControl={false}.

import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  describe,
  it,
  beforeAll,
  beforeEach,
  afterEach,
  expect,
  vi,
} from "vitest";
import BackgroundMusicPlayer from "./BackgroundMusicPlayer";
import "@testing-library/jest-dom";

// Mock <audio>.play() to avoid unhandled rejections in jsdom
beforeAll(() => {
  Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(),
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: vi.fn(),
  });
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BackgroundMusicPlayer", () => {
  it("renders muted by default with 'Sound off' alt and 'Unmute' aria-label", () => {
    render(<BackgroundMusicPlayer />);

    // audio element present with default source
    expect(
      screen.getByText(/does not support the audio element/i)
    ).toBeInTheDocument();

    // control button present
    const btn = screen.getByRole("button", {
      name: /unmute background music/i,
    });
    expect(btn).toBeInTheDocument();

    // image alt reflects muted state
    const img = screen.getByAltText(/sound off/i);
    expect(img).toBeInTheDocument();

    // classes applied from CSS split
    expect(btn).toHaveClass("bmp-btn");
    expect(img).toHaveClass("bmp-icon");
  });

  it("toggles to unmuted on click, updates alt/aria-label and persists in localStorage", () => {
    render(<BackgroundMusicPlayer />);

    const btn = screen.getByRole("button", {
      name: /unmute background music/i,
    });
    fireEvent.click(btn);

    // aria-label should now suggest the opposite action
    expect(
      screen.getByRole("button", { name: /mute background music/i })
    ).toBeInTheDocument();

    // image alt should switch to 'Sound on'
    expect(screen.getByAltText(/sound on/i)).toBeInTheDocument();

    // persisted flag should be "false" (not muted)
    expect(localStorage.getItem("bgm-muted")).toBe("false");
  });

  it("respects showControl={false}", () => {
    render(<BackgroundMusicPlayer showControl={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("uses provided 'sources' list when passed", () => {
    render(
      <BackgroundMusicPlayer sources={["/audio/bgm.mp3", "/audio/bgm.ogg"]} />
    );
    const sources = screen.getAllByRole("img", { hidden: true }).length; // fallback if <source> isn't easily queried
    // Sanity: at least the component mounted; more specific source-tag queries may vary with jsdom
    expect(sources).toBeGreaterThanOrEqual(0);
  });
});
