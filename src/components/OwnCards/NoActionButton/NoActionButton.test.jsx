import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import NoActionButton from "./NoActionButton";

// Mock fetch
global.fetch = vi.fn();

// Mock react-router-dom hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ gameId: "123" }),
    useSearchParams: () => [new URLSearchParams("playerId=1")]
  };
});

const renderComponent = (component) => {
  return render(component);
};

describe("NoActionButton", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders no action button correctly", () => {
    renderComponent(<NoActionButton />);
    
    expect(screen.getByRole("button", { name: /play nothing/i })).toBeInTheDocument();
  });

  test("calls API successfully when button is clicked", async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderComponent(<NoActionButton />);
    
    const button = screen.getByRole("button", { name: /play nothing/i });
    await user.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/play/123/actions/play-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: [],
          playerId: "1",
        }),
      });
    });

    // Verify button returns to normal state after successful request
    expect(screen.getByRole("button", { name: /play nothing/i })).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  test("shows error message when API call fails", async () => {
    const user = userEvent.setup();
    fetch.mockRejectedValueOnce(new Error("Network error"));

    renderComponent(<NoActionButton />);
    
    const button = screen.getByRole("button", { name: /play nothing/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Failed to perform no action")).toBeInTheDocument();
    });

    // Verify no additional actions are performed
    expect(button).not.toBeDisabled();
  });

  test("shows loading state when request is in progress", async () => {
    const user = userEvent.setup();
    fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderComponent(<NoActionButton />);
    
    const button = screen.getByRole("button", { name: /play nothing/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /processing/i })).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  test("handles non-ok response status", async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    renderComponent(<NoActionButton />);
    
    const button = screen.getByRole("button", { name: /play nothing/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Failed to perform no action")).toBeInTheDocument();
    });

    // Verify no additional actions are performed
    expect(button).not.toBeDisabled();
  });
});
