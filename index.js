const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const express = require("express");
const app = express();
var bodyParser = require("body-parser");

let browser, page;

app.use(bodyParser.json());

const startBrowser = async () => {
  puppeteer.use(StealthPlugin());

  browser = await puppeteer.launch({ headless: false, userDataDir: "./.chatgpt_session" });
  page = await browser.newPage();

  // Open chat.openai.com
  await page.goto("https://chat.openai.com/");
};

app.get("/start-browser", async function (req, res) {
  await startBrowser();

  return res.end("Browser started");
});

app.post("/run", async function (req, res) {
  // Start browser if not started
  if (!browser || !page) {
    await startBrowser();
  }

  // Get the prompt from the request
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).end("Prompt is required");
  }

  // Click the "New chat" button
  await page.click("text=New chat");

  await page.waitForTimeout(1000);

  // Wait for input
  await page.waitForSelector('[placeholder="Send a message..."]');

  // UI is ready to take an answer
  await page.type('[placeholder="Send a message..."]', prompt);

  const buttonElement = await page.waitForSelector(
    `button svg[stroke="currentColor"][viewBox="0 0 24 24"][class="h-4 w-4 mr-1"]`
  );

  buttonElement.click();

  const lastMessageContainerSelector = 'div.h-full[class*="react-scroll-to-bottom"] > div';
  const lastMessageSelector = `${lastMessageContainerSelector} .group .prose:last-child`;

  // Wait for the last message container to be visible
  await page.waitForSelector(lastMessageContainerSelector, { visible: true });

  // Wait for the last message to be fully received
  // TODO: Make this not hardcoded
  await page.waitForTimeout(4000);

  // Retrieve the last message
  const lastMessageElement = await page.waitForSelector(lastMessageSelector);
  const lastMessageText = await page.evaluate((element) => element.innerHTML, lastMessageElement);

  // Click copy to clipboard button
  const groupElements = await page.$$(`${lastMessageContainerSelector} .group`);
  if (groupElements.length === 0) throw new Error("No group elements found");
  const lastGroupElement = groupElements[groupElements.length - 1];
  var copyButtonElement = await lastGroupElement.$(`button.flex.ml-auto.gap-2.rounded-md.p-1`);

  await browser
    .defaultBrowserContext()
    .overridePermissions("https://chat.openai.com", ["clipboard-read", "clipboard-write"]);

  copyButtonElement.click();

  await page.waitForTimeout(500);

  const content = await page.evaluate(async () => {
    // Obtain the content of the clipboard as a string
    return navigator.clipboard.readText();
  });

  console.log("Clipboard content:", content);

  return res.end(lastMessageText);
});

app.listen(3000);
