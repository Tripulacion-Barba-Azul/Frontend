// CreateGameScreen.test.jsx
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
import CreateGameScreen from "./CreateGameScreen";

/* ===========================
   ✅ Mocks SEGUROS (hoisted)
   =========================== */
const { navigateMock, avatarPickerId, generalMapsId } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  // IDs ABSOLUTOS que coinciden con los imports de CreateGameForm.jsx
  avatarPickerId: new URL(
    "../../AvatarPicker/AvatarPicker.jsx",
    import.meta.url
  ).pathname,
  generalMapsId: new URL("../../generalMaps.js", import.meta.url).pathname,
}));

// Mock de react-router-dom (solo useNavigate)
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

// Mock de AvatarPicker EXACTO al ID resuelto
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

// Mock de AVATAR_MAP con el ID absoluto
vi.mock(generalMapsId, () => ({
  AVATAR_MAP: { 1: "/avatars/1.png", 2: "/avatars/2.png", 3: "/avatars/3.png" },
}));

/* Utilidad para promesas diferidas (para fetch) */
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  if (global.fetch) global.fetch = undefined;
});

describe("CreateGameScreen + CreateGameForm (integrado)", () => {
  it("renderiza el contenedor con fondo y el formulario", () => {
    const { container } = render(<CreateGameScreen />);

    const root = container.querySelector(".CreateGameScreen");
    expect(root).toBeInTheDocument();

    const styleAttr = root.getAttribute("style") || "";
    expect(styleAttr).toContain("/Assets/background_pregame.jpg");
    expect(root).toHaveStyle({ backgroundSize: "cover" });

    // Cabecera y botón de submit del form
    expect(
      screen.getByRole("heading", { name: /Create New Game/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Game/i })
    ).toBeInTheDocument();
  });

  it("valida y evita enviar si hay datos inválidos", async () => {
    render(<CreateGameScreen />);

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

    global.fetch = vi.fn(); // no debería llamarse
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(await screen.findByText(/must have a name/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/between\s*2\s*and\s*6/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/you must have a name/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be in the future/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("muestra errores de consistencia cuando MinPlayers > MaxPlayers", () => {
    render(<CreateGameScreen />);

    fireEvent.change(screen.getByLabelText(/min(imum)? players/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/max(imum)? players/i), {
      target: { value: "3" },
    });

    global.fetch = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(screen.getByText(/inconsistent with max/i)).toBeInTheDocument();
    expect(screen.getByText(/inconsistent with min/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("permite elegir avatar con el AvatarPicker mock y actualiza el preview", () => {
    render(<CreateGameScreen />);

    // Abre el picker
    fireEvent.click(screen.getByRole("button", { name: /choose/i }));

    // Ahora SI debería estar nuestro mock
    const picker = screen.getByTestId("mock-avatar-picker");
    expect(picker).toBeInTheDocument();

    // Seleccionamos #2
    fireEvent.click(within(picker).getByRole("button", { name: /pick #2/i }));

    // El picker se cierra
    expect(screen.queryByTestId("mock-avatar-picker")).not.toBeInTheDocument();

    // El preview debe apuntar al AVATAR_MAP[2]
    const previewImg = screen.getByAltText(/selected avatar/i);
    expect(previewImg).toHaveAttribute("src", "/avatars/2.png");
  });

  it("envía con datos válidos, bloquea la UI y navega (éxito)", async () => {
    render(<CreateGameScreen />);

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

    const submitBtn = screen.getByRole("button", { name: /create game/i });
    const chooseBtn = screen.getByRole("button", { name: /choose/i });

    fireEvent.click(submitBtn);

    // Bloqueo de UI
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveAttribute("aria-busy", "true");
    expect(chooseBtn).toBeDisabled();

    // No doble envío
    fireEvent.click(submitBtn);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    d.resolve({ ok: true, json: async () => ({ gameId: 123, ownerId: 45 }) });
    await Promise.resolve();
    await Promise.resolve();

    expect(navigateMock).toHaveBeenCalledWith("/game/123?playerId=45");
  });

  it("ante error HTTP navega a '/'", async () => {
    render(<CreateGameScreen />);

    const d = deferred();
    global.fetch = vi.fn().mockImplementation(() => d.promise);

    fireEvent.click(screen.getByRole("button", { name: /create game/i }));
    d.resolve({ ok: false, status: 500, statusText: "Server Error" });

    await Promise.resolve();
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
