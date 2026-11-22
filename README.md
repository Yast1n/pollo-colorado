# Pollo Colorado

Sitio web y panel de administración para **Pollo Colorado**, pollos asados a las brasas en Pirque, Chile.

- **Sitio público:** hero animado, carta con filtros, armador de pedido y envío del pedido por WhatsApp, sección "El secreto de nuestras brasas", horarios y ubicación.
- **Panel privado (`/#/admin`):** estado del local en vivo, aviso superior, CRUD del menú con fotos, y datos del negocio (WhatsApp, horarios, textos y redes).
- **Stack:** React 19, Vite 8, Tailwind CSS 4, GSAP 3 (ScrollTrigger y Flip), Supabase (Auth, Database, Storage y Realtime) y GitHub Pages.

---

## 1. Correr en local

Requisito: Node 20 o superior (probado con Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

Sin archivo `.env`, la app arranca en **Modo Demo Local**:

- Los datos se guardan en el `localStorage` del navegador y parten de `src/data/seed.js`.
- En `/#/admin` aparece el botón **"Entrar en modo demo"**. En este modo acepta cualquier email y contraseña, porque los datos son locales.
- El panel muestra el aviso *"Modo Demo Local: conecta Supabase para sincronizar en vivo"*.
- Los cambios se reflejan en las otras pestañas del mismo navegador, pero no en otros dispositivos.

> **¿No ves las animaciones?** La web respeta `prefers-reduced-motion`. Si en Windows tienes desactivado
> *Configuración → Accesibilidad → Efectos visuales → Efectos de animación*, el navegador pide movimiento
> reducido y la web muestra la versión estática a propósito. Actívalo para ver las animaciones.

---

## 2. Conectar Supabase (gratis)

1. Crea un proyecto en <https://supabase.com> (plan Free).
2. Abre **SQL Editor → New query**, pega todo el contenido de [`supabase/migrations/20261122000000_init.sql`](supabase/migrations/20261122000000_init.sql) y presiona **Run**. Esto crea:
   - las tablas `products` y `site_config` con datos de ejemplo;
   - las políticas **RLS**: cualquiera puede leer, pero solo los administradores pueden escribir;
   - el bucket público **`menu-images`** con sus políticas;
   - Realtime para que el estado del local y el menú cambien en vivo en el sitio;
   - la tabla `admin_users` y la función `is_admin()`.
3. **Crea al dueño:** en **Authentication → Users → Add user → Create new user**, ingresa email y contraseña y marca *Auto Confirm User*.
4. **Autoriza al dueño:** en el SQL Editor ejecuta la siguiente línea con su email en minúsculas:
   ```sql
   insert into public.admin_users (email) values ('dueno@tu-dominio.cl') on conflict do nothing;
   ```
5. **Recomendado:** en **Authentication → Sign In / Providers**, desactiva *Allow new users to sign up*.
6. Copia `.env.example` como `.env` y completa los valores desde **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
7. Reinicia `npm run dev`. El aviso de modo demo desaparece y el login usa `supabase.auth.signInWithPassword`.

**¿Por qué existe la tabla `admin_users`?** Las políticas del tipo "solo usuarios autenticados" no alcanzan. Si el registro público está activo, cualquiera podría crearse una cuenta con la anon key, que es pública porque va dentro del JavaScript, y editar el menú. Con `is_admin()`, solo pueden escribir los emails que tú autorizas.

La anon key **puede** ser pública: la seguridad la ponen las políticas RLS. **Nunca** uses la `service_role` key en el frontend.

---

## 3. Publicar en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub. La rama debe llamarse `main`.
2. En el repositorio, ve a **Settings → Pages → Build and deployment → Source** y elige **GitHub Actions**.
3. Opcional, para usar Supabase: ve a **Settings → Secrets and variables → Actions → New repository secret** y crea:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Sin estos secretos, el sitio se publica en Modo Demo Local.
4. Haz push a `main`. El workflow `.github/workflows/deploy.yml` compila y publica el sitio en `https://<usuario>.github.io/<repo>/`.

El proyecto funciona en subrutas de GitHub Pages por dos motivos:

- `vite.config.js` usa `base: './'`, así que los assets se cargan con rutas relativas.
- La app usa `HashRouter`, así que `/#/admin` no da error 404 al recargar la página.

---

## 4. Imágenes de productos

Las imágenes de `public/images/productos/` son **ilustraciones SVG de muestra**. Tienes dos formas de cambiarlas.

**Opción A (recomendada):** desde `/#/admin → Menú → Editar → Subir foto`. La foto se comprime en el navegador (máximo 1280 px, en WebP o JPEG) antes de subirse a Supabase Storage. Desde el celular, el selector permite usar la cámara. También puedes pegar una URL externa.

**Opción B (archivos locales):** reemplaza los archivos en `public/images/productos/` y actualiza la ruta del producto. Si usas `.jpg`, cambia la extensión en el admin o en `src/data/seed.js` y en `supabase/migrations/20261122000000_init.sql`.

| Archivo | Lo usa |
|---|---|
| `pollo-entero.svg` | Pollo entero, imagen del hero y paso 3 del proceso |
| `medio-pollo.svg` | Medio pollo y paso 2 |
| `cuarto-pollo.svg` | Cuarto de pollo y paso 1 |
| `combo-familiar.svg` | Combo Familiar, Combo Domingo Largo y paso 4 |
| `combo-pareja.svg` | Combo Pareja |
| `papas-fritas.svg` | Papas familiares y papas medianas |
| `ensalada.svg` | Ensalada chilena |
| `arroz.svg` | Arroz graneado |
| `bebida.svg` | Bebida 1.5 L |
| `salsas.svg` | Pack de salsas |

La imagen del hero y la de la sección del proceso están fijas en `src/components/Hero.jsx` y `src/components/Process.jsx`. Si reemplazas los archivos con fotos reales usando el mismo nombre, se actualizan solas.

---

## 5. Datos de ejemplo que debes reemplazar

Todos estos datos se editan en `/#/admin → Mi negocio` o en `/#/admin → Menú`:

- **WhatsApp `56900000000`:** es un número de relleno y debes poner el real, con el formato `569XXXXXXXX`.
- **Dirección:** solo dice "Pirque, Región Metropolitana". Agrega la calle y ajusta el texto de búsqueda de Maps.
- **Precios, pesos, porciones y horarios:** son plausibles, pero inventados.
- **Textos del proceso** en `src/components/Process.jsx` (adobo, merkén, carbón vegetal): son copy de ejemplo. Ajústalos a la receta real.
- **Redes sociales:** están vacías, así que no aparecen en el sitio.

---

## 6. Estructura

```
src/
  services/storeService.js   Capa de datos dual (Supabase o localStorage); la UI solo usa esta capa
  lib/supabase.js            Cliente de Supabase; detecta si faltan las variables de entorno
  lib/gsap.js                Registro de ScrollTrigger y Flip, y media queries de movimiento
  context/                   Store (configuración y menú en vivo) y Cart (carrito persistente)
  components/                Hero, Menu, ProductCard, Process, Visit, CartDrawer, Header, Footer…
  admin/                     Pestañas del panel, formulario de producto, toasts
  pages/Home.jsx, Admin.jsx  Admin se carga aparte (code splitting)
  utils/                     Formato CLP, mensaje de WhatsApp, franjas horarias, compresión de imágenes
supabase/migrations/20261122000000_init.sql          SQL completo listo para pegar
.github/workflows/deploy.yml Despliegue automático
```

## 7. Animaciones

- **Hero:** entrada coreografiada (resplandor de brasa, título palabra a palabra, estado, bajada, botones, plato y sello). Además tiene chispas en canvas que se pausan cuando no están en pantalla y parallax suave en el plato.
- **Carta:** revelado escalonado con `ScrollTrigger.batch` y transición entre categorías con GSAP Flip.
- **"El secreto de nuestras brasas":** en escritorio, la sección queda fija y el scroll llena un medidor de calor y avanza los 4 pasos, con snap entre ellos. En móvil se muestra como una lista.
- **Microinteracciones:** el botón "Agregar" late y muestra un "+1", el contador del carrito hace "pop" y los botones se hunden al presionarlos.
- **`prefers-reduced-motion`:** todo queda estático y visible, y el proceso se muestra como lista.

---

## 8. Publicado y cómo actualizar

- **Sitio:** https://yast1n.github.io/pollo-colorado/
- **Panel:** https://yast1n.github.io/pollo-colorado/#/admin
- **Supabase:** proyecto `pollo-colorado` (región São Paulo). Las credenciales están en `../PolloColorado-CREDENCIALES.txt`, que no está en el repo.

**Cambios de contenido** (menú, precios, fotos, estado, horarios): se hacen desde el panel admin. No requieren deploy y se ven en vivo.

**Cambios de código o diseño:**
```bash
npm run dev                 # probar en local (usa el .env conectado a Supabase)
git add -A && git commit -m "describe el cambio"
git push                    # GitHub Actions compila y publica en ~1 minuto
```

**Cambios en la base de datos** (columnas o tablas nuevas):
```bash
npx supabase migration new nombre_del_cambio   # crea supabase/migrations/<fecha>_nombre_del_cambio.sql
# escribe el SQL en ese archivo y luego:
npx supabase db push --remote
```
Nunca edites una migración que ya se aplicó: crea siempre una nueva.
