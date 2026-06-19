
import puppeteer from "puppeteer";

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Intercept alerts
  page.on("dialog", async dialog => {
    console.log("NATIVE ALERT TRIGGERED:", dialog.message());
    await dialog.accept();
  });

  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  
  console.log("Navigating to live vercel app...");
  await page.goto("https://mujahideenprep.vercel.app/", { waitUntil: "networkidle0", timeout: 30000 });
  
  const html = await page.content();
  console.log("Does page have VERSION 7 sticker?", html.includes("VERSION 7 LIVE"));
  
  console.log("Typing credentials...");
  await page.type("input[type=email]", "mujahideen216@gmail.com");
  await page.type("input[type=password]", "Admin@mps216");
  
  console.log("Clicking sign in...");
  await page.click("button[type=submit]");
  
  console.log("Waiting for network idle...");
  await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => console.log("Network idle timeout (normal if redirect happens)"));
  
  console.log("Current URL after click:", page.url());
  
  await browser.close();
  console.log("Done.");
})();

