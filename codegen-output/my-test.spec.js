import { test, expect } from '@playwright/test';

test.use({
  storageState: '/Users/wurengui/Code/code-self/nsfmw/electron-react-boilerplate/auth/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto('https://s.weibo.com/');
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('hello');
});