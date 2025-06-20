import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Grid, AlignCenter, AlignLeft, AlignRight, AlignJustify, Move } from 'lucide-react';

interface EditorCanvasProps {
  onReady: (canvas: fabric.Canvas) => void;
  showGuidelines?: boolean;
  onShowGuidelinesChange?: (show: boolean) => void;
}

const EditorCanvas = forwardRef<HTMLCanvasElement, EditorCanvasProps>(({ onReady, showGuidelines = true, onShowGuidelinesChange }, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [guidelines, setGuidelines] = useState<fabric.Line[]>([]);
  const [dynamicGuidelines, setDynamicGuidelines] = useState<fabric.Line[]>([]);
  
  // Create static guidelines
  const createGuidelines = (canvas: fabric.Canvas) => {
    if (!canvas || !canvas.getElement()) return;
    
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    // Clear existing guidelines
    guidelines.forEach(line => canvas.remove(line));
    
    if (!showGuidelines) {
      setGuidelines([]);
      return;
    }
    
    const newGuidelines: fabric.Line[] = [];
    
    // Center vertical line
    const centerVertical = new fabric.Line([canvasWidth / 2, 0, canvasWidth / 2, canvasHeight], {
      stroke: '#ff6b6b',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.7
    });
    
    // Center horizontal line
    const centerHorizontal = new fabric.Line([0, canvasHeight / 2, canvasWidth, canvasHeight / 2], {
      stroke: '#ff6b6b',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.7
    });
    
    // Third lines (rule of thirds)
    const thirdVertical1 = new fabric.Line([canvasWidth / 3, 0, canvasWidth / 3, canvasHeight], {
      stroke: '#4ecdc4',
      strokeWidth: 1,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.5
    });
    
    const thirdVertical2 = new fabric.Line([(canvasWidth * 2) / 3, 0, (canvasWidth * 2) / 3, canvasHeight], {
      stroke: '#4ecdc4',
      strokeWidth: 1,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.5
    });
    
    const thirdHorizontal1 = new fabric.Line([0, canvasHeight / 3, canvasWidth, canvasHeight / 3], {
      stroke: '#4ecdc4',
      strokeWidth: 1,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.5
    });
    
    const thirdHorizontal2 = new fabric.Line([0, (canvasHeight * 2) / 3, canvasWidth, (canvasHeight * 2) / 3], {
      stroke: '#4ecdc4',
      strokeWidth: 1,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.5
    });
    
    newGuidelines.push(centerVertical, centerHorizontal, thirdVertical1, thirdVertical2, thirdHorizontal1, thirdHorizontal2);
    
    // Add guidelines to canvas
    newGuidelines.forEach(line => canvas.add(line));
    newGuidelines.forEach(line => canvas.sendToBack(line));
    
    setGuidelines(newGuidelines);
  };
  
  // Create dynamic guidelines (like Canva)
  const createDynamicGuidelines = (canvas: fabric.Canvas, targetX?: number, targetY?: number) => {
    if (!canvas || !canvas.getElement()) return;
    
    // Clear existing dynamic guidelines
    dynamicGuidelines.forEach(line => canvas.remove(line));
    const newDynamicGuidelines: fabric.Line[] = [];
    
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    // Create dynamic center lines when needed
    if (targetX !== undefined && Math.abs(targetX - canvasWidth / 2) < 15) {
      const centerVertical = new fabric.Line([canvasWidth / 2, 0, canvasWidth / 2, canvasHeight], {
        stroke: '#ff4757',
        strokeWidth: 2,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.9,
        shadow: new fabric.Shadow({
          color: '#ff4757',
          blur: 4,
          offsetX: 0,
          offsetY: 0
        })
      });
      newDynamicGuidelines.push(centerVertical);
    }
    
    if (targetY !== undefined && Math.abs(targetY - canvasHeight / 2) < 15) {
      const centerHorizontal = new fabric.Line([0, canvasHeight / 2, canvasWidth, canvasHeight / 2], {
        stroke: '#ff4757',
        strokeWidth: 2,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.9,
        shadow: new fabric.Shadow({
          color: '#ff4757',
          blur: 4,
          offsetX: 0,
          offsetY: 0
        })
      });
      newDynamicGuidelines.push(centerHorizontal);
    }
    
    // Add dynamic guidelines to canvas
    newDynamicGuidelines.forEach(line => {
      canvas.add(line);
      canvas.sendToBack(line);
    });
    
    setDynamicGuidelines(newDynamicGuidelines);
    canvas.renderAll();
  };
  
  // Clear dynamic guidelines
  const clearDynamicGuidelines = (canvas: fabric.Canvas) => {
    if (!canvas || !canvas.getElement()) return;
    
    dynamicGuidelines.forEach(line => canvas.remove(line));
    setDynamicGuidelines([]);
    canvas.renderAll();
  };
  
  // Smooth snap to guidelines function (like Canva)
  const smoothSnapToGuidelines = (obj: fabric.Object) => {
    if (!canvas) return;
    
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const snapThreshold = 15; // Larger threshold for smoother experience
    const strongSnapThreshold = 8; // Closer threshold for strong snap
    
    const objLeft = obj.left || 0;
    const objTop = obj.top || 0;
    const objWidth = obj.getScaledWidth();
    const objHeight = obj.getScaledHeight();
    
    const objCenterX = objLeft + objWidth / 2;
    const objCenterY = objTop + objHeight / 2;
    
    let newLeft = objLeft;
    let newTop = objTop;
    let snappedX = false;
    let snappedY = false;
    
    // Smooth snap to center lines with magnetic effect
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const distanceToCenter = Math.abs(objCenterX - centerX);
    const distanceToCenterY = Math.abs(objCenterY - centerY);
    
    // Horizontal center snap
    if (distanceToCenter < snapThreshold) {
      if (distanceToCenter < strongSnapThreshold) {
        // Strong snap - lock to center
        newLeft = centerX - objWidth / 2;
        snappedX = true;
      } else {
        // Soft magnetic pull towards center
        const pullStrength = (snapThreshold - distanceToCenter) / snapThreshold;
        const pullAmount = (centerX - objCenterX) * pullStrength * 0.3;
        newLeft = objLeft + pullAmount;
      }
    }
    
    // Vertical center snap
    if (distanceToCenterY < snapThreshold) {
      if (distanceToCenterY < strongSnapThreshold) {
        // Strong snap - lock to center
        newTop = centerY - objHeight / 2;
        snappedY = true;
      } else {
        // Soft magnetic pull towards center
        const pullStrength = (snapThreshold - distanceToCenterY) / snapThreshold;
        const pullAmount = (centerY - objCenterY) * pullStrength * 0.3;
        newTop = objTop + pullAmount;
      }
    }
    
    // Show dynamic guidelines when close to snap points
    const showDynamicX = distanceToCenter < snapThreshold ? objCenterX + (newLeft - objLeft) : undefined;
    const showDynamicY = distanceToCenterY < snapThreshold ? objCenterY + (newTop - objTop) : undefined;
    
    createDynamicGuidelines(canvas, showDynamicX, showDynamicY);
    
    // Apply the new position
    obj.set({ left: newLeft, top: newTop });
    
    // Add subtle haptic feedback effect (visual pulse)
    if (snappedX || snappedY) {
      obj.set({ 
        shadow: new fabric.Shadow({
          color: '#ff4757',
          blur: 8,
          offsetX: 0,
          offsetY: 0
        })
      });
      
      // Remove shadow after a short delay
      setTimeout(() => {
        if (canvas && canvas.getElement()) {
          obj.set({ shadow: undefined });
          canvas.renderAll();
        }
      }, 200);
    }
  };
  
  useEffect(() => {
    if (!canvasEl.current) return;
    
    const fabricCanvas = new fabric.Canvas(canvasEl.current, {
      width: 794, // A4 aspect ratio
      height: 561,
      backgroundColor: '#ffffff',
    });

    // Add smooth snap-to-guidelines behavior
    fabricCanvas.on('object:moving', (e) => {
      if (showGuidelines && e.target) {
        smoothSnapToGuidelines(e.target);
      }
    });
    
    // Clear dynamic guidelines when not moving
    fabricCanvas.on('object:modified', () => {
      clearDynamicGuidelines(fabricCanvas);
    });
    
    fabricCanvas.on('selection:cleared', () => {
      clearDynamicGuidelines(fabricCanvas);
    });
    
    // Create guidelines
    createGuidelines(fabricCanvas);
    
    setCanvas(fabricCanvas);
    onReady(fabricCanvas);

    return () => {
      // Clear timeouts and guidelines before disposing
      clearDynamicGuidelines(fabricCanvas);
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, [onReady]);
  
  // Update guidelines when showGuidelines changes
  useEffect(() => {
    if (canvas) {
      createGuidelines(canvas);
      canvas.renderAll();
    }
  }, [showGuidelines, canvas]);
  
  // Alignment functions
  const alignObjects = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!canvas) return;
    
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 2) return;
    
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    switch (alignment) {
      case 'left':
        const leftMost = Math.min(...activeObjects.map(obj => obj.left || 0));
        activeObjects.forEach(obj => obj.set({ left: leftMost }));
        break;
      case 'center':
        activeObjects.forEach(obj => {
          const objWidth = obj.getScaledWidth();
          obj.set({ left: canvasWidth / 2 - objWidth / 2 });
        });
        break;
      case 'right':
        const rightMost = Math.max(...activeObjects.map(obj => (obj.left || 0) + obj.getScaledWidth()));
        activeObjects.forEach(obj => {
          const objWidth = obj.getScaledWidth();
          obj.set({ left: rightMost - objWidth });
        });
        break;
      case 'top':
        const topMost = Math.min(...activeObjects.map(obj => obj.top || 0));
        activeObjects.forEach(obj => obj.set({ top: topMost }));
        break;
      case 'middle':
        activeObjects.forEach(obj => {
          const objHeight = obj.getScaledHeight();
          obj.set({ top: canvasHeight / 2 - objHeight / 2 });
        });
        break;
      case 'bottom':
        const bottomMost = Math.max(...activeObjects.map(obj => (obj.top || 0) + obj.getScaledHeight()));
        activeObjects.forEach(obj => {
          const objHeight = obj.getScaledHeight();
          obj.set({ top: bottomMost - objHeight });
        });
        break;
    }
    
    canvas.renderAll();
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
        <button
          onClick={() => onShowGuidelinesChange?.(!showGuidelines)}
          className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
            showGuidelines 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Grid className="w-4 h-4" />
          Guías
        </button>
        
        <div className="w-px h-6 bg-gray-300" />
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-2">Alinear:</span>
          <button
            onClick={() => alignObjects('left')}
            className="p-1 rounded hover:bg-gray-200"
            title="Alinear izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => alignObjects('center')}
            className="p-1 rounded hover:bg-gray-200"
            title="Centrar horizontalmente"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => alignObjects('right')}
            className="p-1 rounded hover:bg-gray-200"
            title="Alinear derecha"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => alignObjects('top')}
            className="p-1 rounded hover:bg-gray-200"
            title="Alinear arriba"
          >
            <Move className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => alignObjects('middle')}
            className="p-1 rounded hover:bg-gray-200"
            title="Centrar verticalmente"
          >
            <Move className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={() => alignObjects('bottom')}
            className="p-1 rounded hover:bg-gray-200"
            title="Alinear abajo"
          >
            <Move className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <canvas ref={canvasEl} className="border border-gray-300 shadow-lg"/>
      </div>
    </div>
  );
});

export default EditorCanvas;