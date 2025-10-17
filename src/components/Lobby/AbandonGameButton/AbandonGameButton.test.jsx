import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import AbandonGameButton from "./AbandonGameButton";

// Mock fetch
global.fetch = vi.fn();

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AbandonGameButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  const defaultProps = {
    isOwner: false,
    playerId: "123",
    gameId: "456",
  };

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <AbandonGameButton {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  it("should not render when player is owner", () => {
    renderComponent({ isOwner: true });
    
    expect(screen.queryByText("Leave Game")).not.toBeInTheDocument();
  });

  it("should render leave game button when player is not owner", () => {
    renderComponent();
    
    expect(screen.getByText("Leave Game")).toBeInTheDocument();
  });

  it("should make API call and navigate to home on successful leave", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    renderComponent();
    
    const leaveButton = screen.getByText("Leave Game");
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/games/456/exit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: 123,
          }),
        }
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should show error message on API failure", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderComponent();
    
    const leaveButton = screen.getByText("Leave Game");
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to leave the game/)).toBeInTheDocument();
    });
    
    // Should not navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should show loading state during API call", async () => {
    // Mock a delayed response
    fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ ok: true, status: 200 }), 100)
      )
    );

    renderComponent();
    
    const leaveButton = screen.getByText("Leave Game");
    fireEvent.click(leaveButton);

    // Should show loading state
    expect(screen.getByText("Leaving...")).toBeInTheDocument();
    expect(screen.getByText("Leaving...")).toBeDisabled();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should prevent multiple clicks while loading", async () => {
    // Mock a delayed response
    fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ ok: true, status: 200 }), 100)
      )
    );

    renderComponent();
    
    const leaveButton = screen.getByText("Leave Game");
    
    // Click multiple times rapidly
    fireEvent.click(leaveButton);
    fireEvent.click(leaveButton);
    fireEvent.click(leaveButton);

    // Should only make one API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle network errors gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    renderComponent();
    
    const leaveButton = screen.getByText("Leave Game");
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to leave the game/)).toBeInTheDocument();
    });
    
    // Should not navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
