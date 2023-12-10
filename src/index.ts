import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

let browser: Browser;
let page: Page;

const startBrowser = async () => {
  puppeteer.use(StealthPlugin());

  browser = await puppeteer.launch({ headless: false, userDataDir: "./.chatgpt_session" });
  page = await browser.newPage();

  await page.goto("https://chat.openai.com/");
};

const run = async (prompt: string) => {
  // Start browser if not started
  console.log("starting..");
  if (!browser || !page) {
    console.log("starting browser...");
    await startBrowser();
  }

  // page.on("dialog", async (dialog) => {
  //   console.log(dialog.message());
  //   await dialog.accept();
  // });

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
  const INPUT_SELECTOR = "[aria-label='Attach files'] + input[type=file]";
  await page.waitForSelector(INPUT_SELECTOR);

  // Make input visible
  await page.evaluate((selector) => {
    const style = document.createElement("style");
    document.head.appendChild(style);
    style.sheet?.insertRule(`${selector} { display: block !important; }`);
  }, INPUT_SELECTOR);

  // page.click("[aria-label='Attach files'] + input[type=file]");
  // await new Promise((r) => setTimeout(r, 3000));

  const inputFileHandle = await page.$(INPUT_SELECTOR);
  if (!inputFileHandle) throw new Error("File handle not found");

  await inputFileHandle?.uploadFile("test-image.webp");

  await page.evaluate((selector) => {
    const input = document.querySelector(selector);

    // Trigger change event after setting value
    function triggerEvent(el: Element, type: string) {
      var e = document.createEvent("HTMLEvents");
      e.initEvent(type, false, true);
      el.dispatchEvent(e);
    }
    triggerEvent(input!, "change");
    triggerEvent(input!, "dragleave");
  }, INPUT_SELECTOR);

  // Wait hardcoded for now
  console.log("Waiting 10 seconds to complete upload...");
  await new Promise((r) => setTimeout(r, 10000));

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

  // Wait hardcoded for now
  console.log("Waiting 4 seconds...");
  await new Promise((r) => setTimeout(r, 4000));

  console.log("Looking for result...");
  const textResponse = await page.$eval(
    '[data-testid="conversation-turn-3"] [data-message-author-role="assistant"] .markdown',
    (element) => {
      return element.textContent;
    }
  );

  const imageInnerHTML = await page.evaluate((imageElement) => {
    return imageElement?.innerHTML;
  }, imageHandle);

  return { textResponse, imageResponse: imageInnerHTML };

  // // Wait for input
  // await page.waitForSelector('[placeholder="Send a message."]');

  // // UI is ready to take an answer
  // await page.type('[placeholder="Send a message."]', prompt);

  // const buttonElement = await page.waitForSelector(
  //   `button svg[stroke="currentColor"][viewBox="0 0 16 16"][class="h-4 w-4"]`
  // );

  // buttonElement.click();

  // const lastMessageContainerSelector = 'div.h-full[class*="react-scroll-to-bottom"] > div';
  // const lastMessageSelector = `${lastMessageContainerSelector} .group .prose:last-child`;

  // // Wait for the last message container to be visible
  // await page.waitForSelector(lastMessageContainerSelector, { visible: true });

  // // Wait for the last message to be fully received
  // // TODO: Make this not hardcoded
  // await page.waitForTimeout(4000);

  // // Retrieve the last message
  // const lastMessageElement = await page.waitForSelector(lastMessageSelector);
  // const lastMessageText = await page.evaluate((element) => element.innerHTML, lastMessageElement);

  // // Click copy to clipboard button
  // const groupElements = await page.$$(`${lastMessageContainerSelector} .group`);
  // if (groupElements.length === 0) throw new Error("No group elements found");
  // const lastGroupElement = groupElements[groupElements.length - 1];
  // var copyButtonElement = await lastGroupElement.$(`button.flex.ml-auto.gap-2.rounded-md.p-1`);

  // await browser
  //   .defaultBrowserContext()
  //   .overridePermissions("https://chat.openai.com", ["clipboard-read", "clipboard-write"]);

  // copyButtonElement.click();

  // await page.waitForTimeout(500);

  // const content = await page.evaluate(async () => {
  //   // Obtain the content of the clipboard as a string
  //   return navigator.clipboard.readText();
  // });

  // console.log("Clipboard content:", content);

  // return lastMessageText;
};

run(
  "Slightly change this image. Do not alter the main content, just make it seem the same photo but in a different environment."
).then((res) => console.log(res));

setInterval(() => {}, 1 << 30);
