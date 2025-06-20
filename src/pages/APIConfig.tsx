import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Copy, Eye, Trash2, Globe, Key, Webhook, Send, Book } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useApp } from '../contexts/AppContext';
import { APIEndpoint, CertificateTemplate, CertificateElement } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CertificatePreview: React.FC<{ template: CertificateTemplate, variables: Record<string, string> }> = ({ template, variables }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Canvas dimensions from Editor (A4 ratio)
  const CANVAS_WIDTH = 794;
  const CANVAS_HEIGHT = 561;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        // Calculate scale based on container size vs canvas size
        const scaleX = containerWidth / CANVAS_WIDTH;
        const scaleY = containerHeight / CANVAS_HEIGHT;
        const newScale = Math.min(scaleX, scaleY);
        
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  const renderElement = (element: CertificateElement) => {
    let content = element.content;
    // Replace all variable placeholders with their values
    Object.keys(variables).forEach(key => {
        const placeholder = `{${key}}`;
        if (content.includes(placeholder)) {
            content = content.replace(new RegExp(placeholder, 'g'), variables[key]);
        }
    });

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${element.position.x * scale}px`,
        top: `${element.position.y * scale}px`,
        width: `${element.size.width * scale}px`,
        height: `${element.size.height * scale}px`,
        ...element.style,
        fontSize: `${(element.style.fontSize || 16) * scale}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    if (element.type === 'image') {
      return <img key={element.id} src={content} style={style} alt="certificate element" crossOrigin="anonymous" />;
    }
    return <div key={element.id} style={style}>{content}</div>;
  };

  const previewContainerStyle: React.CSSProperties = {
    backgroundColor: template.backgroundColor || '#ffffff',
    width: '100%',
    height: '100%',
    position: 'relative'
  };

  return (
    <div className="w-full aspect-[1.414/1] border-2 rounded-lg shadow-lg overflow-hidden bg-white">
      <div ref={containerRef} className="relative w-full h-full" style={previewContainerStyle}>
        {template.backgroundUrl && <img src={template.backgroundUrl} crossOrigin="anonymous" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, objectFit: 'cover' }} />}
        {template.elements.map(renderElement)}
      </div>
    </div>
  );
};

