import { test, expect } from '@playwright/test';
import fs from 'fs';

test('test', async ({ page }) => {
  // 模拟人类行为的随机延迟函数
  const humanDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

  await page.goto('https://s.weibo.com/');
  await humanDelay(500, 1500); // 随机延迟

  const searchBox = await page.getByRole('textbox');
  await searchBox.click();
  await humanDelay(300, 800); // 随机延迟

  await searchBox.press('CapsLock');
  await humanDelay(200, 600); // 随机延迟

  await searchBox.fill('理想汽车');
  await humanDelay(500, 1000); // 随机延迟

  await searchBox.press('Enter');
  await humanDelay(2000, 3000); // 随机延迟

  // 获取搜索结果
  const results = await page.$$eval('.card-wrap', cards => {
    return cards.map(card => {
      const title = card.querySelector('.content .title')?.innerText || 'No title';
      const content = card.querySelector('.content .txt')?.innerText || 'No content';
      return { title, content };
    });
  });

  // 保存结果到json文件
  fs.writeFileSync('results.json', JSON.stringify(results, null, 2));

  // 模拟点击下一页
  const nextPageLink = await page.getByRole('link', { name: '下一页' });
  if (nextPageLink) {
    await nextPageLink.click();
    await humanDelay(2000, 3000); // 随机延迟
  }
});