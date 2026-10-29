import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("tokens visuais", () => {
  it("centraliza a paleta sóbria, foco e redução de movimento", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toContain("--brand: #a9342b");
    expect(css).toContain("--accent: #d6a34b");
    expect(css).toContain("--background: #f7f7f8");
    expect(css).toContain("--radius-md: 0.5rem");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });
});
