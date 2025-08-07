import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:8081", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Click on 'Accedi o Registrati' to open login or registration form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Accedi' button to login.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/div/div[2]/div/div/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open a calendar entry to access the chat.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div/div/div/div[2]/div/div[2]/div/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Salva' button (index 31) to save/send the chat message.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[4]/div/div[2]/div/div/div/div[3]/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open the same calendar entry again to verify the sent message and test replying and reacting to it.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div/div/div/div[2]/div/div[2]/div/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert that the sent chat message is visible in the chat window.
        sent_message_locator = frame.locator("xpath=//div[contains(text(), 'Test message for real-time validation')]")
        await sent_message_locator.wait_for(state='visible', timeout=5000)
        # Assert that a reply to the message is visible (assuming reply text contains 'reply')
        reply_locator = frame.locator("xpath=//div[contains(text(), 'reply')]")
        await reply_locator.wait_for(state='visible', timeout=5000)
        # Assert that a reaction icon or count is visible near the message
        reaction_locator = frame.locator("xpath=//div[contains(@class, 'reaction') or contains(text(), '👍') or contains(text(), '❤️')]")
        await reaction_locator.wait_for(state='visible', timeout=5000)
        # Assert that notification for new message or reaction is visible on other user's device
        notification_locator = frame.locator("xpath=//div[contains(@class, 'notification') and contains(text(), 'new message')]")
        await notification_locator.wait_for(state='visible', timeout=5000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    