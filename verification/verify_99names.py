from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load index.html
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Click on 99 Names card
        # The link is inside the main content
        print("Navigating to index.html...")

        # Click the link
        print("Clicking 99 Names link...")
        page.click("a[href='99names.html']")

        # Wait for the new page to load content
        # We look for the first meaning "Der Allerbarmer"
        print("Waiting for content in 99names.html...")
        page.wait_for_selector("text=Der Allerbarmer")

        # Verify count
        cards = page.locator("#names-grid > div.glass-card")
        count = cards.count()
        print(f"Found {count} name cards.")

        if count == 99:
            print("SUCCESS: 99 Names found.")
        else:
            print(f"FAILURE: Expected 99 cards, found {count}.")

        # Take screenshot
        page.screenshot(path="verification/verification.png", full_page=True)
        browser.close()

if __name__ == "__main__":
    run()
