import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useApp } from '../contexts/AppContext';

export default function Templates() {
  const { templates, loading, deleteTemplate, refreshTemplates } = useApp();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCreateNew = () => {
    navigate('/editor');
  };
  
  const handleEdit = (id: string) => {
    navigate(`/editor/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      try {
        await deleteTemplate(id);
        alert('Plantilla eliminada correctamente');
      } catch (error) {
        alert('Error al eliminar la plantilla');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTemplates();
      alert('¡Plantillas actualizadas desde el backend!');
    } catch (error) {
      alert('Error al actualizar las plantillas');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header 
          title="Plantillas de Certificados" 
          subtitle="Gestiona y crea plantillas reutilizables"
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando plantillas desde el backend...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header 
        title="Plantillas de Certificados" 
        subtitle="Gestiona y crea plantillas reutilizables"
      />
      
      <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Mis Plantillas 
              <span className="text-sm text-gray-500 font-normal ml-2">
                ({templates.length} plantillas desde JSON)
              </span>
            </h1>
            <div className="flex gap-3">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              <button 
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Plantilla
              </button>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-xl font-medium text-gray-800">No hay plantillas en el backend</h3>
              <p className="text-gray-500 mt-2 mb-6">¡Crea tu primera plantilla para empezar!</p>
              <button 
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mx-auto transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Plantilla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 truncate">{template.name}</h3>
                    <p className="text-gray-600 text-sm mt-1 h-10">{template.description}</p>
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        ID: {template.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3 mt-4 flex justify-end space-x-2">
                    <button 
                      onClick={() => handleEdit(template.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </main>
    </div>
  );
}