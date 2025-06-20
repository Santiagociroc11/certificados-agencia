import React from 'react';
import Header from '../components/Layout/Header';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Bienvenido a Certificate Generator Pro" 
        subtitle="Crea y gestiona tus plantillas de certificados"
      />
      
      <main className="lg:pl-64">
        <div className="p-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Comienza a Crear</h2>
            <p className="text-gray-600">
              Utiliza el menú de la izquierda para navegar a la sección de plantillas y empezar a diseñar tus certificados.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}