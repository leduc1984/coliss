import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #1e1e1e;
    color: #cccccc;
    overflow: hidden;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  /* React Flow Styles Override */
  .react-flow__renderer {
    background-color: #1e1e1e;
  }

  .react-flow__node {
    background-color: #2d2d30;
    border: 1px solid #3e3e42;
    border-radius: 6px;
    color: #cccccc;
    font-size: 12px;
    min-width: 150px;
  }

  .react-flow__node.selected {
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3);
  }

  .react-flow__node-dialogue {
    background-color: #2d4a2d;
    border-color: #4a7c4a;
  }

  .react-flow__node-player_choice {
    background-color: #4a2d4a;
    border-color: #7c4a7c;
  }

  .react-flow__node-condition {
    background-color: #4a4a2d;
    border-color: #7c7c4a;
  }

  .react-flow__node-event {
    background-color: #4a2d2d;
    border-color: #7c4a4a;
  }

  .react-flow__node-start {
    background-color: #2d4a4a;
    border-color: #4a7c7c;
  }

  .react-flow__node-end {
    background-color: #3d3d3d;
    border-color: #6d6d6d;
  }

  .react-flow__handle {
    background-color: #007acc;
    border: 1px solid #ffffff;
    width: 8px;
    height: 8px;
  }

  .react-flow__handle-top {
    top: -4px;
  }

  .react-flow__handle-bottom {
    bottom: -4px;
  }

  .react-flow__handle-left {
    left: -4px;
  }

  .react-flow__handle-right {
    right: -4px;
  }

  .react-flow__edge {
    stroke: #555555;
    stroke-width: 2;
  }

  .react-flow__edge.selected {
    stroke: #007acc;
  }

  .react-flow__edge.animated {
    stroke-dasharray: 5;
    animation: dashdraw 0.5s linear infinite;
  }

  .react-flow__arrowhead {
    fill: #555555;
  }

  .react-flow__edge.selected .react-flow__arrowhead {
    fill: #007acc;
  }

  @keyframes dashdraw {
    from {
      stroke-dashoffset: 10;
    }
  }

  .react-flow__controls {
    background-color: #2d2d30;
    border: 1px solid #3e3e42;
    border-radius: 4px;
  }

  .react-flow__controls button {
    background-color: #2d2d30;
    border: none;
    color: #cccccc;
    border-bottom: 1px solid #3e3e42;
  }

  .react-flow__controls button:hover {
    background-color: #3e3e42;
  }

  .react-flow__controls button:last-child {
    border-bottom: none;
  }

  .react-flow__minimap {
    background-color: #2d2d30;
    border: 1px solid #3e3e42;
  }

  .react-flow__minimap-mask {
    fill: rgba(0, 122, 204, 0.2);
    stroke: #007acc;
  }

  .react-flow__minimap-node {
    fill: #3e3e42;
    stroke: none;
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #2d2d30;
  }

  ::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #777;
  }

  /* Selection styles */
  ::selection {
    background-color: #094771;
    color: #ffffff;
  }

  /* Focus styles */
  button:focus,
  input:focus,
  textarea:focus,
  select:focus {
    outline: 2px solid #007acc;
    outline-offset: 2px;
  }

  /* Common UI element styles */
  .panel {
    background-color: #252526;
    border: 1px solid #3e3e42;
  }

  .panel-header {
    background-color: #2d2d30;
    padding: 8px 12px;
    border-bottom: 1px solid #3e3e42;
    font-size: 12px;
    font-weight: 600;
    color: #cccccc;
  }

  .panel-content {
    padding: 12px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: #cccccc;
  }

  .form-input {
    width: 100%;
    padding: 6px 8px;
    background-color: #3c3c3c;
    border: 1px solid #5e5e5e;
    border-radius: 3px;
    color: #cccccc;
    font-size: 12px;
  }

  .form-input:focus {
    border-color: #007acc;
    background-color: #404040;
  }

  .form-textarea {
    width: 100%;
    padding: 6px 8px;
    background-color: #3c3c3c;
    border: 1px solid #5e5e5e;
    border-radius: 3px;
    color: #cccccc;
    font-size: 12px;
    resize: vertical;
    min-height: 60px;
  }

  .form-textarea:focus {
    border-color: #007acc;
    background-color: #404040;
  }

  .button {
    background-color: #0e639c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .button:hover {
    background-color: #1177bb;
  }

  .button:active {
    background-color: #0d5a9a;
  }

  .button.secondary {
    background-color: #5a5a5a;
  }

  .button.secondary:hover {
    background-color: #6a6a6a;
  }

  .button.danger {
    background-color: #d73a49;
  }

  .button.danger:hover {
    background-color: #e74c3c;
  }

  .button.small {
    padding: 4px 8px;
    font-size: 10px;
  }

  /* Context Menu Styles */
  .context-menu {
    background-color: #2d2d30;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 4px 0;
    min-width: 150px;
    z-index: 1000;
  }

  .context-menu-item {
    padding: 6px 12px;
    font-size: 12px;
    color: #cccccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .context-menu-item:hover {
    background-color: #094771;
  }

  .context-menu-separator {
    height: 1px;
    background-color: #3e3e42;
    margin: 4px 0;
  }

  /* Tooltip Styles */
  .tooltip {
    background-color: #2d2d30;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 11px;
    color: #cccccc;
    max-width: 200px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 1001;
  }
`;