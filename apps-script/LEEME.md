# Registro de contactos (Google Sheet + Apps Script)

Este código corre en Google, no en la web. Está aquí solo para tenerlo guardado junto al proyecto.

1. Crea un Google Sheet nuevo con tu cuenta personal de Google (no la corporativa), por ejemplo "RiverBulls - Contactos".
2. En el Sheet: Extensiones › Apps Script. Borra lo que aparezca y pega todo el contenido de `Code.gs`. Guarda.
3. Arriba elige la función `configurar` y toca Ejecutar. Acepta los permisos (te pedirá acceso a tus hojas de cálculo).
   Se crean las hojas "Contactos" y "Resumen".
4. Implementar › Nueva implementación › tipo "Aplicación web".
   - Ejecutar como: Yo
   - Quién tiene acceso: Cualquier usuario
   Toca Implementar y copia la URL que termina en `/exec`.
5. Pega esa URL en `js/datos.js` → `apiContactos: 'https://script.google.com/macros/s/.../exec'` y publica la web (git add, commit, push).

Si cambias `Code.gs` más adelante: Implementar › Administrar implementaciones › editar (lápiz) › Versión: Nueva versión.
Así la URL /exec se mantiene igual.

En la hoja "Contactos" tú actualizas la columna Estado (Nuevo, Escribió, Interesado, Separó, Compró, No respondió, Descartado)
y las Notas. La hoja "Resumen" se calcula sola.
