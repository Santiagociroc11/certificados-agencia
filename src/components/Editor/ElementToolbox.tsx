import React from 'react';
import { Type, Image } from 'lucide-react';
import { fabric } from 'fabric';

interface ElementToolboxProps {
  canvas: fabric.Canvas | null;
}

const ToolButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

export default function ElementToolbox({ canvas }: ElementToolboxProps) {
  const addText = () => {
    if (!canvas) return;
    const textbox = new fabric.Textbox('Texto de ejemplo', {
      left: 50,
      top: 50,
      width: 200,
      fontSize: 20,
      fill: '#000000',
      data: { id: `element-${Date.now()}` }
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
  };

  const addImage = () => {
    if (!canvas) return;
    // Using a reliable placeholder image
    fabric.Image.fromURL('https://picsum.photos/150/150?random=1', (img) => {
      if (img) {
        img.set({
          left: 100,
          top: 100,
          data: { id: `element-${Date.now()}` }
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      } else {
        // Fallback: create a colored rectangle if image fails
        const rect = new fabric.Rect({
          left: 100,
          top: 100,
          width: 150,
          height: 150,
          fill: '#e2e8f0',
          stroke: '#cbd5e1',
          strokeWidth: 2,
          data: { id: `element-${Date.now()}` }
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
      }
    }, { crossOrigin: 'anonymous' });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Añadir Elementos</h3>
      <div className="space-y-2">
        <ToolButton 
          label="Texto"
          icon={<Type className="w-5 h-5" />}
          onClick={addText}
        />
        <ToolButton 
          label="Imagen"
          icon={<Image className="w-5 h-5" />}
          onClick={addImage}
        />
      </div>
    </div>
  );
}