const APIDocumentation = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`;
    }
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL environment variable is not configured');
    }
    return `${apiBaseUrl}api`;
  };
  const baseUrl = getBaseUrl();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Book className="w-5 h-5 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Documentación de API</h2>
      </div>
      
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-8">
          {['overview', 'endpoints', 'examples'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' ? 'Resumen' : tab === 'endpoints' ? 'Endpoints' : 'Ejemplos'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">🚀 API de Generación de Certificados</h3>
            <p className="text-gray-600 mb-4">
              Nuestra API REST permite generar certificados automáticamente desde webhooks externos. 
              Perfecto para integrar con plataformas de eventos, LMS, o sistemas de registro.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800">Base URL</h4>
            <code className="bg-blue-100 px-2 py-1 rounded text-sm">{baseUrl}</code>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800">Flujo Principal</h4>
            <ol className="list-decimal list-inside space-y-1 text-green-700">
              <li>Crear plantillas en el editor</li>
              <li>Usar variables como {`{nombre_completo}`}, {`{nombre_del_evento}`}</li>
              <li>Enviar POST a /api/certificates/generate con datos dinámicos</li>
              <li>Recibir URL de descarga del PDF generado</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">POST</span>
              <code className="text-sm">/certificates/generate</code>
            </div>
            <p className="text-gray-600 mb-3">Genera un certificado desde una plantilla con datos dinámicos</p>
            
            <h5 className="font-semibold mb-2">Parámetros del body:</h5>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <pre>{`{
  "template_id": "ID_DE_LA_PLANTILLA",
  "data": {
    // ⚡ Las variables se extraen automáticamente de cada plantilla
    // Usa GET /api/templates/:id/variables para ver las variables requeridas
    "variable1": "valor1",
    "variable2": "valor2"
  },
  "recipient_name": "Nombre del destinatario",
  "webhook_url": "https://mi-sistema.com/webhook" (opcional)
}`}</pre>
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Cada plantilla puede tener diferentes variables como {`{nombre_completo}`}, {`{fecha_del_evento}`}, etc. 
                Usa el endpoint <code>/api/templates/:id/variables</code> para obtener la lista exacta de variables requeridas.
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">GET</span>
              <code className="text-sm">/api/templates</code>
            </div>
            <p className="text-gray-600">Obtiene todas las plantillas disponibles</p>
                        </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">GET</span>
              <code className="text-sm">/api/templates/:id/variables</code>
                        </div>
            <p className="text-gray-600 mb-3">Obtiene las variables requeridas por una plantilla específica</p>
            
            <h5 className="font-semibold mb-2">Respuesta de ejemplo:</h5>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <pre>{`{
  "success": true,
  "template_id": "template-formal-classic",
  "template_name": "Certificado Formal",
  "variables": [
    "nombre_completo",
    "nombre_del_evento", 
    "fecha_del_evento"
  ],
  "count": 3
}`}</pre>
                    </div>

            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-800">
                💡 <strong>Recomendación:</strong> Siempre consulta este endpoint antes de generar certificados 
                para conocer exactamente qué variables necesitas enviar.
              </p>
                          </div>
                        </div>
                      </div>
                    )}

      {activeTab === 'examples' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">📝 Flujo Completo de Ejemplo</h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-1">1️⃣ Primero, obtén las variables de la plantilla:</h5>
                <div className="bg-gray-900 text-blue-300 p-3 rounded-lg text-sm overflow-x-auto">
                  <pre>{`curl -X GET ${baseUrl}/templates/template-formal-classic/variables`}</pre>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-1">2️⃣ Luego, genera el certificado con los datos dinámicos:</h5>
                <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm overflow-x-auto">
                  <pre>{`curl -X POST ${baseUrl}/certificates/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "template-formal-classic",
    "data": {
      "nombre_completo": "María García",
      "nombre_del_evento": "Workshop de JavaScript",
      "fecha_del_evento": "20 de Enero, 2024"
    },
    "recipient_name": "María García"
  }'`}</pre>
                </div>
                      </div>
                    </div>
                  </div>

          <div>
            <h4 className="font-semibold mb-2">📱 Ejemplo con JavaScript</h4>
            <div className="bg-gray-900 text-blue-300 p-4 rounded-lg text-sm overflow-x-auto">
              <pre>{`// 1. Obtener variables de la plantilla
const variablesResponse = await fetch(
  '${baseUrl}/templates/template-formal-classic/variables'
);
const { variables } = await variablesResponse.json();
console.log('Variables requeridas:', variables);

// 2. Preparar datos dinámicos
const dynamicData = {};
variables.forEach(variable => {
  // Aquí mapearías desde tu sistema (webhook, formulario, etc.)
  switch(variable) {
    case 'nombre_completo':
      dynamicData[variable] = 'Carlos López';
      break;
    case 'nombre_del_evento':
      dynamicData[variable] = 'Curso de Node.js';
      break;
    case 'fecha_del_evento':
      dynamicData[variable] = '25 de Enero, 2024';
      break;
    default:
      dynamicData[variable] = 'Valor por defecto';
  }
});

// 3. Generar certificado
const response = await fetch('${baseUrl}/certificates/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template_id: 'template-formal-classic',
    data: dynamicData,
    recipient_name: dynamicData.nombre_completo || 'Destinatario'
  })
});

const result = await response.json();
console.log('✅ Certificado generado:', result.certificate.download_url);`}</pre>
            </div>
          </div>
            </div>
          )}
    </div>
  );
};

