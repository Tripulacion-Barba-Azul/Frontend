import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SetsGrid from "./SetsGrid.jsx";

// Mock ViewSet to just render a placeholder with setName
vi.mock("./ViewSet/ViewSet.jsx", () => {
  return {
    default: ({ setName }) => <div data-testid="mock-viewset">{setName}</div>,
  };
});

describe("SetsGrid component", () => {
  const sampleSets = [
    { setId: 1, setName: "Hercule Poirot", cards: [{ id: 1, name: "Hercule Poirot" }] },
    { setId: 2, setName: "Miss Marple", cards: [{ id: 2, name: "Miss Marple" }] },
    { setId: 3, setName: "Mr Satterthwaite", cards: [{ id: 3, name: "Mr Satterthwaite" }] },
    { setId: 4, setName: "Parker Pyne", cards: [{ id: 4, name: "Parker Pyne" }] },
    { setId: 5, setName: "Lady Eileen Brent", cards: [{ id: 5, name: "Lady Eileen Brent" }] },
    { setId: 6, setName: "Tommy Beresford", cards: [{ id: 6, name: "Tommy Beresford" }] },
    { setId: 7, setName: "Tuppence Beresford", cards: [{ id: 7, name: "Tuppence Beresford" }] },
  ];

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nothing if sets array is empty", () => {
    const { container } = render(<SetsGrid sets={[]} position="horizontal" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders horizontal rows correctly", () => {
    render(<SetsGrid sets={sampleSets} position="horizontal" />);
    const rows = screen.getAllByRole("list"); // each row is role=list
    expect(rows.length).toBe(1); // 7 < 10, so one row

    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(sampleSets.length);
    sampleSets.forEach((s, idx) => {
      expect(items[idx].textContent).toBe(s.setName);
    });

    const gridDiv = screen.getByRole("list").closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-horizontal")).toBe(true);
  });

  it("splits into multiple horizontal rows if more than 10 sets", () => {
    const manySets = Array.from({ length: 23 }, (_, i) => ({
      setId: i + 1,
      setName: `Set ${i + 1}`,
      cards: [{ id: i + 1, name: "Hercule Poirot" }],
    }));

    render(<SetsGrid sets={manySets} position="horizontal" />);
    const rows = screen.getAllByRole("list");
    expect(rows.length).toBe(3); // 10 + 10 + 3
  });

  it("renders vertical columns correctly", () => {
    render(<SetsGrid sets={sampleSets} position="vertical" />);
    const columns = screen.getAllByRole("list");
    expect(columns.length).toBe(1); // 7 < 10, one column
    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(sampleSets.length);

    const gridDiv = columns[0].closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-vertical")).toBe(true);
  });

  it("renders doubleHorizontal correctly as single horizontal strip", () => {
    render(<SetsGrid sets={sampleSets} position="doubleHorizontal" />);
    const singleRow = screen.getByRole("list");
    expect(singleRow.classList.contains("sets-single-row")).toBe(true);

    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(sampleSets.length);

    const gridDiv = singleRow.closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-double-horizontal")).toBe(true);
  });

  it("uses setId as key if available, otherwise setName or index", () => {
    const setsWithNoId = [
      { setName: "NoIdSet1", cards: [{ id: 1, name: "Hercule Poirot" }] },
      { setName: "NoIdSet2", cards: [{ id: 2, name: "Miss Marple" }] },
    ];
    render(<SetsGrid sets={setsWithNoId} position="horizontal" />);
    const items = screen.getAllByTestId("mock-viewset");
    expect(items[0].textContent).toBe("NoIdSet1");
    expect(items[1].textContent).toBe("NoIdSet2");
  });

  it("renders correctly with exactly 10 items in a horizontal row", () => {
    const tenSets = Array.from({ length: 10 }, (_, i) => ({
      setId: i + 1,
      setName: `Set ${i + 1}`,
      cards: [{ id: i + 1, name: "Hercule Poirot" }],
    }));
    render(<SetsGrid sets={tenSets} position="horizontal" />);
    const rows = screen.getAllByRole("list");
    expect(rows.length).toBe(1); 
    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(10);
  });
});
