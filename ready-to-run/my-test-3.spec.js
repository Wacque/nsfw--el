import { test, expect } from '@playwright/test';
import fs from 'fs';

test('test', async ({ page }) => {
  test.setTimeout(120000);  // 设置测试超时时间为120秒

  await page.goto('https://s.weibo.com/');

  // Simulate human-like behavior with random delays
  await page.waitForTimeout(Math.random() * 2000 + 1000);

  const searchBox = await page.getByRole('textbox');
  if (searchBox) {
    await searchBox.click();
    await page.waitForTimeout(Math.random() * 500 + 500);

    await searchBox.press('CapsLock');
    await page.waitForTimeout(Math.random() * 500 + 500);

    await searchBox.fill('理想汽车');
    await page.waitForTimeout(Math.random() * 500 + 500);

    await searchBox.press('Enter');
    await page.waitForTimeout(Math.random() * 2000 + 1000);

    // Collect search results
    const results = await page.$$eval('.card-wrap', cards => {
      return cards.map(card => {
        const title = card.querySelector('.content .title')?.innerText || '';
        const content = card.querySelector('.content .txt')?.innerText || '';
        const comments = card.querySelector('.card-act ul li:nth-child(2) a')?.innerText || '0';
        const likes = card.querySelector('.woo-like-count')?.innerText || '0';
        const forwards = card.querySelector('.woo-box-flex.woo-box-alignCenter.woo-box-justifyCenter')?.innerText || '0';
        const link = card.querySelector('.content .title a')?.href || '';
        const username = card.querySelector('.content .info .name')?.innerText || '';
        const weiboUrl = card.querySelector('.content .from a')?.href || '';
        const publishTime = card.querySelector('.content .from a')?.innerText || '';

        return { title, content, comments, likes, forwards, link, username, weiboUrl, publishTime };
      });
    });

    // Save the results to a JSON file
    fs.writeFileSync('result.json', JSON.stringify(results, null, 2));
  } else {
    console.error('Search box not found');
  }
});
