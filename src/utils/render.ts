import { marked, Tokenizer } from "marked";
import type { Renderer, Tokens } from "marked";
import katex from "katex";

const inlineText =
  /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
const newInlineText =
  /^([`$]+|[^`$])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`$*_]|\b_|$)|[^ ](?= {2,}\n)))/;

const inlineTextGfm =
  /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/;
const newInlineTextGfm =
  /^([`$~]+|[^`$~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`${\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`$*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`${\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`${\|}~-]+@)))/;

const inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
const newInlineCode = /^([`$]+)([^`$]|[^`$][\s\S]*?[^`$])\1(?![`$])/;

const patch = (tokenizer: Tokenizer) => {
  if (tokenizer.rules.inline.text.source === inlineText.source) {
    tokenizer.rules.inline.text = newInlineText;
  } else if (tokenizer.rules.inline.text.source === inlineTextGfm.source) {
    tokenizer.rules.inline.text = newInlineTextGfm;
  } else if (
    tokenizer.rules.inline.text.source !== newInlineText.source &&
    tokenizer.rules.inline.text.source !== newInlineTextGfm.source
  ) {
    // panic
    throw new Error("marked version not supported (inline.text mismatches)");
  }

  if (tokenizer.rules.inline.code.source === inlineCode.source) {
    tokenizer.rules.inline.code = newInlineCode;
  } else if (tokenizer.rules.inline.code.source !== newInlineCode.source) {
    console.log(tokenizer.rules.inline.code.source);
    // panic
    throw new Error("marked version not supported (inline.code mismatches)");
  }
};

const tokenizer: Tokenizer = new marked.Tokenizer();
const renderer: Renderer = new marked.Renderer();
let IMAGES_URL: string | undefined = undefined;

// enable resize option for images
renderer.image = function ({ href, title, text }) {
  var style = "page-break-inside:avoid; ";
  var images_folder = "";
  if (href.indexOf("/") < 0 && IMAGES_URL !== undefined)
    images_folder = IMAGES_URL;
  if (title) {
    const size = title.split("x");
    if (size[1])
      style += "width: " + size[0] + "px; height: " + size[1] + "px;";
    else style += "width: " + size[0] + "px;";
  }
  return (
    "" +
    '<img src="' +
    images_folder +
    href +
    '" alt="' +
    text +
    '" style="' +
    style +
    '">'
  );
};

// remove trailing newline in code blocks
renderer.code = function ({ text, lang, escaped }) {
  return (
    '<pre style="page-break-inside:avoid;"><code>' + text + "</code></pre>"
  );
};

// render ltr tables (started with %ltr%)
// renderer.table = function (obj) {
//   var html = "";
//   var tags = 'style="page-break-inside:avoid;"';
//   obj.header = obj.header.map((header) => {
//     if (header.text.search("%ltr%") < 0) {
//       tags += ' dir="ltr"';
//     } else {
//       header.text = header.text.replace("%ltr%", "");
//     }
//     return header;
//   });
//   html = "<div " + tags + ">" + originalRenderer.table(obj) + "</div>";
//   return html;
// };

// @ts-ignore
tokenizer.codespan = function (src) {
  //   We're following https://github.com/markedjs/marked/issues/1653
  const match = src.match(/^([`$]+)([^`$]|[^`$][\s\S]*?[^`$])\1(?![`$])/);
  if (match) {
    return {
      type: "codespan",
      raw: match[0],
      text: match[2].trim(),
    } as Tokens.Codespan;
  }
  return false;
};

// @ts-ignore
tokenizer.inlineText = function (src) {
  patch(this);
  return false;
};

// @ts-ignore
renderer.codespan = function (codespan: Tokens.Codespan) {
  if (codespan.raw.startsWith("$$") && codespan.raw.endsWith("$$")) {
    return katex.renderToString(codespan.text, {
      displayMode: true,
      throwOnError: false,
    });
  } else if (codespan.raw.startsWith("$") && codespan.raw.endsWith("$")) {
    return katex.renderToString(codespan.text, {
      throwOnError: false,
    });
  }
  return false;
};

marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
});

marked.use({ renderer, tokenizer });

export { marked };

export async function renderMarkdown(elem: HTMLElement, text: string) {
  elem.innerHTML = await marked.parse(text);
  console.log("rendered");
}
