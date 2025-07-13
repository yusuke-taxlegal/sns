const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

(async () => {
    const htmlFilePath = path.resolve(__dirname, 'AI大工/若奈/成果物/presentation.html');
    const outputDir = path.resolve(__dirname, 'AI大工/若奈/成果物');

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    console.log(`Navigating to ${htmlFilePath}`);
    await page.goto(`file://${htmlFilePath}`, { waitUntil: 'networkidle0' });

    // Set viewport to the presentation size
    await page.setViewport({
        width: 1080,
        height: 1080,
    });

    const slideCount = await page.evaluate(() => {
        return document.querySelectorAll('.slide').length;
    });
    console.log(`Found ${slideCount} slides.`);

    for (let i = 0; i < slideCount; i++) {
        console.log(`Processing slide ${i + 1}...`);
        await page.evaluate((index) => {
            const slides = document.querySelectorAll('.slide');
            slides.forEach((slide, idx) => {
                slide.classList.toggle('active', idx === index);
            });
        }, i);

        // Wait for slide transition
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const slideElement = await page.$('.presentation-container');
        if (slideElement) {
            const outputPath = path.join(outputDir, `slide-${i + 1}.png`);
            await slideElement.screenshot({
                path: outputPath,
                omitBackground: true
            });
            console.log(`Saved screenshot to ${outputPath}`);
        } else {
            console.log(`Could not find .presentation-container for slide ${i + 1}`);
        }
    }

    await browser.close();
    console.log('All slides captured. Browser closed.');
})(); 