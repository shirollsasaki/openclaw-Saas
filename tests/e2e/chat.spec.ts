import { test, expect } from '@playwright/test';

test.describe('OpenClaw Chat UI', () => {
  test('page loads with correct title and empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/OpenClaw/);
    // Empty state message should be visible
    await expect(page.getByText('Your team is ready')).toBeVisible();
  });

  test('shows 7 agents in the side panel', async ({ page }) => {
    await page.goto('/');
    // Agent panel header
    await expect(page.getByText('Your Team')).toBeVisible();
    // All 7 agent names should be visible
    const agentNames = ['Richard Hendricks', 'Monica Hall', 'Gilfoyle', 'Dinesh Chugtai', 'Erlich Bachman', 'Jared Dunn', 'Big Head'];
    for (const name of agentNames) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test('chat input is present and accepts text', async ({ page }) => {
    await page.goto('/');
    const textarea = page.getByPlaceholder('Message your team...');
    await expect(textarea).toBeVisible();
    await textarea.fill('Hello team');
    await expect(textarea).toHaveValue('Hello team');
  });

  test('agent card expands on click', async ({ page }) => {
    await page.goto('/');
    // Click Richard's card
    await page.getByText('Richard Hendricks').click();
    // Thread should appear (either "Waiting for tasks..." or content)
    await expect(page.getByText('Waiting for tasks...')).toBeVisible();
  });
});
