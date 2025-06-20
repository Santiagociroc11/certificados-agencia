import React, { useState, useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import { Trash2 } from 'lucide-react';
import { googleFonts } from '../../data/fonts';
import { loadFont } from '../../utils/fontLoader';
import { CertificateTemplate } from '../../types';

interface PropertiesPanelProps {
    canvas: fabric.Canvas | null;
    selectedObject: fabric.Object | null;
    template: Partial<CertificateTemplate>;
    onTemplateUpdate: (updates: Partial<CertificateTemplate>) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">{title}</h4>
        <div className="space-y-3 p-1">{children}</div>
    </div>
);

const PropertyInput: React.FC<{ label: string; value: any; onChange: (value: any) => void; type?: string; step?: number, min?: number }> = ({ label, value, onChange, type = 'text', ...props }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-gray-600">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="w-2/3 p-1 border border-gray-300 rounded-md"
            {...props}
        />
    </div>
);

const FontSelector: React.FC<{ value: string, onChange: (font: string) => void }> = ({ value, onChange }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-gray-600">Fuente</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-2/3 p-1 border border-gray-300 rounded-md"
        >
            {googleFonts.map(font => (
                <option key={font} value={font}>{font}</option>
            ))}
        </select>
      </div>
    );

export default function PropertiesPanel({ canvas, selectedObject, template, onTemplateUpdate }: PropertiesPanelProps) {
    const [, forceUpdate] = useState(0);

    const forceRender = useCallback(() => forceUpdate(c => c + 1), []);

    useEffect(() => {
        if (canvas) {
            canvas.on('object:modified', forceRender);
            canvas.on('selection:created', forceRender);
            canvas.on('selection:updated', forceRender);
            canvas.on('selection:cleared', forceRender);
        }
        return () => {
            if (canvas?.off) {
                canvas.off('object:modified', forceRender);
                canvas.off('selection:created', forceRender);
                canvas.off('selection:updated', forceRender);
                canvas.off('selection:cleared', forceRender);
            }
        };
    }, [canvas, forceRender]);

    const updateProperty = (prop: string, value: any) => {
        if (!canvas || !selectedObject) return;
        if (prop === 'fontFamily') {
            loadFont(value);
        }
        selectedObject.set(prop as keyof fabric.Object, value);
        canvas.renderAll();
        forceRender();
    };
    
    const handleScale = (prop: 'width' | 'height', value: number) => {
        if (!canvas || !selectedObject || value <= 0) return;
        if (prop === 'width') {
            selectedObject.scaleToWidth(value);
    } else {
            selectedObject.scaleToHeight(value);
        }
        canvas.renderAll();
        forceRender();
    }

    const deleteSelected = () => {
      if(canvas && selectedObject) {
        canvas.remove(selectedObject);
        canvas.discardActiveObject();
      }
    }
    
    const obj = selectedObject;

  return (
        <div className="p-2 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Propiedades</h3>
            
            {!obj ? (
                <Section title="Plantilla">
                    <PropertyInput label="Nombre" value={template.name || ''} onChange={val => onTemplateUpdate({name: val})} />
                    <PropertyInput label="Descripción" value={template.description || ''} onChange={val => onTemplateUpdate({description: val})} />
                    <PropertyInput label="Color Fondo" type="color" value={template.backgroundColor || '#ffffff'} onChange={val => onTemplateUpdate({backgroundColor: val, backgroundUrl: ''})} />
                    <PropertyInput label="URL Fondo" value={template.backgroundUrl || ''} onChange={val => onTemplateUpdate({backgroundUrl: val, backgroundColor: ''})} />
                </Section>
            ) : (
                <>
                    {obj.type === 'textbox' && (
                        <Section title="Texto">
          <textarea
                                value={(obj as fabric.Textbox).text || ''}
                                onChange={e => updateProperty('text', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded-md"
            rows={3}
          />
                            <FontSelector value={(obj as fabric.Textbox).fontFamily || 'Arial'} onChange={val => updateProperty('fontFamily', val)} />
                            <PropertyInput label="Tamaño" type="number" min={1} value={(obj as fabric.Textbox).fontSize || 16} onChange={val => updateProperty('fontSize', val)} />
                            <PropertyInput label="Color" type="color" value={(obj as fabric.Textbox).fill || '#000000'} onChange={val => updateProperty('fill', val)} />
                            
                            {/* Text Alignment */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="text-gray-600">Alineación</label>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => updateProperty('textAlign', 'left')}
                                        className={`p-1 border rounded ${
                                            (obj as fabric.Textbox).textAlign === 'left' 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                        title="Izquierda"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h10a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h10a1 1 0 010 2H3a1 1 0 010-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => updateProperty('textAlign', 'center')}
                                        className={`p-1 border rounded ${
                                            (obj as fabric.Textbox).textAlign === 'center' 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                        title="Centro"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 4h16a1 1 0 010 2H2a1 1 0 010-2zm2 4h12a1 1 0 010 2H4a1 1 0 010-2zm-2 4h16a1 1 0 010 2H2a1 1 0 010-2zm2 4h12a1 1 0 010 2H4a1 1 0 010-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => updateProperty('textAlign', 'right')}
                                        className={`p-1 border rounded ${
                                            (obj as fabric.Textbox).textAlign === 'right' 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                        title="Derecha"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zm4 4h10a1 1 0 010 2H7a1 1 0 010-2zm-4 4h14a1 1 0 010 2H3a1 1 0 010-2zm4 4h10a1 1 0 010 2H7a1 1 0 010-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => updateProperty('textAlign', 'justify')}
                                        className={`p-1 border rounded ${
                                            (obj as fabric.Textbox).textAlign === 'justify' 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                        title="Justificado"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" />
                                        </svg>
                                    </button>
          </div>
        </div>
        
                            {/* Typography Options */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="text-gray-600">Estilo</label>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => updateProperty('fontWeight', (obj as fabric.Textbox).fontWeight === 'bold' ? 'normal' : 'bold')}
                                        className={`px-2 py-1 border rounded text-xs font-bold ${
                                            (obj as fabric.Textbox).fontWeight === 'bold' 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        B
                                    </button>
                                    <button
                                        onClick={() => updateProperty('fontStyle', (obj as fabric.Textbox).fontStyle === 'italic' ? 'normal' : 'italic')}
                                        className={`px-2 py-1 border rounded text-xs italic ${
                                            (obj as fabric.Textbox).fontStyle === 'italic' 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        I
                                    </button>
                                    <button
                                        onClick={() => updateProperty('underline', !(obj as fabric.Textbox).underline)}
                                        className={`px-2 py-1 border rounded text-xs underline ${
                                            (obj as fabric.Textbox).underline 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        U
                                    </button>
        </div>
      </div>

                            <PropertyInput 
                                label="Interlineado" 
              type="number"
                                step={0.1} 
                                min={0.5} 
                                value={(obj as fabric.Textbox).lineHeight || 1.2} 
                                onChange={val => updateProperty('lineHeight', val)} 
                            />
                            <PropertyInput 
                                label="Espaciado" 
                                type="number" 
                                step={1} 
                                value={(obj as fabric.Textbox).charSpacing || 0} 
                                onChange={val => updateProperty('charSpacing', val)} 
                            />
                        </Section>
                    )}
                    {obj.type === 'image' && (
                         <Section title="Imagen">
                           <PropertyInput label="URL" value={(obj as fabric.Image).getSrc() || ''} onChange={val => {
                             if (!canvas) return;
                             (obj as fabric.Image).setSrc(val, () => canvas.renderAll(), { crossOrigin: 'anonymous' });
                           }} />
                         </Section>
                    )}

                    <Section title="Posición y Tamaño">
                        <PropertyInput label="X" type="number" value={Math.round(obj.left || 0)} onChange={val => updateProperty('left', val)} />
                        <PropertyInput label="Y" type="number" value={Math.round(obj.top || 0)} onChange={val => updateProperty('top', val)} />
                        <PropertyInput label="Ancho" type="number" min={1} value={Math.round(obj.getScaledWidth())} onChange={val => handleScale('width', val)} />
                        <PropertyInput label="Alto" type="number" min={1} value={Math.round(obj.getScaledHeight())} onChange={val => handleScale('height', val)} />
                        <PropertyInput label="Ángulo" type="number" value={Math.round(obj.angle || 0)} onChange={val => updateProperty('angle', val)} />
                    </Section>

                    <div className="mt-6">
                      <button onClick={deleteSelected} className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg">
                        <Trash2 className="w-4 h-4 mr-2"/>
                        Eliminar Elemento
                      </button>
        </div>
                </>
            )}
    </div>
  );
}