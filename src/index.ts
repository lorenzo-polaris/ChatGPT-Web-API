import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.CHATGPT_USERNAME || !process.env.CHATGPT_PASSWORD) {
  throw new Error("Please set CHATGPT_USERNAME and CHATGPT_PASSWORD environment variables");
}

let browser: Browser;
let page: Page;

const startBrowser = async () => {
  puppeteer.use(StealthPlugin());

  browser = await puppeteer.launch({ headless: false, userDataDir: "./.chatgpt_session" });
  page = await browser.newPage();

  await page.goto("https://chat.openai.com/?model=gpt-4");
};

const run = async (prompt: string) => {
  // Start browser if not started
  console.log("starting..");
  if (!browser || !page) {
    console.log("starting browser...");
    await startBrowser();
  }

  // Check if login is required
  console.log("checking if login is required...");
  try {
    const LOGIN_SELECTOR = "[data-testid='login-button']";
    // Wait for the login button to appear within a certain timeout (e.g., 3 seconds)
    await page.waitForSelector(LOGIN_SELECTOR, { timeout: 3000 });

    console.log("Login button is present. It is likely that login is required.");

    await page.click(LOGIN_SELECTOR);

    // Wait for the form to appear
    await page.waitForSelector("form");

    // type into the input with name username
    await page.type("input[name=username]", process.env.CHATGPT_USERNAME!);

    // Click the submit button
    await new Promise((r) => setTimeout(r, 2000));
    await page.click("button[type=submit]");

    // Type the password
    await page.type("input[name=password]", process.env.CHATGPT_PASSWORD!);

    // Click the submit button (with aria-visible=true)
    await new Promise((r) => setTimeout(r, 2000));
    await page.click("button[data-action-button-primary=true][type='submit']");

    await new Promise((r) => setTimeout(r, 3000));

    await page.goto("https://chat.openai.com/?model=gpt-4");
  } catch (error) {
    console.log("Login button is not present. It is likely that login is not required.");
  }

  console.log("waiting for #prompt-textarea...");
  await page.waitForSelector("#prompt-textarea");
  console.log("#prompt-textarea ready");

  // Wait hardcoded for now
  console.log("Waiting 2 seconds...");
  await new Promise((r) => setTimeout(r, 2000));

  console.log("Typing prompt in textarea...");
  await page.type("#prompt-textarea", prompt);

  await new Promise((r) => setTimeout(r, 5000));

  // Upload file
  const FILE_INPUT_SELECTOR = "[aria-label='Attach files'] + input[type=file]";
  await page.waitForSelector(FILE_INPUT_SELECTOR);

  const inputFileHandle = await page.$(FILE_INPUT_SELECTOR);
  if (!inputFileHandle) throw new Error("File handle not found");

  await inputFileHandle?.uploadFile("src/test-image.webp");

  // Wait hardcoded for now
  console.log("Waiting 10 seconds to complete upload...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("Waiting for send-button");
  const sendButton = await page.waitForSelector('[data-testid="send-button"]');
  if (!sendButton) throw new Error("can't find send button");

  console.log("Clicking send button...");
  sendButton.click();

  console.log("Waiting for response div...");
  const responseElement = await page.waitForSelector('[data-testid="conversation-turn-3"]');

  // Wait for image
  const imageHandle = await responseElement?.waitForSelector("img");

  // Wait for text
  await responseElement?.waitForSelector('[data-message-author-role="assistant"] .markdown');
  console.log("Response div ready");

  console.log("Looking for result...");
  const textResponse = await page.$eval(
    '[data-testid="conversation-turn-3"] [data-message-author-role="assistant"] .markdown',
    (element) => {
      return element.textContent;
    }
  );

  const imageURL = await page.evaluate((imageElement) => {
    return imageElement?.src;
  }, imageHandle);

  return { textResponse, imageResponse: imageURL };
};

run(
  "Slightly change this image. Do not alter the main content, just make it seem the same photo but in a different environment."
).then((res) => console.log(res));

setInterval(() => {}, 1 << 30);
