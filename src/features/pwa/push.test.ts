import { describe, expect, it } from "vitest";
import { pushSupport } from "./push";
describe("Web Push progressivo", () => { it("retorna indisponível quando PushManager não existe", () => { expect(pushSupport()).toBe(false); }); });

