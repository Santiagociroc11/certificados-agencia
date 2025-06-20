import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template storage directory
const TEMPLATES_DIR = path.join(__dirname, '..', 'data', 'templates');
const TEMPLATES_FILE = path.join(TEMPLATES_DIR, 'templates.json');

// Default templates (same as frontend)
const defaultTemplates = [
    {
        id: 'template-formal-classic',
        name: 'Certificado Formal',
        description: 'Un diseño clásico y elegante para ocasiones formales.',
        backgroundUrl: 'https://i.imgur.com/3q1ZzLg.png',
        elements: [
            {
                id: 'el-1-1',
                type: 'text',
                content: 'Certificado de Asistencia',
                position: { x: 200, y: 50 },
                size: { width: 400, height: 60 },
                style: { fontFamily: 'Georgia', fontSize: 36, fontWeight: 'bold', textAlign: 'center' },
            },
            {
                id: 'el-1-2',
                type: 'text',
                content: 'Este certificado se otorga a:',
                position: { x: 250, y: 150 },
                size: { width: 300, height: 30 },
                style: { fontFamily: 'Georgia', fontSize: 18, textAlign: 'center' },
            },
            {
                id: 'el-1-3',
                type: 'text',
                content: '{nombre_completo}',
                position: { x: 150, y: 200 },
                size: { width: 500, height: 70 },
                style: { fontFamily: 'Times New Roman', fontSize: 48, fontWeight: 'bold', color: '#2c5282', textAlign: 'center' },
            },
            {
                id: 'el-1-4',
                type: 'text',
                content: 'Por su asistencia y participación en el evento:',
                position: { x: 200, y: 300 },
                size: { width: 400, height: 30 },
                style: { fontFamily: 'Georgia', fontSize: 18, textAlign: 'center' },
            },
            {
                id: 'el-1-5',
                type: 'text',
                content: '{nombre_del_evento}',
                position: { x: 200, y: 350 },
                size: { width: 400, height: 50 },
                style: { fontFamily: 'Georgia', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
            },
            {
                id: 'el-1-6',
                type: 'text',
                content: 'Realizado el {fecha_del_evento}',
                position: { x: 250, y: 420 },
                size: { width: 300, height: 30 },
                style: { fontFamily: 'Georgia', fontSize: 16, textAlign: 'center' },
            },
        ],
    },
    {
        id: 'template-modern-minimalist',
        name: 'Certificado Moderno',
        description: 'Un diseño limpio y moderno, ideal para startups y eventos tecnológicos.',
        backgroundUrl: 'https://i.imgur.com/8fSJgE8.png',
        elements: [
            {
                id: 'el-2-1',
                type: 'image',
                content: 'https://i.imgur.com/d2Jc21Y.png',
                position: { x: 50, y: 40 },
                size: { width: 120, height: 50 },
                style: {},
            },
            {
                id: 'el-2-2',
                type: 'text',
                content: 'CERTIFICADO DE ASISTENCIA',
                position: { x: 50, y: 140 },
                size: { width: 400, height: 40 },
                style: { fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
            },
            {
                id: 'el-2-3',
                type: 'text',
                content: '{nombre_completo}',
                position: { x: 50, y: 200 },
                size: { width: 600, height: 60 },
                style: { fontFamily: 'Arial', fontSize: 48, fontWeight: 'bold', color: '#2B6CB0' },
            },
            {
                id: 'el-2-4',
                type: 'text',
                content: 'Asistió a: {nombre_del_evento}',
                position: { x: 50, y: 300 },
                size: { width: 500, height: 30 },
                style: { fontFamily: 'Arial', fontSize: 18, color: '#4A5568' },
            },
            {
                id: 'el-2-5',
                type: 'text',
                content: 'Fecha: {fecha_del_evento}',
                position: { x: 50, y: 340 },
                size: { width: 500, height: 30 },
                style: { fontFamily: 'Arial', fontSize: 18, color: '#4A5568' },
            },
        ],
    },
    {
        id: 'template-creative-vibrant',
        name: 'Certificado Creativo',
        description: 'Un diseño vibrante y divertido para eventos más informales.',
        backgroundUrl: 'https://i.imgur.com/T0ZkX1z.png',
        elements: [
            {
                id: 'el-3-1',
                type: 'text',
                content: '¡Gracias por Asistir!',
                position: { x: 100, y: 80 },
                size: { width: 600, height: 80 },
                style: { fontFamily: 'Verdana', fontSize: 52, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
            },
            {
                id: 'el-3-2',
                type: 'text',
                content: '{nombre_completo}',
                position: { x: 100, y: 200 },
                size: { width: 600, height: 60 },
                style: { fontFamily: 'Verdana', fontSize: 40, color: '#FFFFFF', textAlign: 'center' },
            },
            {
                id: 'el-3-3',
                type: 'text',
                content: 'estuvo presente en',
                position: { x: 100, y: 280 },
                size: { width: 600, height: 30 },
                style: { fontFamily: 'Verdana', fontSize: 20, color: '#EBF8FF', textAlign: 'center' },
            },
            {
                id: 'el-3-4',
                type: 'text',
                content: '{nombre_del_evento}',
                position: { x: 100, y: 330 },
                size: { width: 600, height: 50 },
                style: { fontFamily: 'Verdana', fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
            },
            {
                id: 'el-3-5',
                type: 'text',
                content: 'el {fecha_del_evento}',
                position: { x: 100, y: 400 },
                size: { width: 600, height: 30 },
                style: { fontFamily: 'Verdana', fontSize: 20, color: '#EBF8FF', textAlign: 'center' },
            },
        ],
    },
];

// Ensure templates directory exists
async function ensureTemplatesDirectory() {
    try {
        await fs.access(TEMPLATES_DIR);
    } catch {
        await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    }
}

/**
 * Load all templates
 * @returns {Array} Array of templates
 */
export async function loadAllTemplates() {
    await ensureTemplatesDirectory();
    
    try {
        const data = await fs.readFile(TEMPLATES_FILE, 'utf8');
        const templates = JSON.parse(data);
        return Array.isArray(templates) && templates.length > 0 ? templates : defaultTemplates;
    } catch (error) {
        // If file doesn't exist or is invalid, return default templates
        console.log('Using default templates:', error.message);
        await saveAllTemplates(defaultTemplates);
        return defaultTemplates;
    }
}

/**
 * Load a specific template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export async function loadTemplate(templateId) {
    const templates = await loadAllTemplates();
    return templates.find(template => template.id === templateId) || null;
}

/**
 * Save a single template
 * @param {Object} template - Template to save
 */
export async function saveTemplate(template) {
    const templates = await loadAllTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
        // Update existing template
        templates[existingIndex] = template;
        console.log(`Updated existing template: ${template.name}`);
    } else {
        // Add new template
        templates.push(template);
        console.log(`Added new template: ${template.name}`);
    }
    
    await saveAllTemplates(templates);
}

/**
 * Save all templates to file
 * @param {Array} templates - Array of templates
 */
export async function saveAllTemplates(templates) {
    await ensureTemplatesDirectory();
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8');
}

/**
 * Delete a template by ID
 * @param {string} templateId - Template ID to delete
 */
export async function deleteTemplate(templateId) {
    const templates = await loadAllTemplates();
    const filteredTemplates = templates.filter(t => t.id !== templateId);
    await saveAllTemplates(filteredTemplates);
} 