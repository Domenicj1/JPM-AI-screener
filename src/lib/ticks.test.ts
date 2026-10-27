import { describe, expect, it } from "vitest"
import { niceTicks } from "./ticks"

describe("niceTicks", () => {
    it("uses round steps for big ranges ", () => {
        expect(niceTicks(0, 320).ticks).toEqual([0, 100, 200, 300, 400])
    })
    it("keeps small steps for small ranges", () => {
        expect(niceTicks(1.1, 2.1).ticks).toEqual([1, 1.2, 1.4, 1.6, 1.8, 2, 2.2])
    })
})
