import puppeteer from 'puppeteer';
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
    await ensureDirectoryExists();

    let browser;
    try {
        // Launch Puppeteer browser, pointing to the installed Chromium
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/chromium-browser', // Path for Alpine Chromium
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        const page = await browser.newPage();
        
        // Match viewport to editor canvas size for 1:1 mapping
        await page.setViewport({
            width: 794,
            height: 561,
            deviceScaleFactor: 2 // Use scale factor for high resolution text
        });

        // Generate HTML for the certificate
        const html = generateCertificateHTML(template, data);
        
        // Set the HTML content
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'load'],
            timeout: 30000
        });

        // IMPORTANT: Wait for all fonts to be loaded and ready
        await page.evaluateHandle('document.fonts.ready');

        // Generate PDF
        const filename = `certificate_${certificateId}.pdf`;
        const filePath = path.join(GENERATED_DIR, filename);
        
        await page.pdf({
            path: filePath,
            width: '794px', // Match viewport width
            height: '561px', // Match viewport height
            printBackground: true,
            pageRanges: '1',
        });

        const downloadUrl = `${PUBLIC_BASE_URL}/certificates/${filename}`;

        return {
            filePath,
            downloadUrl,
            filename
        };

    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
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