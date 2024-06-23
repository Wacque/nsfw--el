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

    // Create a write stream for the results file
    const writeStream = fs.createWriteStream('result.json', { flags: 'a' });
    writeStream.write('[');

    // Collect search results from the first page
    let results = await page.$$eval('.card-wrap', cards => {
      return cards.map(card => {
        const content = card.querySelector('.content .txt')?.innerText || '';
        return { content };
      });
    });

    for (let i = 0; i < results.length; i++) {
      writeStream.write(JSON.stringify(results[i], null, 2));
      if (i < results.length - 1) {
        writeStream.write(',');
      }
    }

    // Go to the second page and collect more results
    const nextPageLink = await page.$('a.page.next');
    if (nextPageLink) {
      await nextPageLink.click();
      await page.waitForTimeout(Math.random() * 2000 + 1000);

      results = await page.$$eval('.card-wrap', cards => {
        return cards.map(card => {
          const content = card.querySelector('.content .txt')?.innerText || '';
          return { content };
        });
      });

      for (let i = 0; i < results.length; i++) {
        writeStream.write(',');
        writeStream.write(JSON.stringify(results[i], null, 2));
      }
    }

    writeStream.write(']');
    writeStream.end();
  } else {
    console.error('Search box not found');
  }
});

