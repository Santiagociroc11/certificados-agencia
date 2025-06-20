import { fabric } from 'fabric';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load image from URL or local path into a buffer
async function loadImage(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

// Main generation function
export async function generateCertificate(template, data, certificateId) {
    console.log(`[FABRIC_GEN] Starting certificate generation for ID: ${certificateId}`);

    const width = parseInt(template.width) || 800;
    const height = parseInt(template.height) || 600;

    // Create a virtual canvas
    const canvas = new fabric.StaticCanvas(null, { width, height });

    // Handle background
    const backgroundUrl = template.backgroundUrl || template.background?.value;
    if (backgroundUrl) {
        try {
            const bgImage = await fabric.Image.fromURL(backgroundUrl);
            canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas), {
                scaleX: width / bgImage.width,
                scaleY: height / bgImage.height,
            });
        } catch (error) {
            console.error(`[FABRIC_GEN] Failed to load background image: ${error.message}`);
            // Fallback to color if image fails
            canvas.backgroundColor = template.backgroundColor || '#FFFFFF';
        }
    } else {
        canvas.backgroundColor = template.backgroundColor || '#FFFFFF';
    }

    // Add elements to canvas
    for (const element of template.elements) {
        let content = element.content || element.text || '';
        if (element.type === 'text') {
            const regex = /\{(.+?)\}/g;
            content = content.replace(regex, (match, variable) => {
                return data[variable.trim()] || match;
            });
        }

        const style = element.style || {};
        const config = {
            left: element.position?.x || element.x || 0,
            top: element.position?.y || element.y || 0,
            width: element.size?.width || element.width,
            height: element.size?.height || element.height,
            fill: style.color || element.fill || '#000000',
            fontFamily: style.fontFamily || element.fontFamily || 'Arial',
            fontSize: style.fontSize || element.fontSize || 16,
            fontWeight: style.fontWeight || 'normal',
            fontStyle: style.fontStyle || 'normal',
            textAlign: style.textAlign || 'left',
            angle: element.angle || 0,
            originX: 'left',
            originY: 'top'
        };

        if (element.type === 'text') {
            const textbox = new fabric.Textbox(content, config);
            canvas.add(textbox);
        } else if (element.type === 'image') {
            try {
                const imageUrl = element.content || element.src;
                if (imageUrl) {
                    const img = await fabric.Image.fromURL(imageUrl, config);
                    canvas.add(img);
                }
            } catch (error) {
                console.error(`[FABRIC_GEN] Failed to load element image: ${error.message}`);
            }
        }
    }

    // Render canvas and get PNG data
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const imageBuffer = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    
    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([width, height]);
    const pngImage = await pdfDoc.embedPng(imageBuffer);
    
    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
    });

    // Save PDF
    const generatedDir = path.join(__dirname, '..', 'generated');
    await fs.ensureDir(generatedDir);
    const pdfPath = path.join(generatedDir, `certificate_${certificateId}.pdf`);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(pdfPath, pdfBytes);

    console.log(`[FABRIC_GEN] PDF successfully written to disk at: ${pdfPath}`);
    
    // Construct public URL
    const baseUrl = process.env.PUBLIC_BASE_URL;
    if (!baseUrl) {
        console.warn('[FABRIC_GEN] WARNING: PUBLIC_BASE_URL is not set. Using localhost fallback.');
    }
    const publicUrl = `${baseUrl || `http://localhost:${process.env.PORT || 3001}`}/certificates/certificate_${certificateId}.pdf`;
    
    return { 
        filePath: pdfPath, 
        downloadUrl: publicUrl 
    };
} 