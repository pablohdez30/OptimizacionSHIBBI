# 3. Instalación del código Velo

Llegados aquí, ya tienes:
- ✅ Las 4 colecciones creadas con datos de seed (paso 1)
- ✅ La página `/presupuesto` montada con todos los IDs correctos (paso 2)

Toca enchufar el código.

## 3.1 Activar Velo en Wix Studio

1. Abre el editor de Wix Studio.
2. Barra superior → menú **"Dev Mode"** o el icono `</>`.
3. Haz clic en **"Turn on Velo"** / **"Start Coding"**.
4. Aparece un panel lateral izquierdo con tu árbol de ficheros (`Page Code`, `Public & Backend`, `Site Code`, etc.).

## 3.2 Pegar el código del wizard

1. En el árbol de Velo → selecciona la página **Presupuesto**.
2. Se abre el panel de código de la página.
3. Borra todo el contenido por defecto (los comentarios iniciales).
4. Copia el contenido completo de `code/page-presupuesto.js` y pégalo.
5. Guarda (Cmd/Ctrl + S).

> Si Velo te avisa de errores de "elemento no encontrado", revisa los IDs
> del paso 2. Cada `$w('#xxx')` debe corresponder a un elemento existente en
> la página con ese ID exacto.

## 3.3 Crear el módulo `public/pricing.js`

1. Velo → árbol → **Public & Backend** → **Public** → botón derecho → **New .js File**.
2. Nombre: `pricing.js`.
3. Pega el contenido de `code/public/pricing.js`.
4. Guarda.

## 3.4 Crear el módulo backend `backend/quotes.web.js`

1. Velo → árbol → **Public & Backend** → **Backend** → botón derecho → **New .js File**.
2. Nombre: `quotes.web.js` (sí, con `.web` en el nombre — eso lo convierte en Web Method).
3. Pega el contenido de `code/backend/quotes.web.js`.
4. Guarda.

## 3.5 Configurar las plantillas de email (Triggered Emails)

El backend dispara dos emails cuando llega una solicitud. Hay que crearlos
una vez en el dashboard de Wix.

### Email A — `NuevaSolicitudPresupuesto` (al equipo Shibbi)

1. Wix Dashboard → **Marketing & SEO** → **Triggered Emails**.
2. **+ Create New** → **Custom Email**.
3. Nombre interno: `NuevaSolicitudPresupuesto` ⚠️ (este nombre EXACTO lo usa el código)
4. **Recipients**: añade tu propio contacto con `shibbishop@gmail.com`.
5. **Subject**: `Nueva solicitud de presupuesto: {{nombre}} ({{tipo}})`
6. **Body** (sugerido):

   ```
   Hola Shibbi,

   Acaba de llegar una nueva solicitud de presupuesto desde la web.

   Cliente: {{nombre}}
   Tipo de mueble: {{tipo}}
   Material: {{material}}
   Estimación que vio el cliente: {{total}}

   Descripción libre:
   {{descripcion}}

   Ver detalle completo en el dashboard:
   CMS → SolicitudesPresupuesto → ID {{solicitudId}}

   ¡A presupuestar!
   ```

7. **Save**.

### Email B — `ConfirmacionSolicitudCliente` (al cliente)

1. **+ Create New** → **Custom Email**.
2. Nombre interno: `ConfirmacionSolicitudCliente`
3. **Recipients**: dinámico (al contacto que dispara el email).
4. **Subject**: `Hemos recibido tu solicitud, {{nombre}}`
5. **Body** (sugerido):

   ```
   Hola {{nombre}},

   ¡Recibido! Hemos guardado tu solicitud de {{tipo}} y la estamos
   revisando.

   Te respondemos en menos de 24 horas con un presupuesto detallado.

   Mientras tanto, si quieres añadir algo o tienes prisa, escríbenos
   por WhatsApp o respondiendo a este email.

   Un abrazo,
   El equipo de Shibbi
   ```

6. **Save**.

> Si renombras estos emails, recuerda actualizar las constantes
> `EMAIL_INTERNO` y `EMAIL_CONFIRMACION` en `backend/quotes.web.js`.

## 3.6 Probar en preview

1. Velo → botón **Preview** arriba a la derecha.
2. Navega a `/presupuesto`.
3. Recorre el wizard de principio a fin con datos ficticios.
4. Verifica:
   - ✅ Las tarjetas de categoría responden al click.
   - ✅ Los materiales y patas se cargan desde el CMS.
   - ✅ El precio del panel derecho se actualiza al elegir cosas.
   - ✅ Los m² se calculan al teclear medidas.
   - ✅ El resumen final muestra el desglose.
   - ✅ Al enviar, llega el email a `shibbishop@gmail.com` y la solicitud
     aparece en CMS → SolicitudesPresupuesto.

## 3.7 Publicar

Cuando todo funcione en preview:

1. Botón **Publish** arriba a la derecha.
2. La página queda en `https://www.shibbishop.com/presupuesto`.

> Recuerda: para publicar Velo necesitas **plan Premium** (que ya tienes).

## 3.8 Añadir el enlace en el menú principal

Para que los clientes lleguen a la página:

1. Editor → **Menus & Pages** → menú principal del sitio.
2. **+ Add Item** → enlace a la página `Presupuesto`.
3. Etiqueta sugerida: **"Pídenos presupuesto"** o **"Diseña tu mueble"**.

También puedes añadir un botón **CTA** grande en la home llamando a la
acción ("¿Tienes una idea? Cuéntanosla →").

---

## Solución de problemas comunes

### "Cannot read property 'precioM2' of null"
Algún material no tiene el campo `precioM2` rellenado. Edita la colección
y rellénalo todo.

### "Permission denied" al insertar solicitud
Revisa los permisos de la colección `SolicitudesPresupuesto`. Debe permitir
**Create: Anyone**. El campo `suppressAuth: true` del backend ya elude esto,
pero solo funciona si el archivo está en `backend/` y tiene `.web.js`.

### El email no llega
- Verifica que los nombres `NuevaSolicitudPresupuesto` y
  `ConfirmacionSolicitudCliente` coinciden EXACTAMENTE entre el dashboard
  y el código.
- Mira la consola de Velo (Dev Mode → Logs). Si ves "[email interno]"
  con error, ahí está la pista.
- Revisa también la carpeta de Spam de Gmail la primera vez.

### Las imágenes subidas no se guardan
El elemento `#uploadImagenes` debe tener configurado:
- File type: **Images**
- Max files: 5
- Max size: 10 MB

### El repeater no muestra nada
- Verifica que el campo `activo` está a `true` en la colección.
- Verifica que el `aplicableA` incluye el tipo de mueble correcto
  (`mesa`, `estanteria`, etc.).

---

## Checklist final

- [ ] Página `/presupuesto` visible y publicada
- [ ] Wizard completo de 5 pasos + confirmación funciona
- [ ] Precio en vivo se actualiza
- [ ] Email llega a shibbishop@gmail.com al enviar una solicitud de prueba
- [ ] El cliente recibe email de confirmación
- [ ] La solicitud aparece en `CMS → SolicitudesPresupuesto`
- [ ] Enlace en menú principal de la web

Cuando los 7 ítems estén ✅, está listo para clientes reales.
