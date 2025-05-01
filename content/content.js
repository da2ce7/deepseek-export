
// Structural selector (update as needed)
const CHAT_SELECTOR = 'div#root > div > div:nth-child(1) > div > div:nth-child(3) > div > div:nth-child(2)';

initializeExportButton();

function initializeExportButton() {
  console.log('DeepSeek Export: Initializing export button...');

  // Inject export button
  const exportButton = document.createElement('button');
  exportButton.innerHTML = 'Export Chat';
  exportButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  document.body.appendChild(exportButton);

  // Export handler
  exportButton.addEventListener('click', async () => {
    console.log('DeepSeek Export: Export button clicked!');
    
    try {
      const content = captureChatContent();
      console.log('DeepSeek Export: Chat content captured:', content);

      chrome.runtime.sendMessage({
        action: 'exportChat',
        format: 'html',
        content
      }, (response) => {
        if (response?.success) {
          console.log('DeepSeek Export: HTML export successful!');
        } else {
          console.error('DeepSeek Export: HTML export failed:', response?.error);
        }
      });
    } catch (error) {
      console.error('DeepSeek Export: Export failed:', error);
      alert(`Export failed: ${error.message}`);
    }
  });
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

// Capture chat content
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


