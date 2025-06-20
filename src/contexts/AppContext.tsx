import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CertificateTemplate } from '../types';
import { API_URL } from '../config';

interface AppContextType {
  templates: CertificateTemplate[];
  loading: boolean;
  addTemplate: (template: CertificateTemplate) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<CertificateTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplateById: (id: string) => CertificateTemplate | undefined;
  refreshTemplates: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates from backend on mount
  useEffect(() => {
    loadTemplatesFromBackend();
  }, []);

  const loadTemplatesFromBackend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        console.log('Templates loaded from backend:', data.templates?.length || 0);
      } else {
        console.error('Failed to load templates from backend');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates from backend:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplateToBackend = async (template: CertificateTemplate) => {
    try {
      const response = await fetch(`${API_URL}/templates/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templates: [template] })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save template to backend');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving template to backend:', error);
      throw error;
    }
  };

  const addTemplate = async (template: CertificateTemplate) => {
    try {
      // Save to backend first
      await saveTemplateToBackend(template);
      
      // Update local state
      setTemplates(prev => [...prev, template]);
      
      console.log('Template added successfully:', template.name);
    } catch (error) {
      console.error('Failed to add template:', error);
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<CertificateTemplate>) => {
    try {
      // Find the template to update
      const existingTemplate = templates.find(t => t.id === id);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updatedTemplate = { ...existingTemplate, ...updates };
      
      // Save to backend first
      await saveTemplateToBackend(updatedTemplate);
      
      // Update local state
      setTemplates(prev => prev.map(t => (t.id === id ? updatedTemplate : t)));
      
      console.log('Template updated successfully:', updatedTemplate.name);
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      // Remove from backend by syncing all templates except the deleted one
      const remainingTemplates = templates.filter(t => t.id !== id);
      
      const response = await fetch(`${API_URL}/templates/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templates: remainingTemplates })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template from backend');
      }
      
      // Update local state
      setTemplates(remainingTemplates);
      
      console.log('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  };
  
  const getTemplateById = (id: string): CertificateTemplate | undefined => {
    return templates.find(t => t.id === id);
  };

  const refreshTemplates = async () => {
    await loadTemplatesFromBackend();
  };

  return (
    <AppContext.Provider value={{
      templates,
      loading,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      getTemplateById,
      refreshTemplates
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}