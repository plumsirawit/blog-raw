import { marked } from "marked";
// @ts-ignore
import renderMathInElement from "katex/contrib/auto-render";

export function renderMarkdown(elem: HTMLElement, text: string) {
  elem.innerHTML = marked.parse(text.replace(/\\/g, "\\\\"));
  renderMathInElement(elem, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
  });
}
