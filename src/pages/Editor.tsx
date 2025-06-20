import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { CertificateTemplate, CertificateElement } from '../types';
import { fabric } from 'fabric';

import Header from '../components/Layout/Header';
import EditorCanvas from '../components/Editor/EditorCanvas';
import ElementToolbox from '../components/Editor/ElementToolbox';
import PropertiesPanel from '../components/Editor/PropertiesPanel';
import { loadFont } from '../utils/fontLoader';

const elementToFabric = (element: CertificateElement): Promise<fabric.Object | null> => {
    return new Promise((resolve) => {
        const { type, content, position, size, style } = element;
        
        if (type === 'text') {
            const textOptions: any = {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                fontSize: style.fontSize || 16,
                fontFamily: style.fontFamily || 'Arial',
                fontWeight: style.fontWeight || 'normal',
                fontStyle: style.fontStyle || 'normal',
                fill: style.color || '#000000',
                textAlign: style.textAlign || 'left',
                lineHeight: style.lineHeight || 1.2,
                charSpacing: style.letterSpacing || 0,
                underline: false,
                data: { id: element.id }
            };
            const text = new fabric.Textbox(content, textOptions);
            resolve(text);
        } else if (type === 'image') {
            fabric.Image.fromURL(content, (img) => {
                if (img) {
                    // Calculate scale factors based on saved size and original image size
                    const scaleX = size.width / (img.width || 1);
                    const scaleY = size.height / (img.height || 1);

                    img.set({ 
                        left: position.x,
                        top: position.y,
                        scaleX,
                        scaleY,
                        data: { id: element.id } 
                    });
                    resolve(img);
                } else {
                    console.warn(`Failed to load image: ${content}`);
                    resolve(null);
                }
            }, { crossOrigin: 'anonymous' });
        } else {
            resolve(null);
        }
    });
};

// Mapping from Fabric object to our type
const fabricToElement = (obj: fabric.Object): CertificateElement | null => {
    // Skip objects that are not user elements (guidelines, etc.)
    if (!obj.data || !obj.data.id || obj.excludeFromExport) {
        return null;
    }
    
    return {
        id: obj.data.id,
        type: obj.type === 'textbox' ? 'text' : 'image',
        content: obj.type === 'textbox' 
            ? (obj as fabric.Textbox).text || '' 
            : obj.type === 'image' 
                ? (obj as fabric.Image).getSrc() 
                : 'https://picsum.photos/150/150?random=1', // fallback for rect elements
        position: { x: obj.left || 0, y: obj.top || 0 },
        size: { width: obj.getScaledWidth(), height: obj.getScaledHeight() },
        style: {
            fontSize: (obj as fabric.Textbox).fontSize,
            fontFamily: (obj as fabric.Textbox).fontFamily,
            fontWeight: String((obj as fabric.Textbox).fontWeight || 'normal'),
            fontStyle: String((obj as fabric.Textbox).fontStyle || 'normal'),
            color: (obj as fabric.Textbox).fill as string,
            textAlign: (obj as fabric.Textbox).textAlign as 'left' | 'center' | 'right' | 'justify',
            lineHeight: (obj as fabric.Textbox).lineHeight,
            letterSpacing: (obj as fabric.Textbox).charSpacing,
        }
    };
};

