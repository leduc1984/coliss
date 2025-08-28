const { chromium } = require('playwright');
const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Global browser and page instances
let browser = null;
let page = null;

// Initialize browser
async function initBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
    console.log('Browser initialized');
  }
}

// MCP tool implementations
app.post('/navigate', async (req, res) => {
  try {
    await initBrowser();
    const { url } = req.body;
    await page.goto(url);
    res.json({ success: true, message: `Navigated to ${url}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/click', async (req, res) => {
  try {
    await initBrowser();
    const { selector } = req.body;
    await page.click(selector);
    res.json({ success: true, message: `Clicked on ${selector}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/fill', async (req, res) => {
  try {
    await initBrowser();
    const { selector, text } = req.body;
    await page.fill(selector, text);
    res.json({ success: true, message: `Filled ${selector} with "${text}"` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/getText', async (req, res) => {
  try {
    await initBrowser();
    const { selector } = req.body;
    const text = await page.textContent(selector);
    res.json({ success: true, text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/screenshot', async (req, res) => {
  try {
    await initBrowser();
    const { path } = req.body;
    await page.screenshot({ path });
    res.json({ success: true, message: `Screenshot saved to ${path}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/pressKey', async (req, res) => {
  try {
    await initBrowser();
    const { key } = req.body;
    await page.keyboard.press(key);
    res.json({ success: true, message: `Pressed key ${key}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/waitForSelector', async (req, res) => {
  try {
    await initBrowser();
    const { selector, timeout = 10000 } = req.body;
    await page.waitForSelector(selector, { timeout });
    res.json({ success: true, message: `Found element ${selector}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Playwright MCP server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  process.exit(0);
});