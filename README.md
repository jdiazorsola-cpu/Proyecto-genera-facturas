# Generador de Facturas Profesional

Una aplicación web 100% client-side para generar facturas en formato PDF, diseñada para ser profesional, rápida y no requerir backend.

## Características

*   **100% Client-Side:** No requiere servidor, bases de datos ni instalaciones complejas. Funciona directamente en el navegador web del usuario.
*   **Generación de PDF:** Utiliza las librerías `jsPDF` y `jsPDF-AutoTable` para generar documentos PDF con un diseño corporativo limpio.
*   **Reactividad:** Cálculos automáticos e inmediatos de subtotales, impuestos y totales a medida que se ingresan o modifican los datos.
*   **Gestión de Productos:** Permite añadir y eliminar filas de productos o servicios de forma dinámica.
*   **Numeración Persistente:** Genera y mantiene la numeración consecutiva de las facturas (`FAC-0001`, `FAC-0002`, etc.) utilizando `localStorage`.
*   **Vista Previa:** Módulo integrado para revisar la factura antes de generar y descargar el archivo PDF.
*   **Diseño Corporativo:** Interfaz moderna y profesional con tipografía Inter, colores sobrios (azul oscuro y verde acento) y estructura responsive (adaptable a dispositivos móviles).
*   **Validaciones en Tiempo Real:** Verificación de campos obligatorios, formatos de correo electrónico y valores numéricos para evitar errores.
*   **Integración de Logo:** Soporte para cargar y renderizar el logotipo de la empresa mediante conversión a base64 (resolviendo problemas de CORS al ejecutarse localmente).

## Tecnologías Utilizadas

*   HTML5 (Semántico)
*   CSS3 (Custom Properties, Flexbox, CSS Grid, Animaciones)
*   JavaScript (ES6+, DOM Manipulation, Event Listeners)
*   [jsPDF (v4.2.1)](https://github.com/parallax/jsPDF) - Generación del PDF
*   [jsPDF-AutoTable (v3.8.2)](https://github.com/simonbengtsson/jsPDF-AutoTable) - Tablas para el PDF

## Uso y Personalización

Para usar este generador en tu propio proyecto o empresa:

1.  **Datos del Emisor:** Abre el archivo `app.js` y edita el objeto constante `EMISOR` al inicio del archivo con los datos de tu empresa (Nombre, RUT, Dirección, Email, Teléfono).
2.  **Logo:** Reemplaza el archivo `logo.png` existente en el directorio raíz por el logotipo de tu empresa (recomendado en formato PNG y proporción cuadrada o rectangular pequeña).
3.  **Despliegue:** Dado que es estático, simplemente sube los archivos a cualquier hosting gratuito como GitHub Pages, Vercel o Netlify, o simplemente abre `index.html` en tu navegador.

## Licencia
MIT License