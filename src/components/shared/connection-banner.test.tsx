import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectionBanner } from "./connection-banner";

describe("ConnectionBanner", () => {
  it("não presume falha inicial e reage aos eventos de conectividade", () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("status")).toHaveTextContent(/sem conexão/i);
    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
