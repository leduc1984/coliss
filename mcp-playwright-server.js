#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { chromium } = require('playwright');

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'playwright-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.browser = null;
    this.page = null;
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'navigate',
          description: 'Navigate to a URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to navigate to' }
            },
            required: ['url']
          }
        },
        {
          name: 'screenshot',
          description: 'Take a screenshot',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to save screenshot' }
            }
          }
        },
        {
          name: 'click',
          description: 'Click an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' }
            },
            required: ['selector']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.browser) {
        this.browser = await chromium.launch({ headless: false });
        this.page = await this.browser.newPage();
      }

      switch (name) {
        case 'navigate':
          await this.page.goto(args.url);
          return { content: [{ type: 'text', text: `Navigated to ${args.url}` }] };

        case 'screenshot':
          const path = args.path || 'screenshot.png';
          await this.page.screenshot({ path });
          return { content: [{ type: 'text', text: `Screenshot saved to ${path}` }] };

        case 'click':
          await this.page.click(args.selector);
          return { content: [{ type: 'text', text: `Clicked ${args.selector}` }] };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

const server = new PlaywrightMCPServer();

process.on('SIGINT', async () => {
  await server.cleanup();
  process.exit(0);
});

server.run().catch(console.error);