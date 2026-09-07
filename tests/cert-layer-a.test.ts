import { describe, it, expect } from "@effect/vitest"
import { applyLayerA } from "../src/layer-a.js"

describe("cert_layer_a_roundtrip", () => {
  it("strips Claude trailer and keeps human trailer", () => {
    const src = "Fix the bug\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nCo-authored-by: Jane Doe <jane@example.com>\n"
    const { text, removed } = applyLayerA(src)
    expect(text).not.toMatch(/noreply@anthropic\.com/)
    expect(text).toMatch(/jane@example\.com/)
    expect(removed.trailer).toBeGreaterThan(0)
  })
  it("strips Generated-with banner", () => {
    const { text } = applyLayerA("# helper\n# Generated with Claude Code\nprint(1)\n")
    expect(text).not.toMatch(/Generated with Claude Code/)
    expect(text).toMatch(/print\(1\)/)
  })
  it("strips ZWSP and keeps emoji ZWJ family", () => {
    const family = "family \u{1F468}\u200D\u{1F469}\u200D\u{1F467}"
    expect(applyLayerA("hello\u200Bworld").text).toBe("helloworld")
    expect(applyLayerA(family).text).toBe(family)
  })
  it("strips Cursor Co-authored-by and Made-with trailers", () => {
    const src =
      "Fix the retry backoff\n\n" +
      "Co-authored-by: Cursor <cursoragent@cursor.com>\n" +
      "Made-with: Cursor\n" +
      "Co-authored-by: Jane Doe <jane@example.com>\n"
    const { text, removed } = applyLayerA(src)
    expect(text).not.toMatch(/cursoragent@cursor\.com/)
    expect(text).not.toMatch(/Made-with:\s*Cursor/)
    expect(text).toMatch(/jane@example\.com/)
    expect(removed.trailer).toBeGreaterThan(0)
  })
  it("strips Generated with Cursor banner and keeps code", () => {
    const { text } = applyLayerA("# helper\n# Generated with Cursor\nprint(1)\n")
    expect(text).not.toMatch(/Generated with Cursor/)
    expect(text).toMatch(/print\(1\)/)
  })
  it("keeps a human GitHub noreply co-author", () => {
    const src =
      "Fix the bug\n\nCo-authored-by: Jane Doe <123+jane@users.noreply.github.com>\n"
    const { text, removed } = applyLayerA(src)
    expect(text).toMatch(/123\+jane@users\.noreply\.github\.com/)
    expect(removed.trailer).toBe(0)
  })
  it("strips Copilot bot noreply without stripping a human noreply on the same commit", () => {
    const src =
      "Fix the bug\n\n" +
      "Co-authored-by: Copilot <198982749+Copilot[bot]@users.noreply.github.com>\n" +
      "Co-authored-by: Jane Doe <123+jane@users.noreply.github.com>\n"
    const { text, removed } = applyLayerA(src)
    expect(text).not.toMatch(/Copilot\[bot\]/)
    expect(text).toMatch(/123\+jane@users\.noreply\.github\.com/)
    expect(removed.trailer).toBeGreaterThan(0)
  })
  it("strips known agent emails and keeps a human named Cursor Smith", () => {
    const src =
      "Fix the bug\n\n" +
      "Co-authored-by: aider (llama3.2) <aider@aider.chat>\n" +
      "Co-authored-by: Amp <amp@ampcode.com>\n" +
      "Co-authored-by: Gemini <gemini-code-assist@google.com>\n" +
      "Co-authored-by: Cursor Smith <cursor.smith@acme.com>\n"
    const { text, removed } = applyLayerA(src)
    expect(text).not.toMatch(/aider@aider\.chat/)
    expect(text).not.toMatch(/amp@ampcode\.com/)
    expect(text).not.toMatch(/gemini-code-assist@google\.com/)
    expect(text).toMatch(/cursor\.smith@acme\.com/)
    expect(removed.trailer).toBeGreaterThan(0)
  })
})
