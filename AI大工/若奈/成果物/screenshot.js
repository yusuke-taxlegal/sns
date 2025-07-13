const puppeteer = require('puppeteer');
const fs = require('fs');

const htmlFilePath = './presentation.html';
const outputDir = './';

(async () => {
    // 出力ディレクトリが存在しない場合は作成
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true, // ヘッドレスモードで実行
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // ビューポートを正方形（Instagram投稿サイズ）に設定
    await page.setViewport({ width: 1080, height: 1080 });

    // ローカルのHTMLファイルを開く
    const fileUrl = 'file://' + require('path').resolve(htmlFilePath);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // スライドの数を取得 (ここでは5枚と仮定)
    const slideCount = await page.evaluate(() => {
        return document.querySelectorAll('.slide').length;
    });

    console.log(`${slideCount}枚のスライドを検出しました。`);

    for (let i = 1; i <= slideCount; i++) {
        // i番目のスライドを表示状態にする
        await page.evaluate((slideIndex) => {
            document.querySelectorAll('.slide').forEach((slide, index) => {
                slide.classList.toggle('active', index === slideIndex - 1);
            });
        }, i);
        
        // スライドの描画を待つ
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const outputPath = `${outputDir}slide_${i}.png`;
        await page.screenshot({ path: outputPath });
        console.log(`スライド${i}を ${outputPath} に保存しました。`);
    }

    await browser.close();
    console.log('すべてのスライドのスクリーンショットが完了しました。');
})(); 