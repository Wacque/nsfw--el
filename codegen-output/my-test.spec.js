import { test, expect } from '@playwright/test';

test.use({
  storageState: '/Users/wurengui/Code/code-self/nsfmw/electron-react-boilerplate/auth/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto('https://s.weibo.com/');
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('');
  await page.getByRole('textbox').press('CapsLock');
  await page.getByRole('textbox').fill('理想汽车');
  await page.getByRole('textbox').press('Enter');
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '月21日 12:11' }).click();
  const page1 = await page1Promise;
  const page2Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '臧智渊' }).click();
  const page2 = await page2Promise;
  await page.getByText('理想今天完成了80').first().click();
  const page3Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '不是郑小康' }).click();
  const page3 = await page3Promise;
  await page.getByText('理想汽车第一产品线（L9、M9、MEGA').first().click();
  await page.getByText('这是2022年6月21日晚8点，理想L9').click();
  await page.getByRole('link', { name: ' 46' }).click();
  await page.getByText('BelieveDB ：不收费的智驾！').click();
  await page.getByText('今天12:56').click();
});