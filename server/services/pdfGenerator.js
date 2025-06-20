import puppeteer from 'puppeteer-core';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let browserInstance;

const LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-features=site-per-process'
];


export async function initializeBrowser() {
    if (browserInstance) {
        return;
    }
    console.log('[PUPPETEER_MANAGER] Initializing new browser instance...');
    try {
        browserInstance = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/chromium-browser',
            args: LAUNCH_ARGS
        });
        console.log('[PUPPETEER_MANAGER] Browser initialized successfully.');
        browserInstance.on('disconnected', () => {
            console.error('[PUPPETEER_MANAGER] Browser disconnected unexpectedly. Shutting down server.');
            process.exit(1);
        });
    } catch (error) {
        console.error('[PUPPETEER_MANAGER] Failed to initialize browser:', error);
        throw error;
    }
}

export function getBrowser() {
    if (!browserInstance) {
        throw new Error('Browser is not initialized. Please call initializeBrowser() first.');
    }
    return browserInstance;
}

export async function closeBrowser() {
    if (browserInstance) {
        console.log('[PUPPETEER_MANAGER] Closing browser instance...');
        await browserInstance.close();
        browserInstance = null;
        console.log('[PUPPETEER_MANAGER] Browser closed successfully.');
    }
}

export async function generateCertificatePDF(template, data, certificateId) {
    console.log(`[PDF_GEN] Starting certificate generation for ID: ${certificateId}`);

    const tempDir = path.join(__dirname, '..', 'temp');
    const generatedDir = path.join(__dirname, '..', 'generated');
    await fs.ensureDir(tempDir);
    await fs.ensureDir(generatedDir);
    console.log('[PDF_GEN] Temp directories ensured.');

    const browser = getBrowser(); // Get the shared browser instance
    let page;

    try {
        page = await browser.newPage();
        console.log('[PDF_GEN] New page created.');

        // Ensure we have valid dimensions, use defaults if not provided
        const width = parseInt(template.width) || 800;
        const height = parseInt(template.height) || 600;
        
        console.log(`[PDF_GEN] Setting viewport to: ${width}x${height}`);
        await page.setViewport({ width, height });
        console.log('[PDF_GEN] Viewport set.');

        console.log('[PDF_GEN] Generating certificate HTML...');
        const htmlContent = generateCertificateHTML(template, data, width, height);
        console.log('[PDF_GEN] HTML generated successfully.');

        console.log('[PDF_GEN] Setting page content...');
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        console.log('[PDF_GEN] Page content set.');
        
        console.log('[PDF_GEN] Waiting for fonts to be ready...');
        await page.evaluateHandle('document.fonts.ready');
        console.log('[PDF_GEN] Fonts are ready.');
        
        const pdfPath = path.join(generatedDir, `certificate_${certificateId}.pdf`);
        console.log(`[PDF_GEN] Preparing to write PDF to: ${pdfPath}`);

        await page.pdf({
            path: pdfPath,
            width: `${width}px`,
            height: `${height}px`,
            printBackground: true,
            pageRanges: '1',
        });
        console.log(`[PDF_GEN] PDF successfully written to disk at: ${pdfPath}`);

        // Construct the public URL for the certificate
        const baseUrl = process.env.PUBLIC_BASE_URL;
        if (!baseUrl) {
            console.warn('[PDF_GEN] WARNING: PUBLIC_BASE_URL environment variable is not set. Using localhost fallback.');
        }
        const publicUrl = `${baseUrl || `http://localhost:${process.env.PORT || 3001}`}/certificates/certificate_${certificateId}.pdf`;
        console.log(`[PDF_GEN] Generated download URL: ${publicUrl}`);

        return { 
            filePath: pdfPath, 
            downloadUrl: publicUrl 
        };
    } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!! [PDF_GEN_ERROR] A critical error occurred during PDF generation !!!');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
        if (page) {
            console.log('[PDF_GEN] Closing page...');
            await page.close();
            console.log('[PDF_GEN] Page closed.');
        }
        // We no longer close the browser here
    }
}

function generateCertificateHTML(template, data, width = 800, height = 600) {
    const googleFonts = template.elements
        .filter(el => el.type === 'text' && el.style?.fontFamily)
        .map(el => el.style.fontFamily)
        .filter((value, index, self) => self.indexOf(value) === index);

    const fontLinks = googleFonts.map(font => 
        `<link href="https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">`
    ).join('\n');

    let bodyStyles = `
        width: ${width}px;
        height: ${height}px;
        margin: 0;
        padding: 0;
        position: relative;
        overflow: hidden;
    `;

    // Handle background (check both old and new template formats)
    if (template.backgroundColor) {
        bodyStyles += `background-color: ${template.backgroundColor};`;
    } else if (template.backgroundUrl) {
        bodyStyles += `
            background-image: url('${template.backgroundUrl}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        `;
    } else if (template.background?.type === 'color') {
        bodyStyles += `background-color: ${template.background.value};`;
    } else if (template.background?.value) {
        bodyStyles += `
            background-image: url('${template.background.value}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        `;
    }

    const elementsHTML = template.elements.map(element => {
        let content = element.content || element.text || '';
        if (element.type === 'text') {
            const regex = /\{(.+?)\}/g;
            content = content.replace(regex, (match, variable) => {
                return data[variable.trim()] || match;
            });
        }

        // Handle both old and new template formats
        const x = element.position?.x || element.x || 0;
        const y = element.position?.y || element.y || 0;
        const width = element.size?.width || element.width || 100;
        const height = element.size?.height || element.height || 30;
        
        const style = element.style || {};
        const styles = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            font-family: '${style.fontFamily || element.fontFamily || 'Arial'}', sans-serif;
            font-size: ${style.fontSize || element.fontSize || 16}px;
            color: ${style.color || element.fill || '#000000'};
            font-weight: ${style.fontWeight || element.fontWeight || 'normal'};
            font-style: ${style.fontStyle || element.fontStyle || 'normal'};
            text-decoration: ${style.textDecoration || element.textDecoration || 'none'};
            line-height: ${style.lineHeight || element.lineHeight || 1.2};
            letter-spacing: ${style.letterSpacing ? style.letterSpacing / 1000 : (element.charSpacing ? element.charSpacing / 1000 : 0)}em;
            text-align: ${style.textAlign || element.textAlign || 'left'};
            transform: rotate(${element.angle || 0}deg);
            transform-origin: center center;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        if (element.type === 'image') {
            const src = element.content || element.src || '';
            return `<img src="${src}" style="${styles} object-fit: cover;" />`;
        }
        
        return `<div style="${styles}">${content}</div>`;
    }).join('\n');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-ag">
            <title>Certificate</title>
            ${fontLinks}
            <style>
                body {
                    ${bodyStyles}
                }
            </style>
        </head>
        <body>
            ${elementsHTML}
        </body>
        </html>
    `;
}

export { generateCertificateHTML }; 