export default function Editor() {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const { getTemplateById, addTemplate, updateTemplate: contextUpdateTemplate } = useApp();

    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [template, setTemplate] = useState<Partial<CertificateTemplate>>({
        name: 'Nueva Plantilla', description: 'Descripción de la plantilla', elements: []
    });
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [showGuidelines, setShowGuidelines] = useState<boolean>(true);

    const initCanvas = useCallback((c: fabric.Canvas) => {
        setCanvas(c);
    }, []);

    useEffect(() => {
        if (!canvas) return;

        if (templateId) {
            const existingTemplate = getTemplateById(templateId);
            if (existingTemplate) {
                setTemplate(existingTemplate);
                canvas.clear();
                
                // Set background color if exists
                if(existingTemplate.backgroundColor) {
                    canvas.backgroundColor = existingTemplate.backgroundColor;
                    canvas.renderAll();
                }
                
                // Set background image if exists
                if(existingTemplate.backgroundUrl) {
                    fabric.Image.fromURL(existingTemplate.backgroundUrl, (img) => {
                        if (img) {
                            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                               scaleX: canvas.width! / img.width!,
                               scaleY: canvas.height! / img.height!
                            });
                        } else {
                            console.warn('Failed to load template background image:', existingTemplate.backgroundUrl);
                        }
                    }, { crossOrigin: 'anonymous' });
                }

                // Pre-load all fonts used in the template
                existingTemplate.elements.forEach(el => {
                    if (el.type === 'text' && el.style.fontFamily) {
                        loadFont(el.style.fontFamily);
                    }
                });

                // Wait for all elements to be converted before adding them to the canvas
                const elementPromises = existingTemplate.elements.map(el => elementToFabric(el));

                Promise.all(elementPromises).then(fabricElements => {
                    canvas.clear(); // Clear canvas again to ensure it's empty
                    
                    // Re-apply background after clearing
                    if (existingTemplate.backgroundColor) {
                        canvas.backgroundColor = existingTemplate.backgroundColor;
                    }
                    if (existingTemplate.backgroundUrl) {
                        fabric.Image.fromURL(existingTemplate.backgroundUrl, (img) => {
                             if (img) {
                                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                                   scaleX: canvas.width! / img.width!,
                                   scaleY: canvas.height! / img.height!
                                });
                            }
                        }, { crossOrigin: 'anonymous' });
                    }
                    
                    // Add all elements at once
                    fabricElements.forEach(fabEl => {
                        if (fabEl) {
                            canvas.add(fabEl);
                        }
                    });
                    canvas.renderAll(); // Render once after everything is added
                });
            }
        }
        
        const updateSelection = (e: fabric.IEvent) => {
            setSelectedObject(e.selected ? e.selected[0] : null);
        };

        canvas.on('selection:created', updateSelection);
        canvas.on('selection:updated', updateSelection);
        canvas.on('selection:cleared', () => setSelectedObject(null));

        return () => {
            if (canvas.off) {
                canvas.off('selection:created');
                canvas.off('selection:updated');
                canvas.off('selection:cleared');
            }
        }

    }, [canvas, templateId, getTemplateById]);
    
    const updateTemplateDetails = (updates: Partial<CertificateTemplate>) => {
      setTemplate(prev => ({...prev, ...updates}));
      if(canvas) {
        if(updates.backgroundColor) {
           // Clear any background image first
           canvas.backgroundImage = undefined;
           canvas.backgroundColor = updates.backgroundColor;
           canvas.renderAll();
        }
        if(updates.backgroundUrl) {
           // Clear background color when setting image
           canvas.backgroundColor = '';
           fabric.Image.fromURL(updates.backgroundUrl, (img) => {
               if (img) {
                   canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                      scaleX: canvas.width! / img.width!,
                      scaleY: canvas.height! / img.height!
                   });
               } else {
                   console.warn('Failed to load background image:', updates.backgroundUrl);
               }
           }, { crossOrigin: 'anonymous' });
        }
      }
    };

    const handleSaveTemplate = async () => {
        if (!canvas) return;

        const elements = canvas.getObjects()
            .map(fabricToElement)
            .filter((element): element is CertificateElement => element !== null);
        const finalTemplate = { ...template, elements } as CertificateTemplate;

        try {
            if (templateId) {
                await contextUpdateTemplate(templateId, finalTemplate);
                alert('Plantilla actualizada con éxito en el backend');
            } else {
                const newTemplateWithId = { ...finalTemplate, id: `template-${Date.now()}` };
                await addTemplate(newTemplateWithId);
                alert('Plantilla guardada con éxito en el backend');
            }
            navigate('/templates');
        } catch (error) {
            alert('Error al guardar la plantilla. Verifica que el backend esté ejecutándose.');
            console.error('Save template error:', error);
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <Header title="Editor de Plantillas" subtitle={template.name || ''} onSave={handleSaveTemplate} />
            <div className="flex-1 flex overflow-hidden">
                <div className="w-60 bg-white border-r border-gray-200 p-4 flex-shrink-0">
                    <ElementToolbox canvas={canvas} />
                </div>
                <main className="flex-1 overflow-y-auto">
                   <EditorCanvas 
                       onReady={initCanvas} 
                       showGuidelines={showGuidelines}
                       onShowGuidelinesChange={setShowGuidelines}
                   />
                </main>
                <aside className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
                    <PropertiesPanel 
                      selectedObject={selectedObject} 
                      canvas={canvas}
                      template={template}
                      onTemplateUpdate={updateTemplateDetails}
                    />
                </aside>
            </div>
        </div>
    );
}