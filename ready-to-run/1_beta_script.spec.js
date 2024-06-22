import { test, expect } from '@playwright/test';
import fs from 'fs';

test.use({
  storageState: '/Users/wurengui/Code/code-self/nsfmw/electron-react-boilerplate/auth/auth.json'
});

test('test', async ({ page }) => {
  // 模拟人类行为的延迟函数
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // 访问微博搜索页面
  await page.goto('https://s.weibo.com/');
  await delay(2000); // 等待2秒，模拟人类思考时间

  // 点击搜索框
  const searchBox = await page.getByRole('textbox');
  await searchBox.click();
  await delay(1000); // 等待1秒，模拟人类行为

  // 填写搜索内容
  await searchBox.fill('理想汽车');
  await delay(500); // 等待0.5秒，模拟人类行为

  // 按下回车键进行搜索
  await searchBox.press('Enter');
  await delay(3000); // 等待3秒，等待搜索结果加载

  // 获取搜索结果
  const results = await page.$$eval('.card-wrap', cards => {
    return cards.map(card => {
      const title = card.querySelector('.content .title')?.innerText || '';
      const content = card.querySelector('.content .txt')?.innerText || '';
      return { title, content };
    });
  });

  // 将结果保存到result.json文件中
  fs.writeFileSync('result.json', JSON.stringify(results, null, 2));

  // 断言搜索结果不为空
  expect(results.length).toBeGreaterThan(0);
});