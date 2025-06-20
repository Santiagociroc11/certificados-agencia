import express from 'express';
import { loadTemplate, loadAllTemplates, saveTemplate } from '../services/templateService.js';

const router = express.Router();

// GET /api/templates
// Get all available templates
router.get('/', async (req, res) => {
    try {
        const templates = await loadAllTemplates();
        res.json({
            success: true,
            templates,
            count: templates.length
        });
    } catch (error) {
        console.error('Error loading templates:', error);
        res.status(500).json({
            error: 'Failed to load templates',
            message: error.message
        });
    }
});

// GET /api/templates/:id
// Get a specific template by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await loadTemplate(id);
        
        if (!template) {
            return res.status(404).json({
                error: 'Template not found',
                template_id: id
            });
        }

        res.json({
            success: true,
            template
        });
    } catch (error) {
        console.error('Error loading template:', error);
        res.status(500).json({
            error: 'Failed to load template',
            message: error.message
        });
    }
});

// GET /api/templates/:id/variables
// Get all variables used in a template
router.get('/:id/variables', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await loadTemplate(id);
        
        if (!template) {
            return res.status(404).json({
                error: 'Template not found',
                template_id: id
            });
        }

        // Extract variables from template elements
        const variables = new Set();
        template.elements.forEach(element => {
            const matches = element.content.match(/\{(\w+)\}/g);
            if (matches) {
                matches.forEach(match => {
                    const variable = match.slice(1, -1); // Remove { and }
                    variables.add(variable);
                });
            }
        });

        res.json({
            success: true,
            template_id: id,
            template_name: template.name,
            variables: Array.from(variables),
            count: variables.size
        });
    } catch (error) {
        console.error('Error extracting template variables:', error);
        res.status(500).json({
            error: 'Failed to extract template variables',
            message: error.message
        });
    }
});

// POST /api/templates/sync
// Sync templates from frontend localStorage (for development)
router.post('/sync', async (req, res) => {
    try {
        const { templates } = req.body;
        
        if (!templates || !Array.isArray(templates)) {
            return res.status(400).json({
                error: 'Invalid templates data. Expected an array of templates.'
            });
        }

        // Save each template
        const results = [];
        for (const template of templates) {
            try {
                await saveTemplate(template);
                results.push({ id: template.id, status: 'saved' });
            } catch (error) {
                results.push({ id: template.id, status: 'error', error: error.message });
            }
        }

        res.json({
            success: true,
            message: 'Templates sync completed',
            results,
            synced: results.filter(r => r.status === 'saved').length,
            errors: results.filter(r => r.status === 'error').length
        });

    } catch (error) {
        console.error('Error syncing templates:', error);
        res.status(500).json({
            error: 'Failed to sync templates',
            message: error.message
        });
    }
});

export default router; 