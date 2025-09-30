// ViewMySecretsSync.test.jsx

import { render, screen } from "@testing-library/react";
import ViewMySecretsSync from "./ViewMySecretsSync.jsx";
import * as logic from "./ViewMySecretsLogic.js";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("../../ViewMySecrets/ViewMySecrets.jsx", () => {
  return {
    __esModule: true,
    default: function MockViewMySecrets({ secrets }) {
      return (
        <div data-testid="mock-viewmysecrets">
          {JSON.stringify(secrets)}
        </div>
      );
    },
  };
});

describe("ViewMySecretsSync", () => {
  it("renders empty list if no secrets", () => {
    render(<ViewMySecretsSync allSecrets={[]} playerId={1} />);
    expect(screen.getByTestId("mock-viewmysecrets").textContent).toBe("[]");
  });

  it("filters secrets by playerId", () => {
    const allSecrets = [
      { secretOwnerID: 1, secretName: "murderer", revealed: false },
      { secretOwnerID: 2, secretName: "regular", revealed: true },
    ];

    render(<ViewMySecretsSync allSecrets={allSecrets} playerId={1} />);
    expect(screen.getByTestId("mock-viewmysecrets").textContent).toBe(
      JSON.stringify([{ class: "murderer", revealed: false }])
    );
  });

  it("maps revealed flag correctly", () => {
    const allSecrets = [
      { secretOwnerID: 1, secretName: "accomplice", revealed: 1 },
    ];
    render(<ViewMySecretsSync allSecrets={allSecrets} playerId={1} />);
    expect(screen.getByTestId("mock-viewmysecrets").textContent).toBe(
      JSON.stringify([{ class: "accomplice", revealed: true }])
    );
  });

  it("integrates with computeSecretsState (spy)", () => {
    const spy = vi.spyOn(logic, "computeSecretsState");
    const allSecrets = [
      { secretOwnerID: 1, secretName: "murderer", revealed: false },
    ];

    render(<ViewMySecretsSync allSecrets={allSecrets} playerId={1} />);
    expect(spy).toHaveBeenCalledWith(allSecrets, 1);
    spy.mockRestore();
  });

  it("respects anchorClass prop", () => {
    render(
      <ViewMySecretsSync
        allSecrets={[]}
        playerId={1}
        anchorClass="test-anchor"
      />
    );
    expect(screen.getByTestId("mock-viewmysecrets").parentElement.className).toContain("test-anchor");
  });

  // Extra case inspired by ExamplePageViewMySecrets
  it("handles multiple secrets including other players", () => {
    const allSecrets = [
      { secretOwnerID: 1, secretName: "murderer", revealed: false },
      { secretOwnerID: 1, secretName: "accomplice", revealed: true },
      { secretOwnerID: 2, secretName: "regular", revealed: true },
    ];
    render(<ViewMySecretsSync allSecrets={allSecrets} playerId={1} />);
    expect(screen.getByTestId("mock-viewmysecrets").textContent).toBe(
      JSON.stringify([
        { class: "murderer", revealed: false },
        { class: "accomplice", revealed: true },
      ])
    );
  });
});