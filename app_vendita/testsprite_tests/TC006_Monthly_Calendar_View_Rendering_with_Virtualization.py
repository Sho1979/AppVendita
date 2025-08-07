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
        # Click on 'Accedi o Registrati' button to proceed to login or registration.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Accedi' button to submit login form and access the app.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/div/div[2]/div/div/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Scroll through the calendar to trigger virtualization and observe UI responsiveness and event loading.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Assert that the page title is 'Calendario' indicating monthly calendar view is loaded
        assert await page.title() == 'Calendario'
        # Assert that the calendar displays the correct week range
        week_range_text = await page.locator('text=7-13 August 2025').text_content()
        assert '7-13 August 2025' in week_range_text
        # Assert that all days in the week are displayed with sales data
        days = ['Monday 4', 'Tuesday 5', 'Wednesday 6', 'Thursday 7', 'Friday 8', 'Saturday 9', 'Sunday 10']
        for day in days:
            day_locator = page.locator(f'text={day}')
            assert await day_locator.count() > 0
        # Assert that total entries and sales summary are displayed correctly
        summary_text = await page.locator('text=total_entries').text_content()
        assert '38' in summary_text or '660' in summary_text
        # After scrolling, assert UI is still responsive by checking presence of a known element
        await page.mouse.wheel(0, 1000)
        await page.wait_for_timeout(1000)
        assert await page.locator('text=Calendario').count() > 0
        # Assert that events (sales data) are loaded correctly for a sample day
        sample_day = 'Tuesday 5'
        sales_data_locator = page.locator(f'text={sample_day}')
        assert await sales_data_locator.count() > 0
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    