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
        const likes = card.querySelector('.woo-like-count')?.innerText || '0';
        const link = card.querySelector('.content .title a')?.href || '';
        const username = card.querySelector('.content .info .name')?.innerText || '';
        const weiboUrl = card.querySelector('.content .from a')?.href || '';

        return { title, content, likes, link, username, weiboUrl };
      });
    });

    // Create a write stream for the results file
    const writeStream = fs.createWriteStream('result.json', { flags: 'a' });
    writeStream.write('[');

    for (let i = 0; i < results.length; i++) {
      // Navigate to the weibo page to get region info
      if (results[i].weiboUrl) {
        const newPage = await page.context().newPage();
        await newPage.goto(results[i].weiboUrl);
        await newPage.waitForTimeout(Math.random() * 2000 + 1000);

        const region = await newPage.$eval('.head-info_ip_3ywCW', el => el.innerText.replace('发布于', '').trim()).catch(() => '');
        results[i].region = region;

        await newPage.close();
      } else {
        results[i].region = '';
      }

      // Write each result to the file
      writeStream.write(JSON.stringify(results[i], null, 2));
      if (i < results.length - 1) {
        writeStream.write(',');
      }
    }

    writeStream.write(']');
    writeStream.end();
  } else {
    console.error('Search box not found');
  }
});
