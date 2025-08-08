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
        # Click on 'Accedi o Registrati' to open login form
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Accedi' button to login
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/div/div[2]/div/div/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert that the page title is 'Calendario' indicating calendar screen loaded
        assert await page.title() == 'Calendario'
        # Assert that week days are displayed correctly
        week_days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
        for day in week_days:
            assert await page.locator(f'text={day}').count() > 0
        # Assert that daily entries icons are displayed for each day in the week
        daily_entries = {4: ['📦', '📝', '👤', '📷'], 5: ['📦', '📝', '👤', '📷'], 6: ['📦', '📝', '👤', '📷'], 7: ['📦', '📝', '👤', '📷'], 8: ['📦', '📝', '👤', '📷'], 9: ['📦', '📝', '👤', '📷'], 10: ['📦', '📝', '👤', '📷', '📊']}
        for day, icons in daily_entries.items():
            for icon in icons:
                assert await page.locator(f'text={icon}').count() > 0
        # Assert that summary metrics are displayed and progressive calculations update on visible dates
        summary_metrics = {'MAPBCOV': 60, 'S': 240, 'PBCOV': 0, 'PUT2V': 0, 'PUB2V': 0, 'PHR4V': 0, 'PSU2V': 0, 'PSUBV': 0}
        for metric, value in summary_metrics.items():
            assert await page.locator(f'text={metric}').count() > 0
            assert await page.locator(f'text={value}').count() > 0
        # Assert that entries count and actions count are displayed
        assert await page.locator('text=18').count() > 0  # entries_count
        assert await page.locator('text=13').count() > 0  # actions_count
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    