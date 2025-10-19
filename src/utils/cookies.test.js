import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCookie } from "./cookies";

/**
 * We mock the document.cookie getter per test to fully control the cookie string.
 * This avoids relying on jsdom's cookie setter semantics.
 */
let cookieGetSpy;

beforeEach(() => {
  vi.restoreAllMocks();
  cookieGetSpy = vi.spyOn(document, "cookie", "get");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getCookie()", () => {
  it("returns null when cookie name is missing", () => {
    cookieGetSpy.mockReturnValue("foo=bar; baz=qux");
    expect(getCookie("missing")).toBeNull();
  });

  it("returns decoded value for URI-encoded cookie", () => {
    // Encoded JSON: [{"a":1}]
    const encoded = "%5B%7B%22a%22%3A1%7D%5D";
    cookieGetSpy.mockReturnValue(`data=${encoded}; other=1`);
    const val = getCookie("data");
    expect(val).toBe('[{"a":1}]');
  });

  it("handles values containing '=' characters", () => {
    // Token-like cookie values commonly contain '=' padding
    cookieGetSpy.mockReturnValue("token=abc=123==; foo=bar");
    const val = getCookie("token");
    expect(val).toBe("abc=123==");
  });

  it("returns raw value if decodeURIComponent throws (malformed encoding)", () => {
    // Incomplete percent-encoding should throw URIError inside decodeURIComponent
    cookieGetSpy.mockReturnValue("weird=%E0%A4; x=1");
    const val = getCookie("weird");
    expect(val).toBe("%E0%A4");
  });

  it("works when the target cookie is first or last in the string", () => {
    cookieGetSpy.mockReturnValue(
      "alpha=1; beta=2; playersGames=%5B%7B%22gameId%22%3A1%7D%5D"
    );
    expect(getCookie("alpha")).toBe("1");
    expect(getCookie("beta")).toBe("2");
    expect(getCookie("playersGames")).toBe('[{"gameId":1}]');

    cookieGetSpy.mockReturnValue("playersGames=%5B%5D; x=1; y=2");
    expect(getCookie("playersGames")).toBe("[]");

    cookieGetSpy.mockReturnValue(
      "x=1; y=2; playersGames=%5B%7B%22k%22%3A3%7D%5D"
    );
    expect(getCookie("playersGames")).toBe('[{"k":3}]');
  });
});
