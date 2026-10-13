import type { Page } from '@playwright/test'

// Shows the current test name on the browser page during runtime
export async function showTestNameOnPage(page: Page, testName: string) {
  // Inject a banner into the browser page
  await page.evaluate<void, string>((name: string) => {
    // Remove existing banner if one already exists
    const existingBanner = document.getElementById('playwright-test-banner')

    // Remove old banner before creating a new one
    if (existingBanner) {
      existingBanner.remove()
    }

    // Create a new banner element
    const banner = document.createElement('div')

    // Set unique banner ID
    banner.id = 'playwright-test-banner'

    // Set banner text
    banner.textContent = `Running test: ${name}`

    // Keep banner fixed at the top of the browser
    banner.style.position = 'fixed'

    // Position banner from the top
    banner.style.top = '10px'

    // Center banner horizontally
    banner.style.left = '50%'

    // Adjust center alignment
    banner.style.transform = 'translateX(-50%)'

    // Keep banner above app UI
    banner.style.zIndex = '999999'

    // Set banner background color
    banner.style.background = '#111827'

    // Set banner text color
    banner.style.color = 'white'

    // Add spacing inside banner
    banner.style.padding = '10px 16px'

    // Round banner corners
    banner.style.borderRadius = '8px'

    // Set readable font size
    banner.style.fontSize = '24px'

    // Set font family
    banner.style.fontFamily = 'Arial, sans-serif'

    // Add shadow so banner stands out
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'

    // Prevent banner from blocking clicks on the app
    banner.style.pointerEvents = 'none'

    // Add banner to the page body
    document.body.appendChild(banner)
  }, testName)
}
