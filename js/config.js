/* ==========================================================================
   CONFIGURACIÓN DE LA TIENDA
   Cambiá estos datos y guardá el archivo. No hace falta tocar nada más.
   ========================================================================== */

window.TIENDA = {
  nombre: "Bel Intimma",

  /* Número de WhatsApp que recibe los pedidos.
     Formato: 549 + código de área sin 0 + número sin 15.
     Ejemplo: 11 1234-5678  ->  "5491112345678" */
  whatsapp: "54911XXXXXXXX",

  instagram: "bel.intimma",
  tiktok: "bel.intimma",

  zona: "Gral. San Martín, Buenos Aires",

  /* Descuento por pagar con transferencia o efectivo (en %).
     Si lo ponés en 0, no se muestra. */
  descuentoTransferencia: 0,

  mediosDePago: [
    "Transferencia",
    "Mercado Pago",
    "Efectivo",
    "Tarjetas de débito y crédito"
  ],

  /* Formas de entrega que aparecen en el pedido. */
  entregas: [
    { id: "retiro", nombre: "Retiro en Gral. San Martín" },
    { id: "envio", nombre: "Envío a domicilio", pideDireccion: true }
  ],

  /* Mensajes de la franja de arriba de todo (van rotando). */
  avisos: [
    "Aceptamos todos los medios de pago",
    "Retiro en Gral. San Martín y envíos a coordinar",
    "Consultá talles por WhatsApp, te asesoramos"
  ],

  /* Categorías del catálogo. El "id" es el que usás en cada producto.
     "dibujo" elige la ilustración que se muestra si el producto no tiene foto:
     "con-aro", "sin-aro" o "pijama". */
  categorias: [
    { id: "sin-aro", nombre: "Conjuntos sin aro", corto: "Sin aro", dibujo: "sin-aro" },
    { id: "con-aro", nombre: "Conjuntos con aro", corto: "Con aro", dibujo: "con-aro" },
    { id: "pijamas", nombre: "Pijamas", corto: "Pijamas", dibujo: "pijama" }
  ]
};
