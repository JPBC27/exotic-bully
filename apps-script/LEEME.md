# Backend de RiverBulls (Google Sheet + Apps Script)

Este código corre en Google, no en la web. Sheet: `1NJJxItkdajb1KysfznUY3yKRJLe__xFlZhCX96bDj3I`
Script ID (en `.clasp.json`): `1u6AZJYnGP_itksM-9Vy0kFQaMooD-Xlxi8-PffK19zO0OyFyfNS6X-_H`

## 1. Subir el código (clasp, desde esta carpeta)
```
cd Desktop\exotic-bully\apps-script
npx @google/clasp login        # una vez, con tu cuenta personal de Google (la dueña del Sheet)
npx @google/clasp push         # sube Code.gs y appsscript.json
```
Antes de cada push, verifica que el scriptId de `.clasp.json` sea el de arriba.
Si clasp dice que la API está desactivada: activa "API de Google Apps Script" en https://script.google.com/home/usersettings

## 2. Preparar las hojas (una vez)
En el editor de Apps Script elige `configurar` › Ejecutar y acepta los permisos.
Crea Visitas, Contactos, Cachorros, Ventas, Admins y Resumen, y te agrega como Admin.

## 3. Login de Google para el panel (una vez)
1. https://console.cloud.google.com › crea un proyecto "RiverBulls" (gratis, no pide tarjeta).
2. APIs y servicios › Pantalla de consentimiento de OAuth › Externo. Nombre "RiverBulls", tu correo.
   Luego "Publicar app" (pasa a En producción). Si la dejas en Prueba, solo entran los correos
   que agregues como usuarios de prueba: es el error más común.
3. Credenciales › Crear credenciales › ID de cliente de OAuth › Aplicación web.
   Orígenes de JavaScript autorizados: https://jpbc27.github.io
4. Copia el ID de cliente (termina en .apps.googleusercontent.com) y pégalo en:
   - `Code.gs` → `const CLIENT_ID = '...'`  (y vuelve a hacer `clasp push`)
   - `js/datos.js` → `googleClientId: '...'`

## 4. Publicar como aplicación web
Editor › Implementar › Nueva implementación › Aplicación web.
Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario. Copia la URL /exec y pégala en `js/datos.js` → `api`.
Para cambios futuros en Code.gs: `clasp push` y luego Implementar › Administrar implementaciones ›
editar (lápiz) › Versión: Nueva versión. La URL /exec no cambia.

## Día a día
- **Panel**: https://jpbc27.github.io/exotic-bully/admin.html — cambiar estado (Disponible, Reservado, Oculto)
  y registrar ventas. El precio se llena con el publicado; si diste descuento, lo cambias y queda registrado.
- **Admins**: agrega correos de Google con rol Admin (ve costos y ganancias) o Vendedor (solo marca ventas).
  Para quitar acceso, pon Activo = No.
- **Cachorros**: los agregas en la hoja (ID corto único, ej. R01). Costo no se muestra en la web ni a vendedores.
- **Resumen**: visitas por ciudad, hora, día y fuente; contactos y compras por distrito; ventas y ganancia.
