import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
await mkdir("review", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() =>
  globalThis.sessionStorage.setItem("verimarts-intro", "seen"),
);
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.screenshot({ path: "review/home-desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "review/home-mobile.png", fullPage: true });
await page.goto("http://127.0.0.1:5173/showroom", { waitUntil: "networkidle" });
await page.screenshot({ path: "review/showroom-mobile.png", fullPage: true });
const introPage = await browser.newPage({viewport:{width:1440,height:1000}});
await introPage.goto('http://127.0.0.1:5173/', {waitUntil:'domcontentloaded'});
await introPage.locator('.intro-artwork').evaluate(async el => {
  await Promise.all(el.getAnimations().map(animation=>animation.finished));
});
await introPage.screenshot({path:'review/intro-desktop.png'});
await browser.close();
