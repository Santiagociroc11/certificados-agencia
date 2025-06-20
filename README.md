# 🎓 Certificate Generator Pro - API Edition

Una plataforma completa para generar certificados de asistencia con API REST integrada para automatización total.

## 🚀 Características

### ✨ Frontend (React + TypeScript)
- **Editor visual**: Diseña certificados con Fabric.js
- **Sistema de plantillas**: Plantillas predefinidas y personalizables
- **Variables dinámicas**: Usa `{nombre_completo}`, `{nombre_del_evento}`, etc.
- **Generación manual**: Crea PDFs desde la interfaz web
- **Gestión de fuentes**: Integración con Google Fonts

### 🔥 Backend API (Node.js + Express)
- **Generación automática**: API REST para webhooks externos
- **PDF de alta calidad**: Puppeteer para renderizado perfecto
- **Variables flexibles**: Mapeo dinámico de datos
- **Webhooks**: Notificaciones automáticas tras generar certificados
- **Generación masiva**: Endpoint para múltiples certificados

## 📋 Requisitos

- Node.js 16+ 
- npm 8+

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>
cd certificate-generator-pro

# Instalar dependencias
npm install

# Iniciar desarrollo completo (Frontend + Backend)
npm run dev:full
```

## 🚦 Comandos Disponibles

```bash
# Solo frontend (puerto 5173)
npm run dev

# Solo backend API (puerto 3001)  
npm run server

# Frontend + Backend simultáneamente
npm run dev:full

# Build para producción
npm run build
```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📖 Cómo Usar la Plataforma

### 1. 🎨 Crear Plantillas

1. Ve a **"Editor"** desde el menú lateral
2. Crea una nueva plantilla o edita una existente
3. Agrega elementos de texto con variables como:
   - `{nombre_completo}` - Nombre del participante
   - `{nombre_del_evento}` - Nombre del evento/curso
   - `{fecha_del_evento}` - Fecha de realización
   - `{cualquier_variable}` - Cualquier dato dinámico

4. Personaliza:
   - Fuentes (Google Fonts integrado)
   - Colores y tamaños
   - Posicionamiento
   - Fondo (color sólido o imagen)

5. **Guarda la plantilla**

### 2. 🤖 Usar la API para Automatización

#### Endpoint Principal
```
POST http://localhost:3001/api/certificates/generate
```

#### Ejemplo de Request
```json
{
  "template_id": "template-formal-classic",
  "data": {
    "nombre_completo": "Juan Pérez",
    "nombre_del_evento": "Curso de React Avanzado",
    "fecha_del_evento": "15 de Enero, 2024"
  },
  "recipient_name": "Juan Pérez",
  "webhook_url": "https://mi-sistema.com/webhook" // Opcional
}
```

#### Ejemplo de Response
```json
{
  "success": true,
  "certificate": {
    "id": "abc123-def456",
    "validation_code": "CERT1234",
    "download_url": "http://localhost:3001/certificates/certificate_abc123.pdf",
    "recipient_name": "Juan Pérez",
    "generated_at": "2024-01-15T10:30:00Z",
    "template_id": "template-formal-classic"
  },
  "message": "Certificate generated successfully"
}
```

### 3. 🧪 Probar la API

1. Ve a **"API de Certificados"** en el menú
2. Usa la pestaña **"Probador API"**
3. Selecciona una plantilla
4. Modifica el JSON con tus datos
5. Haz clic en **"Probar API"**
6. Descarga el PDF generado

## 🔗 Integración con Sistemas Externos

### Webhooks desde Plataformas de Eventos

```javascript
// Ejemplo: Desde un webhook de Eventbrite, Zoom, etc.
app.post('/webhook/eventbrite', (req, res) => {
  const { attendee_name, event_name, event_date } = req.body;
  
  // Generar certificado automáticamente
  const certificateResponse = await fetch('http://localhost:3001/api/certificates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: 'template-formal-classic',
      data: {
        nombre_completo: attendee_name,
        nombre_del_evento: event_name,
        fecha_del_evento: event_date
      },
      recipient_name: attendee_name,
      webhook_url: 'https://mi-sistema.com/certificate-ready'
    })
  });
  
  const result = await certificateResponse.json();
  console.log('Certificado generado:', result.certificate.download_url);
});
```

### Integración con LMS (Moodle, Canvas, etc.)

```python
# Ejemplo en Python para Moodle
import requests

