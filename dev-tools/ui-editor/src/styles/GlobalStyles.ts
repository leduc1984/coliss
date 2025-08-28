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
`;