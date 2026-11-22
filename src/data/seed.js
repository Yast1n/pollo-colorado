// Datos iniciales del modo demo local (y semilla de referencia para supabase/migrations/20261122000000_init.sql).
// Precios, horarios y textos son DATOS DE EJEMPLO: edítalos desde /#/admin.

export const CATEGORIES = [
  { id: 'pollos', label: 'Pollos a las Brasas' },
  { id: 'combos', label: 'Combos Familiares' },
  { id: 'acompanamientos', label: 'Papas y Acompañamientos' },
  { id: 'bebidas', label: 'Bebidas y Extras' },
]

export const TAGS = [
  { id: 'mas-pedido', label: 'Más pedido' },
  { id: 'ultimas', label: 'Últimas unidades' },
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'promo', label: 'Promo' },
]

export const STATUSES = [
  { id: 'open', label: 'Abierto ahora', hint: 'Pollos saliendo de las brasas' },
  { id: 'scheduling', label: 'Agendando pedidos', hint: 'Reserva tu pollo para más tarde' },
  { id: 'soldout', label: 'Agotado por hoy', hint: 'Vuelve mañana temprano' },
  { id: 'closed', label: 'Cerrado', hint: 'Revisa nuestros horarios' },
]

const img = (name) => `images/productos/${name}.svg`

export const SEED_PRODUCTS = [
  {
    id: 'p-entero',
    name: 'Pollo entero a las brasas',
    description: 'Adobo de la casa, 12 horas de reposo y piel dorada a fuego lento de carbón.',
    category: 'pollos',
    price: 13990,
    weight_label: '2.4 – 2.5 kg',
    portions: '4 personas',
    image_url: img('pollo-entero'),
    tags: ['mas-pedido'],
    available: true,
    sort_order: 1,
  },
  {
    id: 'p-medio',
    name: 'Medio pollo a las brasas',
    description: 'La misma receta en formato para dos. Elige pechuga o trutro al retirar.',
    category: 'pollos',
    price: 7490,
    weight_label: '1.2 kg aprox.',
    portions: '2 personas',
    image_url: img('medio-pollo'),
    tags: [],
    available: true,
    sort_order: 2,
  },
  {
    id: 'p-cuarto',
    name: 'Cuarto de pollo',
    description: 'Trutro entero con piel crujiente. Ideal para almuerzo individual.',
    category: 'pollos',
    price: 4290,
    weight_label: '600 g aprox.',
    portions: '1 persona',
    image_url: img('cuarto-pollo'),
    tags: ['ultimas'],
    available: true,
    sort_order: 3,
  },
  {
    id: 'c-familiar',
    name: 'Combo Familiar',
    description: 'Pollo entero, papas fritas familiares, ensalada chilena y bebida 1.5 L.',
    category: 'combos',
    price: 21990,
    weight_label: 'Pollo 2.4 – 2.5 kg',
    portions: '4 – 5 personas',
    image_url: img('combo-familiar'),
    tags: ['mas-pedido', 'promo'],
    available: true,
    sort_order: 1,
  },
  {
    id: 'c-pareja',
    name: 'Combo Pareja',
    description: 'Medio pollo, papas fritas medianas y dos bebidas en lata.',
    category: 'combos',
    price: 12490,
    weight_label: 'Pollo 1.2 kg aprox.',
    portions: '2 personas',
    image_url: img('combo-pareja'),
    tags: [],
    available: true,
    sort_order: 2,
  },
  {
    id: 'c-domingo',
    name: 'Combo Domingo Largo',
    description: 'Dos pollos enteros, papas familiares dobles, arroz graneado y bebida 3 L.',
    category: 'combos',
    price: 38990,
    weight_label: '2 pollos de 2.4 kg',
    portions: '8 – 10 personas',
    image_url: img('combo-familiar'),
    tags: ['nuevo'],
    available: false,
    sort_order: 3,
  },
  {
    id: 'a-papas-fam',
    name: 'Papas fritas familiares',
    description: 'Papa cortada en casa, doble fritura y sal de mar.',
    category: 'acompanamientos',
    price: 4990,
    weight_label: '800 g',
    portions: '3 – 4 personas',
    image_url: img('papas-fritas'),
    tags: ['mas-pedido'],
    available: true,
    sort_order: 1,
  },
  {
    id: 'a-papas-med',
    name: 'Papas fritas medianas',
    description: 'La porción justa para acompañar un cuarto o medio pollo.',
    category: 'acompanamientos',
    price: 2990,
    weight_label: '400 g',
    portions: '1 – 2 personas',
    image_url: img('papas-fritas'),
    tags: [],
    available: true,
    sort_order: 2,
  },
  {
    id: 'a-chilena',
    name: 'Ensalada chilena',
    description: 'Tomate, cebolla pluma amortiguada y cilantro. Aliño aparte.',
    category: 'acompanamientos',
    price: 2490,
    weight_label: '500 g',
    portions: '3 personas',
    image_url: img('ensalada'),
    tags: [],
    available: true,
    sort_order: 3,
  },
  {
    id: 'a-arroz',
    name: 'Arroz graneado',
    description: 'Arroz con zanahoria y un toque de ajo, cocinado cada mañana.',
    category: 'acompanamientos',
    price: 2290,
    weight_label: '500 g',
    portions: '3 personas',
    image_url: img('arroz'),
    tags: [],
    available: true,
    sort_order: 4,
  },
  {
    id: 'b-bebida15',
    name: 'Bebida 1.5 L',
    description: 'Cola, cola zero, naranja o pomelo según disponibilidad.',
    category: 'bebidas',
    price: 2190,
    weight_label: '1.5 L',
    portions: '',
    image_url: img('bebida'),
    tags: [],
    available: true,
    sort_order: 1,
  },
  {
    id: 'b-salsas',
    name: 'Pack de salsas de la casa',
    description: 'Ají pebre, mayonesa casera y salsa de ajo. Tres potes de 100 ml.',
    category: 'bebidas',
    price: 1490,
    weight_label: '3 × 100 ml',
    portions: '',
    image_url: img('salsas'),
    tags: [],
    available: true,
    sort_order: 2,
  },
]

