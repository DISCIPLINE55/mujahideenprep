
import puppeteer from "puppeteer";

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
  
    // Intercept alerts
    page.on("dialog", async dialog => {
      console.log("NATIVE ALERT TRIGGERED:", dialog.message());
      await dialog.accept();
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err));
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    console.log('Navigating to local dev server...');
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
    
    // Wait an extra second for React to render
    await new Promise(r => setTimeout(r, 1000));

    console.log('Typing credentials...');
    await page.type('#email', 'mujahideen216@gmail.com');
    await page.type('#password', 'Admin@mps216');

    console.log('Clicking sign in...');
    // Find the Sign In button
    const buttons = await page.$$('button');
    let signInBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.trim() === 'Sign In') {
        signInBtn = btn;
        break;
      }
    }
    
    if (signInBtn) {
      await Promise.all([
        signInBtn.click(),
        page.waitForNetworkIdle({ idleTime: 2000, timeout: 15000 }).catch(e => console.log('Network idle timeout'))
      ]);
    } else {
      console.log('Sign In button not found!');
    }

    console.log('Current URL after click:', page.url());
    
    // Give it an extra moment to log anything
    await new Promise(r => setTimeout(r, 2000));
    console.log('Final URL:', page.url());

    await browser.close();
    console.log('Done.');
  } catch (error) {
    console.error('Script failed:', error);
  }
})();