const APITester = () => {
  const { templates } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [testData, setTestData] = useState('{}');
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL environment variable is not configured');
    }
    return apiBaseUrl.replace(/\/$/, '');
  };
  const baseUrl = getBaseUrl();

  // Fetch template variables when template is selected
  useEffect(() => {
    if (selectedTemplateId) {
      fetchTemplateVariables(selectedTemplateId);
    } else {
      setTemplateVariables([]);
      setTestData('{}');
    }
  }, [selectedTemplateId]);

  const fetchTemplateVariables = async (templateId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/templates/${templateId}/variables`);
      if (response.ok) {
        const data = await response.json();
        setTemplateVariables(data.variables || []);
        
        // Generate example data object based on variables
        const exampleData: Record<string, string> = {};
        data.variables.forEach((variable: string) => {
          switch (variable) {
            case 'nombre_completo':
              exampleData[variable] = 'Juan Pérez';
              break;
            case 'nombre_del_evento':
              exampleData[variable] = 'Curso de React Avanzado';
              break;
            case 'fecha_del_evento':
              exampleData[variable] = '15 de Enero, 2024';
              break;
            case 'organizacion':
              exampleData[variable] = 'Academia Tech';
              break;
            case 'instructor':
              exampleData[variable] = 'María García';
              break;
            case 'duracion':
              exampleData[variable] = '40 horas académicas';
              break;
            default:
              exampleData[variable] = `Valor para ${variable}`;
          }
        });
        
        setTestData(JSON.stringify(exampleData, null, 2));
      }
    } catch (error) {
      console.error('Error fetching template variables:', error);
    }
  };

  const handleTest = async () => {
    if (!selectedTemplateId) {
      alert('Por favor, selecciona una plantilla');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const parsedData = JSON.parse(testData);
      const response = await fetch(`${baseUrl}/api/certificates/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          data: parsedData,
          recipient_name: parsedData.nombre_completo || 'Prueba'
        })
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-5 h-5 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Probador de API</h2>
      </div>
                
                <div className="space-y-4">
                  <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plantilla
          </label>
                    <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Selecciona una plantilla --</option>
                      {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
                      ))}
                    </select>
                  </div>

        {templateVariables.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              📋 Variables detectadas en esta plantilla:
            </h4>
            <div className="flex flex-wrap gap-2">
              {templateVariables.map((variable) => (
                <span
                  key={variable}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-mono"
                >
                  {`{${variable}}`}
                </span>
              ))}
            </div>
            <p className="text-sm text-green-700 mt-2">
              ⬇️ El objeto de datos se ha generado automáticamente con estas variables
            </p>
          </div>
        )}
                  
                  <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datos JSON
          </label>
          <textarea
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
            rows={8}
            placeholder="Ingresa los datos en formato JSON"
          />
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Probando...' : 'Probar API'}
        </button>

        {result && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Resultado:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
            {result.certificate?.download_url && (
              <div className="mt-3">
                <a
                  href={result.certificate.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Certificado
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function APIGenerator() {
  const { templates } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<'generator' | 'docs' | 'tester'>('generator');
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId), [templates, selectedTemplateId]);

  const requiredVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const varSet = new Set<string>();
    selectedTemplate.elements.forEach(el => {
      const matches = el.content.match(/\{(\w+)\}/g);
      if (matches) {
        matches.forEach(match => varSet.add(match.slice(1, -1)));
      }
    });
    return Array.from(varSet);
  }, [selectedTemplate]);
  
  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePdf = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);

    const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`certificate-${selectedTemplate?.name || 'download'}.pdf`);

    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
       <Header 
        title="API de Certificados" 
        subtitle="Genera certificados automáticamente con nuestra API REST"
      />
      
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            {[
              { key: 'generator', label: 'Generador Manual', icon: Eye },
              { key: 'docs', label: 'Documentación', icon: Book },
              { key: 'tester', label: 'Probador API', icon: Send }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active section */}
        {activeSection === 'generator' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Generador Manual</h2>
              
              <div className="mb-6">
                <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">1. Elige una Plantilla</label>
                    <select
                  id="template-select"
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Selecciona --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  
              {selectedTemplate && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">2. Rellena las Variables</h3>
                  <div className="space-y-3">
                    {requiredVariables.map(varName => (
                      <div key={varName}>
                        <label htmlFor={varName} className="block text-sm font-medium text-gray-600">{varName}</label>
                    <input
                          type="text"
                          id={varName}
                          value={variables[varName] || ''}
                          onChange={e => handleVariableChange(varName, e.target.value)}
                          className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                          placeholder={`Valor para {${varName}}`}
                        />
                      </div>
                    ))}
                    {requiredVariables.length === 0 && <p className="text-sm text-gray-500">Esta plantilla no tiene variables.</p>}
                </div>
                
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">3. Genera el PDF</h3>
                  <button
                      onClick={handleGeneratePdf}
                      disabled={isGenerating}
                      className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                  >
                      {isGenerating ? 'Generando...' : 'Descargar PDF'}
                  </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Previsualización</h2>
              <div ref={previewRef}>
                {selectedTemplate ? (
                  <CertificatePreview template={selectedTemplate} variables={variables} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-gray-500">Selecciona una plantilla para ver la previsualización.</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

        {activeSection === 'docs' && <APIDocumentation />}
        {activeSection === 'tester' && <APITester />}
        </div>
    </div>
  );
}