def generate_certificate_for_completion(user_id, course_name, completion_date):
    api_url = "http://localhost:3001/api/certificates/generate"
    
    data = {
        "template_id": "template-modern-minimalist",
        "data": {
            "nombre_completo": get_user_name(user_id),
            "nombre_del_evento": course_name,
            "fecha_del_evento": completion_date
        },
        "recipient_name": get_user_name(user_id)
    }
    
    response = requests.post(api_url, json=data)
    result = response.json()
    
    if result["success"]:
        return result["certificate"]["download_url"]
    else:
        raise Exception(f"Error generando certificado: {result['error']}")
```

## 📋 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/certificates/generate` | Genera un certificado individual |
| `POST` | `/api/certificates/bulk-generate` | Genera múltiples certificados |
| `GET` | `/api/certificates/:id` | Obtiene información de un certificado |
| `GET` | `/api/certificates/validate/:code` | Valida un certificado por código |
| `GET` | `/api/templates` | Lista todas las plantillas disponibles |
| `GET` | `/api/templates/:id` | Obtiene una plantilla específica |
| `GET` | `/api/templates/:id/variables` | Lista variables de una plantilla |
| `POST` | `/api/templates/sync` | Sincroniza plantillas desde frontend |

## 🔐 Variables Predefinidas Recomendadas

Para máxima compatibilidad, usa estas variables en tus plantillas:

```
{nombre_completo}     - Nombre completo del participante
{nombre_del_evento}   - Nombre del evento/curso/workshop
{fecha_del_evento}    - Fecha de realización
{organizacion}        - Nombre de la organización
{instructor}          - Nombre del instructor/facilitador
{duracion}           - Duración del evento (ej: "40 horas")
{fecha_expedicion}   - Fecha de expedición del certificado
{codigo_validacion}  - Código único de validación
```

## 🎯 Casos de Uso Reales

### 1. **Eventos y Conferencias**
- Conecta con Eventbrite, Meetup, o tu sistema de registro
- Genera certificados automáticamente al finalizar el evento
- Envía por email automáticamente

### 2. **Plataformas Educativas**
- Integra con Moodle, Canvas, Teachable
- Certificados automáticos al completar cursos
- Validación online con códigos únicos

### 3. **Webinars y Workshops**
- Conecta con Zoom, Teams, Google Meet
- Certificados basados en tiempo de asistencia
- Webhooks automáticos post-evento

### 4. **Capacitaciones Empresariales**
- Sistema interno de RRHH
- Certificados de capacitación laboral
- Tracking de empleados certificados

## 🐛 Solución de Problemas

### Error: "Template not found"
- Verifica que el `template_id` exista en `/api/templates`
- Asegúrate de haber guardado la plantilla desde el editor

### Error: "Failed to generate PDF"
- Verifica que las URLs de imágenes sean accesibles
- Asegúrate de que Puppeteer pueda acceder a las fuentes de Google

### Imágenes no se cargan
- Usa URLs HTTPS para imágenes
- Verifica que las imágenes tengan CORS habilitado

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# .env (opcional)
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001
NODE_ENV=development
```

### Personalización de Puppeteer

Edita `server/services/pdfGenerator.js` para:
- Cambiar formato de página
- Ajustar calidad de imagen
- Configurar timeouts

## 📞 Soporte

¿Preguntas? ¿Problemas? ¿Ideas?

- Crea un issue en el repositorio
- Revisa la documentación integrada en `/api/docs`
- Usa el probador de API integrado en la plataforma

---

🎉 **¡Listo!** Ahora tienes una plataforma completa de generación de certificados con API REST para automatización total. 