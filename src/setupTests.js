// src/setupTests.js
import { expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// jest-dom matchers (toBeInTheDocument, etc.)
expect.extend(matchers);

// matchMedia mock (evita errores en componentes que lo usen)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// fetch mock global (cómodo; puedes sobreescribir en cada test)
global.fetch = vi.fn();
