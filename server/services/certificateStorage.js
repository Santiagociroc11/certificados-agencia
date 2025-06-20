import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Certificate storage directory
const CERTIFICATES_DIR = path.join(__dirname, '..', 'data', 'certificates');
const CERTIFICATES_FILE = path.join(CERTIFICATES_DIR, 'certificates.json');

// Ensure certificates directory exists
async function ensureCertificatesDirectory() {
    try {
        await fs.access(CERTIFICATES_DIR);
    } catch {
        await fs.mkdir(CERTIFICATES_DIR, { recursive: true });
    }
}

/**
 * Load all certificate records
 * @returns {Array} Array of certificate records
 */
export async function loadAllCertificates() {
    await ensureCertificatesDirectory();
    
    try {
        const data = await fs.readFile(CERTIFICATES_FILE, 'utf8');
        const certificates = JSON.parse(data);
        return Array.isArray(certificates) ? certificates : [];
    } catch (error) {
        // If file doesn't exist or is invalid, return empty array
        console.log('No existing certificates found, starting fresh');
        return [];
    }
}

/**
 * Save a certificate record
 * @param {Object} certificate - Certificate record to save
 */
export async function saveCertificateRecord(certificate) {
    const certificates = await loadAllCertificates();
    
    // Add timestamp if not present
    if (!certificate.generatedAt) {
        certificate.generatedAt = new Date();
    }
    
    // Check if certificate already exists
    const existingIndex = certificates.findIndex(c => c.id === certificate.id);
    
    if (existingIndex >= 0) {
        certificates[existingIndex] = certificate;
    } else {
        certificates.push(certificate);
    }
    
    await saveAllCertificates(certificates);
    console.log(`Certificate saved: ${certificate.id} for ${certificate.recipientName}`);
}

/**
 * Load a specific certificate by ID
 * @param {string} certificateId - Certificate ID
 * @returns {Object|null} Certificate record or null if not found
 */
export async function loadCertificate(certificateId) {
    const certificates = await loadAllCertificates();
    return certificates.find(cert => cert.id === certificateId) || null;
}

/**
 * Load a certificate by validation code
 * @param {string} validationCode - Validation code
 * @returns {Object|null} Certificate record or null if not found
 */
export async function loadCertificateByValidationCode(validationCode) {
    const certificates = await loadAllCertificates();
    return certificates.find(cert => cert.validationCode === validationCode) || null;
}

/**
 * Save all certificates to file
 * @param {Array} certificates - Array of certificates
 */
export async function saveAllCertificates(certificates) {
    await ensureCertificatesDirectory();
    await fs.writeFile(CERTIFICATES_FILE, JSON.stringify(certificates, null, 2), 'utf8');
}

/**
 * Get certificates by template ID
 * @param {string} templateId - Template ID
 * @returns {Array} Array of certificates using the template
 */
export async function getCertificatesByTemplate(templateId) {
    const certificates = await loadAllCertificates();
    return certificates.filter(cert => cert.templateId === templateId);
}

/**
 * Get certificates by recipient name (partial match)
 * @param {string} recipientName - Recipient name to search
 * @returns {Array} Array of matching certificates
 */
export async function getCertificatesByRecipient(recipientName) {
    const certificates = await loadAllCertificates();
    const searchTerm = recipientName.toLowerCase();
    return certificates.filter(cert => 
        cert.recipientName.toLowerCase().includes(searchTerm)
    );
}

/**
 * Update certificate status
 * @param {string} certificateId - Certificate ID
 * @param {string} status - New status
 */
export async function updateCertificateStatus(certificateId, status) {
    const certificates = await loadAllCertificates();
    const certificateIndex = certificates.findIndex(c => c.id === certificateId);
    
    if (certificateIndex >= 0) {
        certificates[certificateIndex].status = status;
        certificates[certificateIndex].lastUpdated = new Date();
        await saveAllCertificates(certificates);
        return certificates[certificateIndex];
    }
    
    return null;
}

/**
 * Get certificate statistics
 * @returns {Object} Statistics about certificates
 */
export async function getCertificateStats() {
    const certificates = await loadAllCertificates();
    
    const stats = {
        total: certificates.length,
        byStatus: {
            generated: 0,
            sent: 0,
            verified: 0
        },
        byTemplate: {},
        thisMonth: 0,
        today: 0
    };
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    certificates.forEach(cert => {
        // Count by status
        if (stats.byStatus[cert.status] !== undefined) {
            stats.byStatus[cert.status]++;
        }
        
        // Count by template
        if (!stats.byTemplate[cert.templateId]) {
            stats.byTemplate[cert.templateId] = 0;
        }
        stats.byTemplate[cert.templateId]++;
        
        // Count this month
        const certDate = new Date(cert.generatedAt);
        if (certDate >= startOfMonth) {
            stats.thisMonth++;
        }
        
        // Count today
        if (certDate >= startOfDay) {
            stats.today++;
        }
    });
    
    return stats;
} 