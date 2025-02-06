# DeepSeek Chat Export

A Firefox extension that allows you to export your DeepSeek chat conversations as HTML or Markdown files, preserving the chat content and structure for local storage or sharing.

## Features
- Export options for both HTML and Markdown formats
- HTML export:
  - Preserves complete chat styling and layout
  - Maintains all chat content including messages, code blocks, and images
  - Exports as standalone HTML files that can be viewed in any browser
- Markdown export:
  - Creates clean, readable markdown files with structured sections:
    - Clear User/Assistant role distinction with headers
    - Separate sections for Assistant's reasoning and responses
    - Code blocks with language detection and proper formatting
    - Horizontal rules for clear message separation
  - Perfect for version control, documentation, or further editing
- Clean and minimal interface that integrates seamlessly with DeepSeek's UI
- Built with help from DeepSeek itself

## Installation

### Firefox Add-ons Store
Install directly from the Firefox Add-ons store:
https://addons.mozilla.org/en-US/firefox/addon/deepseek-chat-export/

### Temporary Installation (Development)
1. Clone this repository or download the source code
2. Compress the folder contents into a ZIP file
3. Rename the ZIP file extension to `.xpi`
4. In Firefox, navigate to `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on" and select the `.xpi` file

## Usage
1. Navigate to DeepSeek's chat interface (chat.deepseek.com)
2. Look for two export buttons in the bottom-right corner of the page:
   - "Export as HTML" - Creates a complete webpage with preserved styling
   - "Export as MD" - Creates a markdown file of the conversation
3. Click your preferred export format
4. Choose a location to save your file
5. For HTML exports, open in any web browser to view
6. For Markdown exports, open in any text editor or markdown viewer

## Technical Details
The extension works by:
- Injecting export buttons into the DeepSeek chat interface
- Capturing chat content and structure
- For HTML export:
  - Preserves complete styling and layout
  - Converts embedded images to ensure preservation
  - Generates standalone HTML with all necessary styling
- For Markdown export:
  - Converts chat structure to markdown format
  - Preserves speaker roles (User/Assistant)
  - Maintains code blocks with proper formatting
  - Creates clean, readable markdown content
- Uses browser APIs to handle file download

## Development
The extension consists of:
- `content.js`: Handles DOM manipulation, chat content capture, and markdown conversion
- `background.js`: Manages file generation and download functionality for both formats
- `manifest.json`: Extension configuration and permissions

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing
Contributions are welcome! Feel free to submit issues and pull requests.
