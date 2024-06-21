import { test, expect } from '@playwright/test';

test.use({
  storageState: '/Users/wurengui/Code/code-self/nsfmw/electron-react-boilerplate/src/auth/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://s.weibo.com/');
  await page.getByText('微博搜索').click();
  await page.getByRole('textbox').click();
  await page.getByRole('button', { name: '搜索' }).click();
  await page.getByText('微博搜索').click();
});