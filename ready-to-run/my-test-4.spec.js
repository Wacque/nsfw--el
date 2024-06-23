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
        const link = card.querySelector('.content .title a')?.href || '';
        const username = card.querySelector('.content .info .name')?.innerText || '';
        const weiboUrl = card.querySelector('.content .from a')?.href || '';
        const forwards = card.querySelector('.woo-box-flex.woo-box-alignCenter.woo-box-justifyCenter')?.innerText || '0';
        const publishTime = card.querySelector('.content .from a')?.innerText || '';

        return { title, content, comments, likes, link, username, weiboUrl, forwards, publishTime };
      });
    });

    // Create a write stream for the results file
    const writeStream = fs.createWriteStream('result.json', { flags: 'a' });
    writeStream.write('[');

    // Iterate through each result to fetch comments and region info
    for (let i = 0; i < results.length; i++) {
      const card = (await page.$$('.card-wrap'))[i];
      const commentsLink = await card.$('.card-act ul li:nth-child(2) a');
      if (commentsLink) {
        await commentsLink.click();
        await card.waitForSelector('.list[node-type="feed_list_commentList"] .card-review', { timeout: 5000 }).catch(() => {}); // 等待评论加载，超时为5秒

        // Collect the first 3 comments
        results[i].topComments = await card.$$eval('.list[node-type="feed_list_commentList"] .card-review', commentElements => {
          return commentElements.slice(0, 3).map(comment => {
            const commentUser = comment.querySelector('.name')?.innerText || '';
            const commentText = comment.querySelector('.txt')?.innerText || '';
            return { commentUser, commentText };
          });
        }) || [];
      } else {
        results[i].topComments = [];
      }

      // Navigate to the weibo page to get region info
      if (results[i].weiboUrl) {
        const newPage = await page.context().newPage();
        await newPage.goto(results[i].weiboUrl);
        await newPage.waitForTimeout(Math.random() * 2000 + 1000);

        // Save screenshot
        const screenshotPath = `screenshots/weibo_${i + 1}.png`;
        await newPage.screenshot({ path: screenshotPath });
        results[i].screenshot = screenshotPath;

        const region = await newPage.$eval('.head-info_ip_3ywCW', el => el.innerText.replace('发布于', '').trim()).catch(() => '');
        results[i].region = region;

        await newPage.close();
      } else {
        results[i].region = '';
        results[i].screenshot = '';
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