export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export const SEED_CONFIG = {
  status: 'open',
  announcement: '¡Nueva tanda de pollos saliendo de las brasas a las 13:30 hrs!',
  announcement_enabled: true,
  whatsapp: '56900000000',
  greeting: 'Hola Pollo Colorado 👋 Quiero consultar disponibilidad para este pedido:',
  hero_title: 'Pollos asados a las brasas',
  hero_subtitle: 'Calibrados 2.4 – 2.5 kg, adobados la noche anterior y dorados a carbón en Pirque.',
  address: 'Pirque, Región Metropolitana',
  maps_query: 'Pirque, Región Metropolitana, Chile',
  delivery_note: 'Delivery solo dentro de Pirque. El costo de envío se confirma por WhatsApp.',
  // Índice 0 = domingo (igual que Date.getDay()).
  hours: [
    { open: '12:00', close: '17:00', closed: false },
    { open: '12:00', close: '20:00', closed: true },
    { open: '12:00', close: '20:00', closed: false },
    { open: '12:00', close: '20:00', closed: false },
    { open: '12:00', close: '20:00', closed: false },
    { open: '12:00', close: '21:00', closed: false },
    { open: '12:00', close: '21:00', closed: false },
  ],
  socials: { instagram: '', facebook: '', tiktok: '' },

  // ----- Textos y diseño (todo editable en /#/admin > Personalizar) -----
  hero_accent_words: 2, // cuántas palabras del final del título van en color brasa
  hero_cta_menu: 'Ver el menú',
  hero_cta_whatsapp: 'Escribir por WhatsApp',
  hero_image: 'images/fotos/hero-pollo.jpg',
  hero_image_alt: 'Pollo entero dorado girando en el asador',

  brand: { name: 'Pollo', accent: 'Colorado', logo_url: '', show_name: true },
  nav: { menu: 'Menú', secret: 'El secreto', visit: 'Horarios y ubicación', cart: 'Tu pedido' },
  stamp: { enabled: true, ring_text: 'CALIBRADOS · A LAS BRASAS · PIRQUE ·', big: '2.4–2.5', unit: 'kg' },

  menu_section: {
    title: 'La carta',
    subtitle: 'Arma tu pedido aquí y lo confirmamos contigo por WhatsApp. Precios en pesos chilenos.',
    all_label: 'Todo',
    empty_text: 'Todavía no hay productos en esta categoría. Prueba con otra o escríbenos por WhatsApp.',
    add_label: 'Agregar',
    soldout_label: 'Agotado',
  },
  category_labels: {
    pollos: 'Pollos a las Brasas',
    combos: 'Combos Familiares',
    acompanamientos: 'Papas y Acompañamientos',
    bebidas: 'Bebidas y Extras',
  },
  tag_labels: { 'mas-pedido': 'Más pedido', ultimas: 'Últimas unidades', nuevo: 'Nuevo', promo: 'Promo' },
  status_texts: {
    open: { label: 'Abierto ahora', hint: 'Pollos saliendo de las brasas' },
    scheduling: { label: 'Agendando pedidos', hint: 'Reserva tu pollo para más tarde' },
    soldout: { label: 'Agotado por hoy', hint: 'Vuelve mañana temprano' },
    closed: { label: 'Cerrado', hint: 'Revisa nuestros horarios' },
  },

  process: {
    title: 'El secreto de nuestras',
    accent: 'brasas',
    ambient_image: 'images/fotos/brasas-ambiente.jpg',
    // stat: la cifra grande del paso; su primer número se anima como contador.
    steps: [
      {
        title: 'Calibrado 2.4 – 2.5 kg',
        text: 'Elegimos pollos del mismo tamaño para que todos se cocinen igual: jugosos por dentro y sin partes secas.',
        stat: '2.5 kg',
        stat_label: 'por pollo, máximo',
        image: 'images/fotos/paso-calibrado.jpg',
      },
      {
        title: 'Adobo nocturno',
        text: 'Ajo, comino, merkén suave y sal de mar. Cada pollo reposa en frío toda la noche para que el sabor llegue al hueso.',
        stat: '12 h',
        stat_label: 'de reposo en adobo',
        image: 'images/fotos/paso-adobo.jpg',
      },
      {
        title: 'Brasas de carbón',
        text: 'Carbón vegetal y fuego lento, nunca gas. Lo sacamos cuando la piel cruje y el jugo corre claro.',
        stat: '100%',
        stat_label: 'carbón vegetal',
        image: 'images/fotos/paso-brasas.jpg',
      },
    ],
  },

  marquee: {
    enabled: true,
    text: 'BRASAS REALES • PIRQUE • 2.4 – 2.5 KG • DORADO CRUJIENTE •',
  },

  visit: {
    title: 'Horarios y ubicación',
    intro: 'Retira en el local o pide delivery.',
    big_word: 'Pirque',
    hours_title: 'Horarios',
    where_title: 'Dónde estamos',
    where_text: 'Busca el humo de las brasas. Te guiamos por WhatsApp si te pierdes.',
    btn_maps: 'Abrir en Google Maps',
    btn_waze: 'Abrir en Waze',
    btn_whatsapp: 'Preguntar por WhatsApp',
  },

  cart: {
    title: 'Tu pedido',
    empty_title: 'Tu pedido está vacío',
    empty_text: 'Elige algo de la carta para empezar.',
    send_label: 'Consultar y Pedir por WhatsApp',
    quick_notes: ['Sin ají', 'Bien dorado', 'Papas sin sal', 'Cortado en presas'],
    closing_pickup: '¿Me confirman disponibilidad para esa hora? ¡Gracias!',
    closing_delivery: '¿Tienen disponibilidad y cuánto sería el envío? ¡Gracias!',
  },

  footer: {
    tagline: 'Pollos asados a las brasas en Pirque.',
    copyright: 'Pollo Colorado. Imágenes ilustrativas; los productos pueden variar.',
    admin_label: 'Acceso dueños',
    // Las fotos de muestra son de Wikimedia Commons y su licencia exige este crédito.
    // Al reemplazarlas por fotos propias, borra esta línea desde el panel.
    credits:
      'Fotos de muestra: Joe Schneid (CC BY 3.0), Gatorfan252525 (CC BY-SA 4.0), Dtarazona (CC BY-SA 3.0), Koutchika Lihouenou Gaspard (CC BY-SA 4.0), diddi4 (CC0), vía Wikimedia Commons.',
  },

  seo: {
    title: 'Pollo Colorado · Pollos asados a las brasas en Pirque',
    description:
      'Pollos asados a las brasas en Pirque, calibrados 2.4 – 2.5 kg. Combos familiares, papas fritas caseras y agregados. Arma tu pedido y consúltalo por WhatsApp.',
  },
}
