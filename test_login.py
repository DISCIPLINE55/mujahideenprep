
from playwright.sync_api import sync_playwright
import time

def run(playwright):
    print("Launching browser...")
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    
    def handle_dialog(dialog):
        print(f"NATIVE ALERT TRIGGERED: {dialog.message}")
        dialog.accept()
        
    page.on("dialog", handle_dialog)
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    
    print("Navigating to live vercel app...")
    page.goto("https://mujahideenprep.vercel.app/")
    
    print("Typing credentials...")
    page.fill("input[type=email]", "mujahideen216@gmail.com")
    page.fill("input[type=password]", "Admin@mps216")
    
    print("Clicking sign in...")
    page.click("button[type=submit]")
    
    print("Waiting 5 seconds for actions to complete...")
    time.sleep(5)
    
    print("Current URL after click:", page.url)
    
    browser.close()
    print("Done.")

with sync_playwright() as playwright:
    run(playwright)

