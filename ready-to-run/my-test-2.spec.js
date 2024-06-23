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

    const writeStream = fs.createWriteStream('result.json', { flags: 'a' });
    writeStream.write('[');

    let allResults = [];
    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      await page.waitForTimeout(Math.random() * 2000 + 1000); // Simulate human behavior with random delays

      // Collect search results
      const results = await page.$$eval('.card-wrap', cards => {
        return cards.map(card => {
          const content = card.querySelector('.content .txt')?.innerText || '';
          return { content };
        });
      });

      allResults = allResults.concat(results);

      // Navigate to the next page
      const nextButton = await page.$('a.next');
      if (nextButton && pageNum < 3) {
        await nextButton.click();
      } else {
        break;
      }
      await page.waitForTimeout(Math.random() * 2000 + 1000); // Simulate human behavior with random delays
    }

    // Write all collected results to the file
    for (let i = 0; i < allResults.length; i++) {
      writeStream.write(JSON.stringify(allResults[i], null, 2));
      if (i < allResults.length - 1) {
        writeStream.write(',');
      }
    }

    writeStream.write(']');
    writeStream.end();
  } else {
    console.error('Search box not found');
  }
});
