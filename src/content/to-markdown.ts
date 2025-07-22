import showdown from "showdown";
const SELECTORS = {
  USER_PROMPT: ".fbb737a4",
  AI_ANSWER: "._4f9bf79",
  AI_THINKING: ".e1675d8b",
  AI_RESPONSE: ".ds-markdown",
  MESSAGE_TURN: ".dad65929",
  CODE_BLOCK: ".md-code-block",
  CODE_BLOCK_INFO: ".md-code-block-infostring",
  INLINE_MATH: ".math-inline",
  DISPLAY_MATH: ".math-display",
};

interface Conversation {
  type: "user" | "ai";
  content: string | { thinking: string; response: string };
}

// Main function to convert chat container to Markdown
export function toMarkdown(chatContainer: HTMLElement): string {
  const conversations = extractConversations(chatContainer);
  return formatMarkdown(conversations);
}

// Extract conversations from the DOM
function extractConversations(chatContainer: HTMLElement): Conversation[] {
  const conversations: Conversation[] = [];
  const messageNodes = chatContainer.querySelectorAll(
    `${SELECTORS.USER_PROMPT}, ${SELECTORS.AI_ANSWER}`,
  );

  messageNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    if (node.matches(SELECTORS.USER_PROMPT)) {
      conversations.push({
        type: "user",
        content: cleanContent(node, "prompt"),
      });
    } else if (node.matches(SELECTORS.AI_ANSWER)) {
      const thinkingNode = node.querySelector<HTMLElement>(
        SELECTORS.AI_THINKING,
      );
      const responseNode = node.querySelector<HTMLElement>(
        SELECTORS.AI_RESPONSE,
      );
      if (thinkingNode || responseNode) {
        conversations.push({
          type: "ai",
          content: {
            thinking: thinkingNode
              ? cleanContent(thinkingNode, "thinking")
              : "",
            response: responseNode
              ? cleanContent(responseNode, "response")
              : "",
          },
        });
      }
    }
  });

  return conversations;
}

// Clean content based on type
function cleanContent(
  node: HTMLElement,
  type: "prompt" | "thinking" | "response",
): string {
  const clone = node.cloneNode(true) as HTMLElement;

  // Remove buttons and icons
  clone.querySelectorAll("button, .ds-icon, svg").forEach((el) => el.remove());

  // Specific cleaning based on type
  if (type === "prompt") {
    // For prompts, we want mostly plain text, preserving line breaks.
    return clone.innerText.replace(/\n{3,}/g, "\n\n").trim();
  } else if (type === "thinking") {
    // For thinking blocks, convert divs and paragraphs to newlines
    let html = clone.innerHTML;
    html = html.replace(/<div[^>]*>/g, "\n").replace(/<\/div>/g, "");
    html = html.replace(/<p[^>]*>/g, "\n").replace(/<\/p>/g, "");
    html = html.replace(/<br\s*\/?>/g, "\n");
    // Now remove remaining HTML tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent?.trim() || "";
  } else {
    // For responses, we return the innerHTML to be processed by showdown
    return clone.innerHTML;
  }
}

// Format conversations into a single Markdown string
function formatMarkdown(conversations: Conversation[]): string {
  const fullTitle = document.title;
  const title = fullTitle.includes(" - DeepSeek")
    ? fullTitle.split(" - DeepSeek")[0].trim()
    : fullTitle.trim();
  let md = `# ${title || "DeepSeek Conversation"}\n\n`;

  conversations.forEach((conv, index) => {
    if (conv.type === "user") {
      if (index > 0) md += "\n---\n";
      const userContent = (conv.content as string);
      md += `\n> [!info] User\n ${userContent}\n\n`;
    } else if (conv.type === "ai") {
      const aiContent = conv.content as { thinking: string; response: string };
      if (aiContent.thinking) {
        const thinkingContent = aiContent.thinking.split("\n").join("\n> ");
        md += `\n [!success] Thinking\n> ${thinkingContent}\n`;
      }
      if (aiContent.response) {
        md += `\n${htmlToMarkdown(aiContent.response)}\n`;
      }
    }
  });

  return md;
}

// Convert HTML to Markdown
function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Pre-process Katex math blocks
  tempDiv.querySelectorAll(".katex, .katex-display").forEach((mathEl) => {
    const annotation = mathEl.querySelector("annotation");
    const latex = annotation?.textContent?.trim();
    if (latex) {
      if (mathEl.classList.contains("katex-display")) {
        mathEl.replaceWith(`\n$$\n${latex}\n$$\n`);
      } else {
        mathEl.replaceWith(`$${latex}$`);
      }
    }
  });

  // Pre-process code blocks
  tempDiv.querySelectorAll(SELECTORS.CODE_BLOCK).forEach((codeBlock) => {
    const lang =
      codeBlock.querySelector(SELECTORS.CODE_BLOCK_INFO)?.textContent?.trim() ||
      "";
    const codeContent = codeBlock.querySelector("pre")?.textContent || "";
    codeBlock.replaceWith(`\n\`\`\`${lang}\n${codeContent}\n\`\`\`\n`);
  });

  const converter = new showdown.Converter({
    ghCompatibleHeaderId: true,
    simpleLineBreaks: true,
    ghMentions: true,
    tables: true,
  });
  return converter.makeMarkdown(tempDiv.innerHTML);
}