// ABOUTME: Smoke test verifying the Vitest test runner is functional.
// ABOUTME: If this fails, the test infrastructure itself is broken.
import { describe, expect, it } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
