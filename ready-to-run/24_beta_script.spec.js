import { test, expect } from '@playwright/test';
import fs from 'fs';

test('test', async ({ page }) => {
  // 模拟人类行为的随机延迟函数
  const humanDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

  // 访问微博登录页面
  await page.goto('https://passport.weibo.com/visitor/visitor?a=enter&ua=php-sso_sdk_client-0.6.29&_rand=1718979171.418&entry=miniblog&sudaref=&url=https%3A%2F%2Fs.weibo.com%2F');
  await humanDelay(2000, 5000);

  // 访问微博搜索页面
  await page.goto('https://s.weibo.com/');
  await humanDelay(2000, 5000);

  // 点击搜索框
  const searchBox = await page.getByRole('textbox');
  await searchBox.click();
  await humanDelay(1000, 3000);

  // 模拟人类输入
  await searchBox.press('CapsLock');
  await humanDelay(1000, 3000);
  await searchBox.fill('hello');
  await humanDelay(1000, 3000);
  await searchBox.press('CapsLock');
  await humanDelay(1000, 3000);
  await searchBox.fill('hello world');
  await humanDelay(1000, 3000);

  // 点击搜索按钮
  const searchButton = await page.getByRole('button', { name: '搜索' });
  await searchButton.click();
  await humanDelay(3000, 7000);

  // 获取搜索结果
  const results = await page.$$eval('.card-wrap', cards => {
    return cards.map(card => {
      const title = card.querySelector('.content .title')?.innerText.trim() || '';
      const content = card.querySelector('.content .txt')?.innerText.trim() || '';
      return { title, content };
    });
  });

  // 保存结果到json文件
  fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
});