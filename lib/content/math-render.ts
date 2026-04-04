import katex from "katex"

function renderKaTeX(expression: string, displayMode: boolean) {
  return katex.renderToString(expression, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    trust: false,
    output: "html",
  })
}

export function renderInlineMathHtml(expression: string) {
  return `<span data-math-inline="true" class="v0-math-inline">${renderKaTeX(expression, false)}</span>`
}

export function renderBlockMathHtml(expression: string) {
  return `<div data-math-block="true" class="v0-math-block">${renderKaTeX(expression, true)}</div>`
}
