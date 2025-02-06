// Structural selector (update as needed)
const CHAT_SELECTOR = 'div#root > div > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2)';

initializeExportButton();

function initializeExportButton() {
  console.log('DeepSeek Export: Initializing export button...');

  // Create export button container
  const exportContainer = document.createElement('div');
  exportContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
  `;

  // Create main button
  const mainButton = document.createElement('button');
  mainButton.innerHTML = `
    <span>Export Chat</span>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="margin-left: 6px;">
      <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  mainButton.style.cssText = `
    padding: 10px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
    transition: background 0.2s;
  `;

  // Create dropdown menu
  const dropdown = document.createElement('div');
  dropdown.style.cssText = `
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 8px;
    background: white;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: none;
    overflow: hidden;
  `;

  // Create dropdown options
  const options = [
    { text: 'Export as HTML', format: 'html' },
    { text: 'Export as MD', format: 'md' }
  ];

  options.forEach((option, index) => {
    const item = document.createElement('div');
    item.textContent = option.text;
    item.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      color: #333;
      font-size: 14px;
      transition: background 0.2s;
      ${index !== options.length - 1 ? 'border-bottom: 1px solid #eee;' : ''}
    `;

    item.addEventListener('mouseover', () => {
      item.style.background = '#f5f5f5';
    });

    item.addEventListener('mouseout', () => {
      item.style.background = 'white';
    });

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      handleExport(option.format);
      dropdown.style.display = 'none';
    });

    dropdown.appendChild(item);
  });

  // Handle main button hover
  mainButton.addEventListener('mouseover', () => {
    mainButton.style.background = '#0056b3';
  });

  mainButton.addEventListener('mouseout', () => {
    mainButton.style.background = '#007bff';
  });

  // Toggle dropdown on click
  mainButton.addEventListener('click', () => {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!exportContainer.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Add elements to container
  exportContainer.appendChild(dropdown);
  exportContainer.appendChild(mainButton);
  document.body.appendChild(exportContainer);
}

async function handleExport(format) {
  console.log(`DeepSeek Export: ${format.toUpperCase()} export initiated!`);
  
  try {
    const content = format === 'html' ? captureChatContent() : captureMarkdownContent();
    console.log(`DeepSeek Export: Chat content captured for ${format}:`, content);

    chrome.runtime.sendMessage({
      action: 'exportChat',
      format,
      content
    }, (response) => {
      if (response?.success) {
        console.log(`DeepSeek Export: ${format.toUpperCase()} export successful!`);
      } else {
        console.error(`DeepSeek Export: ${format.toUpperCase()} export failed:`, response?.error);
      }
    });
  } catch (error) {
    console.error('DeepSeek Export: Export failed:', error);
    alert(`Export failed: ${error.message}`);
  }
}

// Ensure elements have valid height
function ensureElementHeight(element) {
  if (!element) return;

  const computedStyle = window.getComputedStyle(element);
  const height = computedStyle.height;

  if (height === '0px') {
    console.log('Fixing height for element:', element);
    element.style.minHeight = '1px'; // Set a minimum height
  }

  // Handle flexbox and grid layouts
  if (computedStyle.display === 'flex' && height === '0px') {
    element.style.flex = '1 1 auto';
  }
  if (computedStyle.display === 'grid' && height === '0px') {
    element.style.gridAutoRows = 'minmax(1px, auto)';
  }

  // Recursively check child elements
  Array.from(element.children).forEach(child => ensureElementHeight(child));
}

// Force layout recalculation
function forceLayoutRecalculation(element) {
  element.offsetHeight; // Forces reflow
}

// Capture chat content for HTML export
function captureChatContent() {
  const chatContainer = document.querySelector(CHAT_SELECTOR);
  if (!chatContainer) {
    console.error('DeepSeek Export: Chat container not found!');
    throw new Error('Chat container not found');
  }

  // Force layout recalculation
  forceLayoutRecalculation(chatContainer);

  // Clone with styles
  const clone = chatContainer.cloneNode(true);
  console.log('DeepSeek Export: Chat container cloned:', clone);

  // Ensure all elements have valid height
  ensureElementHeight(clone);

  // Capture images as data URLs
  Array.from(clone.querySelectorAll('img')).forEach(img => {
    img.src = img.src.replace(/^blob:/, '');
  });

  // Capture relevant styles
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        return '';
      }
    }).join('\n');

  return {
    html: clone.outerHTML,
    styles,
    title: document.title
  };
}

// Helper function to process text content
function processText(text) {
  return text
    .trim()
    .replace(/\s*\n\s*/g, '\n') // Normalize newlines
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces with single space
    .replace(/```/g, '\n```\n'); // Ensure code blocks have proper spacing
}

// Capture chat content for Markdown export
function captureMarkdownContent() {
  const chatContainer = document.querySelector(CHAT_SELECTOR);
  if (!chatContainer) {
    console.error('DeepSeek Export: Chat container not found!');
    throw new Error('Chat container not found');
  }

  let markdown = `# ${document.title}\n\n`;
  
  // Get all message blocks
  const messages = Array.from(chatContainer.querySelectorAll('.fa81, .f9bf7997'));
  
  messages.forEach((message, index) => {
    // Check if this is a user message by looking for specific elements
    const isUser = !message.querySelector('.eb23581b');
    
    // Add role header
    markdown += `# ${isUser ? 'User' : 'Assistant'}\n\n`;

    if (isUser) {
      // For user messages, just get the content directly
      const content = message.querySelector('.fbb737a4')?.textContent || '';
      markdown += processText(content) + '\n\n';
    } else {
      // For assistant messages, handle reasoning and response separately
      
      // Get reasoning steps by finding the div after "Thought for X seconds"
      const reasoningContainer = Array.from(message.querySelectorAll('div')).find(div => {
        const prevDiv = div.previousElementSibling;
        return prevDiv?.textContent?.includes('Thought for') && div.classList.contains('e1675d8b');
      });
      
      if (reasoningContainer) {
        // Get all paragraphs within the reasoning container and format as blockquotes with italics
        const paragraphs = reasoningContainer.querySelectorAll('p');
        Array.from(paragraphs).forEach(p => {
          const text = p.textContent.trim();
          if (text) {
            markdown += `> *${text}*\n>\n`; // Add blockquote and italics
          }
        });
        markdown += '\n'; // Add extra line break after reasoning section
      }

      // Get the main response content
      const responseBlocks = Array.from(message.querySelectorAll('.ds-markdown--block'));
      if (responseBlocks.length > 0) {
        
        responseBlocks.forEach(block => {
          // Handle code blocks first
          const codeBlocks = block.querySelectorAll('pre');
          if (codeBlocks.length > 0) {
            codeBlocks.forEach(codeBlock => {
              const code = codeBlock.querySelector('code');
              const language = codeBlock.className.match(/language-(\w+)/)?.[1] || '';
              markdown += `\`\`\`${language}\n${processText(code?.textContent || '')}\n\`\`\`\n\n`;
            });
          }
          
          // Handle regular text content with proper formatting
          if (!block.querySelector('pre')) {
            // Process block content recursively to maintain formatting
            function processNode(node, level = 0) {
              let text = '';
              
              // Handle different node types
              if (node.nodeType === Node.TEXT_NODE) {
                text = node.textContent.trim();
                if (text) return `**${text}**`; // Make regular text bold
                return '';
              }
              
              // Handle headings
              if (node.tagName?.match(/^H[1-6]$/)) {
                const level = node.tagName[1];
                return `${'#'.repeat(level)} **${node.textContent.trim()}**\n\n`; // Make headings bold
              }
              
              // Handle lists
              if (node.tagName === 'UL') {
                return Array.from(node.children).map(li => `- **${processNode(li)}**`).join('\n') + '\n\n';
              }
              if (node.tagName === 'OL') {
                return Array.from(node.children).map((li, i) => `${i + 1}. **${processNode(li)}**`).join('\n') + '\n\n';
              }
              
              // Process child nodes
              const childContent = Array.from(node.childNodes)
                .map(child => processNode(child, level + 1))
                .join('')
                .trim();
              
              // Add appropriate spacing based on node type
              if (node.tagName === 'P' || node.tagName === 'DIV') {
                return childContent ? childContent + '\n\n' : '';
              }
              
              return childContent;
            }
            
            markdown += processNode(block);
          }
        });
      }
    }
    
    // Add separator between messages
    if (index < messages.length - 1) {
      markdown += '---\n\n';
    }
  });

  return {
    markdown,
    title: document.title
  };
}
