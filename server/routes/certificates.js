import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateCertificatePDF } from '../services/pdfGenerator.js';
import { loadTemplate } from '../services/templateService.js';
import { saveCertificateRecord } from '../services/certificateStorage.js';
import pLimit from 'p-limit';

const router = express.Router();

// Limit concurrency to 1. Only one PDF will be generated at a time.
const limit = pLimit(1);

// POST /api/certificates/generate
// Generate a certificate from a template with dynamic data
router.post('/generate', async (req, res) => {
    try {
        const { template_id, data, recipient_name, webhook_url } = req.body;

        // Validation
        if (!template_id) {
            return res.status(400).json({
                error: 'Missing required field: template_id'
            });
        }

        if (!data || typeof data !== 'object') {
            return res.status(400).json({
                error: 'Missing or invalid field: data (must be an object with variable mappings)'
            });
        }

        // Load template
        const template = await loadTemplate(template_id);
        if (!template) {
            return res.status(404).json({
                error: 'Template not found',
                template_id
            });
        }

        // Wrap the entire generation process in the limiter
        const generationPromise = limit(async () => {
            console.log('[QUEUE] Picked a new certificate request from the queue. Starting processing...');
            const certificateId = uuidv4();
            
            const pdfResult = await generateCertificatePDF(template, data, certificateId);
            
            const certificateRecord = {
                id: certificateId,
                templateId: template_id,
                recipientName: recipient_name || data.nombre_completo || data.name || 'Unknown',
                data,
                generatedAt: new Date().toISOString(),
                validationCode: uuidv4().substring(0, 8).toUpperCase(),
                status: 'generated',
                downloadUrl: pdfResult.downloadUrl,
                filePath: pdfResult.filePath
            };
            
            await saveCertificateRecord(certificateRecord);
            console.log(`[QUEUE] Finished processing for certificate ${certificateId}.`);
            
            return {
                success: true,
                certificate: {
                    id: certificateId,
                    validation_code: certificateRecord.validationCode,
                    download_url: pdfResult.downloadUrl,
                    recipient_name: certificateRecord.recipientName,
                    generated_at: certificateRecord.generatedAt,
                    template_id: template_id
                },
                message: 'Certificate generated successfully'
            };
        });

        // The request is now in the queue. We await its completion.
        const result = await generationPromise;
        
        // Call webhook if provided
        if (webhook_url) {
            try {
                const webhookPayload = {
                    certificate_id: result.certificate.id,
                    validation_code: result.certificate.validation_code,
                    download_url: result.certificate.download_url,
                    recipient_name: result.certificate.recipient_name,
                    generated_at: result.certificate.generated_at,
                    template_id: result.certificate.template_id,
                    status: 'success'
                };

                await fetch(webhook_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(webhookPayload)
                });
            } catch (webhookError) {
                console.warn('Webhook call failed:', webhookError.message);
                // Don't fail the entire request if webhook fails
            }
        }

        res.status(201).json(result);

    } catch (error) {
        console.error('Certificate generation error:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate certificate', details: error.message });
    }
});

// GET /api/certificates/:id
// Get certificate details by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // This would typically query a database
        // For now, we'll return a simple response
        res.json({
            id,
            message: 'Certificate lookup not yet implemented',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Certificate lookup error:', error);
        res.status(500).json({
            error: 'Failed to lookup certificate',
            message: error.message
        });
    }
});

// GET /api/certificates/validate/:code
// Validate a certificate by its validation code
router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        // This would typically query a database
        res.json({
            validation_code: code,
            message: 'Certificate validation not yet implemented',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Certificate validation error:', error);
        res.status(500).json({
            error: 'Failed to validate certificate',
            message: error.message
        });
    }
});

// POST /api/certificates/bulk-generate
// Generate multiple certificates from a template
router.post('/bulk-generate', async (req, res) => {
    try {
        const { template_id, recipients, webhook_url } = req.body;

        if (!template_id || !recipients || !Array.isArray(recipients)) {
            return res.status(400).json({
                error: 'Missing required fields: template_id and recipients (array)'
            });
        }

        const results = [];
        const errors = [];

        for (const recipient of recipients) {
            try {
                const result = await generateSingleCertificate(template_id, recipient.data, recipient.name);
                results.push(result);
            } catch (error) {
                errors.push({
                    recipient: recipient.name || 'Unknown',
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            generated: results.length,
            errors: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Bulk generation error:', error);
        res.status(500).json({
            error: 'Failed to generate certificates',
            message: error.message
        });
    }
});

async function generateSingleCertificate(templateId, data, recipientName) {
    const template = await loadTemplate(templateId);
    const certificateId = uuidv4();
    const validationCode = uuidv4().substring(0, 8).toUpperCase();
    
    const pdfResult = await generateCertificatePDF(template, data, certificateId);
    
    const certificateRecord = {
        id: certificateId,
        templateId,
        recipientName: recipientName || data.nombre_completo || data.name || 'Unknown',
        data,
        generatedAt: new Date(),
        validationCode,
        status: 'generated',
        downloadUrl: pdfResult.downloadUrl,
        filePath: pdfResult.filePath
    };

    await saveCertificateRecord(certificateRecord);
    return certificateRecord;
}

export default router; 