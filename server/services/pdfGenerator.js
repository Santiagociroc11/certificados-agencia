import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the generated certificates directory exists
const GENERATED_DIR = path.join(__dirname, '..', 'generated');
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

async function ensureDirectoryExists() {
    try {
        await fs.access(GENERATED_DIR);
    } catch {
        await fs.mkdir(GENERATED_DIR, { recursive: true });
    }
}

/**
 * Generate a PDF certificate from a template with dynamic data
 * @param {Object} template - The certificate template
 * @param {Object} data - Dynamic data to replace variables
 * @param {string} certificateId - Unique certificate ID
 * @returns {Object} Result with file path and download URL
 */
export async function generateCertificatePDF(template, data, certificateId) {
    console.log(`[PDF_GEN] Starting certificate generation for ID: ${certificateId}`);
    
    await ensureDirectoryExists();
    console.log('[PDF_GEN] Temp directories ensured.');

    let browser;
    try {
        console.log('[PDF_GEN] Launching Puppeteer browser with compatibility args...');
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/chromium-browser',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        console.log('[PDF_GEN] Puppeteer browser launched successfully.');

        const page = await browser.newPage();
        console.log('[PDF_GEN] New page created.');
        
        await page.setViewport({
            width: 794,
            height: 561,
            deviceScaleFactor: 2
        });
        console.log('[PDF_GEN] Viewport set.');

        console.log('[PDF_GEN] Generating certificate HTML...');
        const html = generateCertificateHTML(template, data);
        console.log('[PDF_GEN] HTML generated successfully.');
        
        console.log('[PDF_GEN] Setting page content...');
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'load'],
            timeout: 60000 // Increased timeout just in case
        });
        console.log('[PDF_GEN] Page content set.');

        console.log('[PDF_GEN] Waiting for fonts to be ready...');
        await page.evaluateHandle('document.fonts.ready');
        console.log('[PDF_GEN] Fonts are ready.');

        const filename = `certificate_${certificateId}.pdf`;
        const filePath = path.join(GENERATED_DIR, filename);
        console.log(`[PDF_GEN] Preparing to write PDF to: ${filePath}`);
        
        await page.pdf({
            path: filePath,
            width: '794px',
            height: '561px',
            printBackground: true,
            pageRanges: '1'
        });
        console.log(`[PDF_GEN] PDF successfully written to disk at: ${filePath}`);

        const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
        const downloadUrl = `${publicBaseUrl}/certificates/${filename}`;
        console.log(`[PDF_GEN] Generated download URL: ${downloadUrl}`);

        return { filePath, downloadUrl, filename };

    } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!! [PDF_GEN_ERROR] A critical error occurred during PDF generation !!!');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
        if (browser) {
            console.log('[PDF_GEN] Closing browser...');
            await browser.close();
            console.log('[PDF_GEN] Browser closed.');
        }
    }
}

/**
 * Generate HTML for a certificate from template and data
 * @param {Object} template - Certificate template
 * @param {Object} data - Dynamic data
 * @returns {string} HTML string
 */
function generateCertificateHTML(template, data) {
    // 1. Process elements and replace variables
    const processedElements = template.elements.map(element => {
        let content = element.content;
        Object.keys(data).forEach(key => {
            const placeholder = `{${key}}`;
            const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
            content = content.replace(regex, data[key] || '');
        });
        return { ...element, content };
    });

    // 2. Generate font loading logic
    const fonts = [...new Set(template.elements
        .filter(el => el.type === 'text' && el.style.fontFamily)
        .map(el => el.style.fontFamily.replace(/\s/g, '+'))
    )];
    
    const fontLink = fonts.length > 0
        ? `<link href="https://fonts.googleapis.com/css2?family=${fonts.join('&family=')}:wght@400;700&display=swap" rel="stylesheet">`
        : '';
        
    // 3. Generate CSS for background
    const backgroundStyle = template.backgroundUrl 
        ? `background-image: url('${template.backgroundUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : template.backgroundColor 
            ? `background-color: ${template.backgroundColor};`
            : 'background-color: #ffffff;';

    // 4. Generate the final HTML
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate</title>
        ${fontLink}
        <style>
            /* Reset and base styles */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                width: 794px; /* Match canvas size */
                height: 561px; /* Match canvas size */
                ${backgroundStyle}
                position: relative;
                overflow: hidden;
                font-family: Arial, sans-serif; /* Default fallback font */
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .certificate-container {
                width: 100%;
                height: 100%;
                position: relative;
            }
            .element-wrapper {
                position: absolute;
                display: flex; /* Use flexbox for vertical alignment */
                flex-direction: column; /* Align content vertically */
            }
            .image-element {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        </style>
    </head>
    <body>
        <div class="certificate-container">
            ${processedElements.map(element => {
                // Map vertical alignment to flexbox justify-content
                let justifyContent = 'flex-start'; // Default: top
                if (element.style.verticalAlign === 'middle') justifyContent = 'center';
                if (element.style.verticalAlign === 'bottom') justifyContent = 'flex-end';
                
                const style = `
                    left: ${element.position.x}px;
                    top: ${element.position.y}px;
                    width: ${element.size.width}px;
                    height: ${element.size.height}px;
                    
                    /* Text styles */
                    font-family: '${element.style.fontFamily || 'Arial'}', sans-serif;
                    font-size: ${element.style.fontSize || 16}px;
                    font-weight: ${element.style.fontWeight || 'normal'};
                    font-style: ${element.style.fontStyle || 'normal'};
                    color: ${element.style.color || '#000000'};
                    text-align: ${element.style.textAlign || 'left'};
                    line-height: ${element.style.lineHeight || 1.2};
                    letter-spacing: ${element.style.letterSpacing || 0}px;
                    ${element.style.textDecoration ? `text-decoration: ${element.style.textDecoration};` : ''}

                    /* Flexbox for vertical alignment */
                    justify-content: ${justifyContent};
                `;

                if (element.type === 'text') {
                    // The text-align property on the wrapper div handles horizontal alignment
                    return `<div class="element-wrapper" style="${style}">${element.content}</div>`;
                } else if (element.type === 'image') {
                    return `<div class="element-wrapper" style="${style}"><img class="image-element" src="${element.content}" alt="Certificate Element" /></div>`;
                }
                return '';
            }).join('')}
        </div>
        <!-- Font loading trick for Puppeteer -->
        ${fonts.map(font => `<div style="font-family: '${font.replace(/\+/g, ' ')}'; position:absolute; top:-9999px;">.</div>`).join('')}
    </body>
    </html>
    `;

    return html;
}

export { generateCertificateHTML }; 