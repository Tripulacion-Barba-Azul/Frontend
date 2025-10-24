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
    {
      setId: 1,
      setName: "Hercule Poirot",
      cards: [{ id: 1, name: "Hercule Poirot" }],
    },
    {
      setId: 2,
      setName: "Miss Marple",
      cards: [{ id: 2, name: "Miss Marple" }],
    },
    {
      setId: 3,
      setName: "Mr Satterthwaite",
      cards: [{ id: 3, name: "Mr Satterthwaite" }],
    },
    {
      setId: 4,
      setName: "Parker Pyne",
      cards: [{ id: 4, name: "Parker Pyne" }],
    },
    {
      setId: 5,
      setName: "Lady Eileen Brent",
      cards: [{ id: 5, name: "Lady Eileen Brent" }],
    },
    {
      setId: 6,
      setName: "Tommy Beresford",
      cards: [{ id: 6, name: "Tommy Beresford" }],
    },
    {
      setId: 7,
      setName: "Tuppence Beresford",
      cards: [{ id: 7, name: "Tuppence Beresford" }],
    },
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
    expect(rows.length).toBe(2);

    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(sampleSets.length);
    sampleSets.forEach((s, idx) => {
      expect(items[idx].textContent).toBe(s.setName);
    });
  });

  it("splits into multiple horizontal rows if more than 10 sets", () => {
    const manySets = Array.from({ length: 23 }, (_, i) => ({
      setId: i + 1,
      setName: `Set ${i + 1}`,
      cards: [{ id: i + 1, name: "Hercule Poirot" }],
    }));

    render(<SetsGrid sets={manySets} position="horizontal" />);
    const rows = screen.getAllByRole("list");
    expect(rows.length).toBe(6);
  });

  it("renders vertical columns correctly", () => {
    render(<SetsGrid sets={sampleSets} position="vertical" />);
    const columns = screen.getAllByRole("list");
    expect(columns.length).toBe(2);
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
    expect(rows.length).toBe(3);
    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(10);
  });

  it("renders vertical-left position correctly", () => {
    render(<SetsGrid sets={sampleSets} position="vertical-left" />);
    const columns = screen.getAllByRole("list");
    expect(columns.length).toBe(2);
    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(sampleSets.length);

    const gridDiv = columns[0].closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-vertical-left")).toBe(true);
    expect(gridDiv.getAttribute("data-position")).toBe("vertical-left");
  });

  it("renders vertical-right position correctly", () => {
    render(<SetsGrid sets={sampleSets} position="vertical-right" />);
    const columns = screen.getAllByRole("list");
    expect(columns.length).toBe(2);
    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(sampleSets.length);

    const gridDiv = columns[0].closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-vertical-right")).toBe(true);
    expect(gridDiv.getAttribute("data-position")).toBe("vertical-right");
  });

  it("uses default horizontal position when position is undefined", () => {
    render(<SetsGrid sets={sampleSets} position={undefined} />);
    const rows = screen.getAllByRole("list");
    expect(rows.length).toBe(2);
    const gridDiv = rows[0].closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-horizontal")).toBe(true);
    expect(gridDiv.getAttribute("data-position")).toBe("horizontal");
  });

  it("uses default horizontal position when position is null", () => {
    render(<SetsGrid sets={sampleSets} position={null} />);
    const rows = screen.getAllByRole("list");
    expect(rows.length).toBe(2);
    const gridDiv = rows[0].closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-horizontal")).toBe(true);
    expect(gridDiv.getAttribute("data-position")).toBe("horizontal");
  });

  it("renders nothing when sets prop is undefined", () => {
    const { container } = render(<SetsGrid position="horizontal" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when sets prop is null", () => {
    const { container } = render(<SetsGrid sets={null} position="horizontal" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when sets prop is not an array", () => {
    const { container } = render(<SetsGrid sets="not an array" position="horizontal" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null for unknown position values", () => {
    const { container } = render(<SetsGrid sets={sampleSets} position="unknown-position" />);
    expect(container.firstChild).toBeNull();
  });

  it("handles sets without cards property", () => {
    const setsWithoutCards = [
      { setId: 1, setName: "Set without cards" },
      { setId: 2, setName: "Another set", cards: undefined },
    ];
    render(<SetsGrid sets={setsWithoutCards} position="horizontal" />);
    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe("Set without cards");
    expect(items[1].textContent).toBe("Another set");
  });

  it("handles mixed key scenarios - setId, setName, and index fallback", () => {
    const mixedSets = [
      { setId: 1, setName: "HasId", cards: [] },
      { setName: "NoId", cards: [] },
      { cards: [] }, // no setId, no setName - should use index
    ];
    render(<SetsGrid sets={mixedSets} position="horizontal" />);
    const items = screen.getAllByTestId("mock-viewset");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe("HasId");
    expect(items[1].textContent).toBe("NoId");
    expect(items[2].textContent).toBe(""); // setName is undefined
  });

  it("renders data-position attribute correctly for all positions", () => {
    const positions = ["horizontal", "vertical", "doubleHorizontal", "vertical-left", "vertical-right"];
    
    positions.forEach((pos) => {
      const { container } = render(<SetsGrid sets={sampleSets} position={pos} />);
      const gridDiv = container.querySelector(".sets-grid");
      expect(gridDiv.getAttribute("data-position")).toBe(pos);
      document.body.innerHTML = ""; // Clean up for next iteration
    });
  });

  it("ensures proper chunking behavior with different array sizes", () => {
    // Test with 5 items (should create 2 chunks of 4 and 1)
    const fiveSets = Array.from({ length: 5 }, (_, i) => ({
      setId: i + 1,
      setName: `Set ${i + 1}`,
      cards: [],
    }));
    
    render(<SetsGrid sets={fiveSets} position="horizontal" />);
    const rows = screen.getAllByRole("list");
    expect(rows.length).toBe(2); // 4 + 1 = 2 rows
    
    document.body.innerHTML = "";
    
    // Test with 8 items (should create 2 chunks of 4 each)
    const eightSets = Array.from({ length: 8 }, (_, i) => ({
      setId: i + 1,
      setName: `Set ${i + 1}`,
      cards: [],
    }));
    
    render(<SetsGrid sets={eightSets} position="vertical" />);
    const cols = screen.getAllByRole("list");
    expect(cols.length).toBe(2); // 4 + 4 = 2 columns
  });

  it("renders correct structure for doubleHorizontal with data-position", () => {
    render(<SetsGrid sets={sampleSets} position="doubleHorizontal" />);
    const singleRow = screen.getByRole("list");
    expect(singleRow.classList.contains("sets-single-row")).toBe(true);

    const gridDiv = singleRow.closest(".sets-grid");
    expect(gridDiv.classList.contains("sets-double-horizontal")).toBe(true);
    expect(gridDiv.getAttribute("data-position")).toBe("doubleHorizontal");
  });
});
