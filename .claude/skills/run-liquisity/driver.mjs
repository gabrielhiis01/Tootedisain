#!/usr/bin/env node
/**
 * Liquisity site driver — takes screenshots and runs smoke checks.
 * Usage:  node driver.mjs [command]
 * Commands (default: smoke):
 *   smoke   — visit all pages, screenshot each, check for console errors
 *   ss <page>  — screenshot a single page (index|buy|brand|contact)
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'http://localhost:7420';
const OUT  = '/tmp/liquisity-screenshots';

const PAGES = {
  index:   '/',
  buy:     '/buy.html',
  brand:   '/brand.html',
  contact: '/contact.html',
};

mkdirSync(OUT, { recursive: true });

const [,, cmd = 'smoke', target] = process.argv;

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page    = await ctx.newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

async function visitAndShot(name, url) {
  const file = path.join(OUT, `${name}.png`);
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`screenshot: ${file}`);
  return file;
}

if (cmd === 'smoke') {
  for (const [name, url] of Object.entries(PAGES)) {
    await visitAndShot(name, url);
  }
  if (errors.length) {
    console.error('Console errors detected:');
    errors.forEach(e => console.error(' ', e));
    process.exitCode = 1;
  } else {
    console.log('No console errors.');
  }
} else if (cmd === 'ss') {
  const name = target ?? 'index';
  const url  = PAGES[name] ?? `/${name}`;
  await visitAndShot(name, url);
} else {
  console.error(`Unknown command: ${cmd}. Available: smoke, ss <page>`);
  process.exitCode = 1;
}

await browser.close();
