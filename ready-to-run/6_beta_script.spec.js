import { test, expect } from '@playwright/test';
import fs from 'fs';

test.use({
  storageState: '/Users/wurengui/Code/code-self/nsfmw/electron-react-boilerplate/auth/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto('https://s.weibo.com/');

  // Simulate human-like typing
  const searchBox = page.getByRole('textbox');
  await searchBox.click();
  await searchBox.fill('');
  await searchBox.press('CapsLock');
  await searchBox.type('理想汽车', { delay: 100 });
  await searchBox.press('Enter');

  // Wait for search results to load
  await page.waitForTimeout(2000);

  // Collect data
  const results = [];
  const cards = await page.$$('.card-wrap');

  for (const card of cards) {
    const titleElement = await card.$('.content .title');
    const contentElement = await card.$('.content .txt');
    const usernameElement = await card.$('.content .info .name');
    const postTimeElement = await card.$('.content .from a');
    const weiboUrlElement = await card.$('.content .from a');
    const likesElement = await card.$('.woo-like-count');
    const commentsElement = await card.$('.card-act ul li:nth-child(2) a');

    const title = titleElement ? await titleElement.textContent() : '';
    const content = contentElement ? await contentElement.textContent() : '';
    const username = usernameElement ? await usernameElement.textContent() : '';
    const postTime = postTimeElement ? await postTimeElement.textContent() : '';
    const weiboUrl = weiboUrlElement ? await weiboUrlElement.getAttribute('href') : '';
    const likes = likesElement ? await likesElement.textContent() : '0';
    const comments = commentsElement ? await commentsElement.textContent() : '0';

    let region = '';
    if (weiboUrl) {
      const detailPage = await page.context().newPage();
      const fullWeiboUrl = weiboUrl.startsWith('http') ? weiboUrl : `https:${weiboUrl}`;
      await detailPage.goto(fullWeiboUrl);
      const regionElement = await detailPage.$('.head-info_ip_3ywCW');
      region = regionElement ? await regionElement.textContent() : '';
      await detailPage.close();
    }

    if (title.includes('理想') || content.includes('理想')) {
      results.push({ title, content, username, postTime, weiboUrl, likes, comments, region });
    }
  }

  // Save results to result.json
  fs.writeFileSync('result.json', JSON.stringify(results, null, 2));

  // Simulate human-like browsing
  await page.waitForTimeout(1000);
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '月21日 12:11' }).first().click();
  const page1 = await page1Promise;

  await page.waitForTimeout(1000);
  const page2Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '臧智渊' }).click();
  const page2 = await page2Promise;

  await page.waitForTimeout(1000);
  await page.getByText('理想今天完成了80').first().click();

  await page.waitForTimeout(1000);
  const page3Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '不是郑小康' }).click();
  const page3 = await page3Promise;

  await page.waitForTimeout(1000);
  await page.getByText('理想汽车第一产品线（L9、M9、MEGA').first().click();

  await page.waitForTimeout(1000);
  await page.getByText('这是2022年6月21日晚8点，理想L9').click();

  await page.waitForTimeout(1000);
  await page.getByRole('link', { name: ' 46' }).click();

  await page.waitForTimeout(1000);
  await page.getByText('BelieveDB ：不收费的智驾！').click();

  await page.waitForTimeout(1000);
  await page.getByText('今天12:56').click();
});