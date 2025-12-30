# 🎨 Frontend - Sistema de Validación QR

Frontend en React + Vite + TailwindCSS para el sistema de validación de etiquetas QR.

## 📋 Características

- ✅ **Dashboard** con estadísticas en tiempo real
- ✅ **Importación** de SKUs, códigos QR y POs
- ✅ **Escaneo de cartones** con validación en tiempo real
- ✅ **Envío a T4 API** con vista previa
- ✅ **Diseño responsive** (funciona en todos los dispositivos)
- ✅ **Notificaciones** toast para feedback inmediato
- ✅ **Interfaz intuitiva** y fácil de usar

## 🚀 Instalación

### Requisitos previos
- Node.js 18+ instalado
- Backend corriendo en `http://localhost:3000`

### Paso 1: Instalar dependencias

```bash
npm install
```

### Paso 2: Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` si tu backend está en otra URL:
```env
VITE_API_URL=http://localhost:3000/api
```

### Paso 3: Iniciar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📦 Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

Para probar el build:
```bash
npm run preview
```

## 📱 Páginas Principales

### 1. Dashboard (`/`)
- Estadísticas generales del sistema
- Lista de POs recientes
- Accesos rápidos

### 2. Importar (`/import`)
- Importar SKUs desde Excel
- Importar códigos QR desde API de Trysor
- Importar Purchase Orders desde Excel

### 3. Escanear (`/scan`)
- Seleccionar PO
- Ver cartones pendientes
- Escanear códigos QR en tiempo real
- Ver progreso del cartón
- Validaciones automáticas

### 4. Enviar (`/send`)
- Validar PO antes de enviar
- Vista previa de datos
- Enviar/Cancelar en T4 API

## 🎯 Flujo de Uso

### 1. Importar Datos (una sola vez)
```
Importar → Seleccionar "SKUs" → Cargar archivo Excel
Importar → Seleccionar "Códigos QR" → Importar desde API
```

### 2. Importar PO
```
Importar → Seleccionar "Purchase Order" → Cargar archivo Excel
```

### 3. Escanear Cartones
```
Escanear → Seleccionar PO → Click en cartón → Escanear códigos QR
```

### 4. Enviar a T4
```
Enviar → Seleccionar PO → Vista Previa → Enviar a T4
```

## 🎨 Componentes Principales

### Layout
- Navegación principal
- Header con branding
- Container responsive

### Dashboard
- Cards de estadísticas
- Tabla de POs recientes
- Accesos rápidos

### ScanPage
- Selector de PO
- Grid de cartones
- Panel de escaneo activo
- Progreso por SKU en tiempo real
- Input para lector QR

### ImportPage
- Cards para cada tipo de importación
- Upload de archivos
- Feedback de importación

### SendPage
- Validación de PO
- Vista previa de datos JSON
- Botones de envío/cancelación

## 🔧 Tecnologías Usadas

- **React 18** - Framework UI
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **TailwindCSS** - Estilos
- **Axios** - HTTP client
- **Lucide React** - Iconos
- **React Hot Toast** - Notificaciones

## 📂 Estructura del Proyecto

```
src/
├── components/
│   └── Layout.jsx           # Layout principal
├── pages/
│   ├── Dashboard.jsx        # Dashboard
│   ├── ImportPage.jsx       # Página de importación
│   ├── ScanPage.jsx         # Página de escaneo
│   └── SendPage.jsx         # Página de envío
├── services/
│   └── api.js               # Servicios de API
├── App.jsx                  # Componente raíz
├── main.jsx                 # Entry point
└── index.css                # Estilos globales
```

## 🎨 Personalización

### Colores
Edita `tailwind.config.js` para cambiar el esquema de colores:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Cambia estos valores
        600: '#2563eb',
        700: '#1d4ed8',
      }
    }
  }
}
```

### Logo
Reemplaza el logo en `Layout.jsx`

## 📱 Modo Escaneo

El input de escaneo está optimizado para lectores de códigos QR:
- Auto-focus al iniciar escaneo
- Enter para validar
- Limpieza automática después de escanear
- Feedback visual inmediato

## 🐛 Troubleshooting

### Error: CORS
**Solución:** Asegúrate de que el backend tenga CORS habilitado para `http://localhost:5173`

### Error: Cannot connect to API
**Solución:** Verifica que el backend esté corriendo en `http://localhost:3000`

### Error al importar archivos
**Solución:** Verifica que los archivos Excel tengan el formato correcto (ver documentación del backend)

### Escaneo no funciona
**Solución:** 
1. Verifica que el cartón esté en estado "pendiente" o "en_proceso"
2. Asegúrate de que el código QR esté importado
3. Revisa que el código QR corresponda al SKU del cartón

## 📊 Performance

- Build optimizado con Vite
- Code splitting automático
- Lazy loading de imágenes
- Debouncing en búsquedas

## 🔒 Seguridad

- Validación de inputs en el cliente
- Sanitización de datos
- HTTPS recomendado en producción
- Variables de entorno para configuración

## 🚀 Despliegue

### Vercel / Netlify
```bash
npm run build
# Sube la carpeta dist/
```

### Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

## 📝 Notas Adicionales

- El frontend hace proxy automático de `/api` al backend en desarrollo
- Los toasts desaparecen automáticamente después de 3 segundos
- El progreso se actualiza en tiempo real sin recargar la página
- Todas las operaciones tienen feedback visual

## 🤝 Contribuir

Para agregar nuevas funcionalidades:

1. Crear nuevo componente en `/src/components` o `/src/pages`
2. Agregar servicios en `/src/services/api.js`
3. Agregar ruta en `App.jsx`
4. Agregar navegación en `Layout.jsx`

## 📄 Licencia

MIT

---

**¡Sistema listo para producción!** 🎉
