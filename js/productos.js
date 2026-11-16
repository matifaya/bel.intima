/* ==========================================================================
   CATÁLOGO DE PRODUCTOS
   --------------------------------------------------------------------------
   Cada producto va entre llaves { ... } y termina con una coma.
   Para agregar uno nuevo: copiá un bloque completo, pegalo abajo y cambiá
   los datos. Para sacarlo de la página sin borrarlo: disponible: false

   Campos:
     id            Nombre corto y único, sin espacios ni tildes (se usa en el link).
     nombre        Como se ve en la página.
     categoria     "sin-aro", "con-aro" o "pijamas" (ver js/config.js).
     precio        Número sin puntos ni signo $. Ej: 18900
     precioAntes   (opcional) Precio tachado si está en oferta. Si no, null.
     talles        Lista de talles disponibles.
     colores       Lista de colores. Si es uno solo, igual va entre [ ].
     fotos         Rutas a las fotos dentro de la carpeta img/productos/.
                   Si la lista está vacía [ ], se muestra una ilustración.
     descripcion   Texto corto: tela, detalles, cómo calza.
     etiqueta      (opcional) "Nuevo", "Últimos", "Oferta"... o "" para nada.
     disponible    true = se ve en la página / false = oculto.

   Los productos de abajo son EJEMPLOS: reemplazalos por los tuyos.
   ========================================================================== */

window.PRODUCTOS = [
  {
    id: "conjunto-ambar",
    nombre: "Conjunto Ámbar",
    categoria: "sin-aro",
    precio: 16900,
    precioAntes: null,
    talles: ["S", "M", "L", "XL"],
    colores: ["Rosa", "Negro", "Blanco"],
    fotos: [],
    descripcion: "Top triangular de puntilla con breteles regulables y bombacha colaless al tono. Sin aro y sin push up, para usar todo el día.",
    etiqueta: "Nuevo",
    disponible: true
  },
  {
    id: "conjunto-margarita",
    nombre: "Conjunto Margarita",
    categoria: "sin-aro",
    precio: 15500,
    precioAntes: null,
    talles: ["S", "M", "L"],
    colores: ["Lila", "Celeste"],
    fotos: [],
    descripcion: "Bralette de algodón con lycra y bombacha vedetina. Suave, liviano y sin costuras que marquen.",
    etiqueta: "",
    disponible: true
  },
  {
    id: "conjunto-nube",
    nombre: "Conjunto Nube",
    categoria: "sin-aro",
    precio: 17800,
    precioAntes: 19900,
    talles: ["M", "L", "XL"],
    colores: ["Rosa bebé"],
    fotos: [],
    descripcion: "Top de microfibra con taza soft removible y bombacha tiro alto. El más cómodo para dormir o estar en casa.",
    etiqueta: "Oferta",
    disponible: true
  },
  {
    id: "conjunto-luna",
    nombre: "Conjunto Luna",
    categoria: "sin-aro",
    precio: 18400,
    precioAntes: null,
    talles: ["S", "M", "L"],
    colores: ["Negro", "Bordó"],
    fotos: [],
    descripcion: "Encaje elastizado con espalda cruzada y bombacha cola less. Delicado y con buena sujeción sin aro.",
    etiqueta: "",
    disponible: true
  },
  {
    id: "conjunto-violeta",
    nombre: "Conjunto Violeta",
    categoria: "con-aro",
    precio: 22900,
    precioAntes: null,
    talles: ["85", "90", "95", "100"],
    colores: ["Rosa", "Negro"],
    fotos: [],
    descripcion: "Corpiño con aro y taza soft, encaje en el escote y moñito central. Bombacha colaless de encaje al tono.",
    etiqueta: "Nuevo",
    disponible: true
  },
  {
    id: "conjunto-rosa-mosqueta",
    nombre: "Conjunto Rosa Mosqueta",
    categoria: "con-aro",
    precio: 24500,
    precioAntes: null,
    talles: ["85", "90", "95"],
    colores: ["Rosa viejo", "Nude"],
    fotos: [],
    descripcion: "Balconette con aro y push up suave. Breteles regulables y desmontables. Bombacha vedetina de tul bordado.",
    etiqueta: "Últimos",
    disponible: true
  },
  {
    id: "conjunto-camelia",
    nombre: "Conjunto Camelia",
    categoria: "con-aro",
    precio: 23800,
    precioAntes: null,
    talles: ["90", "95", "100", "105"],
    colores: ["Blanco", "Negro", "Rojo"],
    fotos: [],
    descripcion: "Corpiño con aro de taza entera, buena contención para talles grandes. Bombacha culotte de encaje.",
    etiqueta: "",
    disponible: true
  },
  {
    id: "pijama-frutilla",
    nombre: "Pijama Frutilla",
    categoria: "pijamas",
    precio: 27900,
    precioAntes: null,
    talles: ["S", "M", "L", "XL"],
    colores: ["Rosa estampado"],
    fotos: [],
    descripcion: "Camisa manga corta con ribete y short de modal. Fresco para el verano, suave al tacto.",
    etiqueta: "Nuevo",
    disponible: true
  },
  {
    id: "pijama-satin",
    nombre: "Pijama Satín",
    categoria: "pijamas",
    precio: 32500,
    precioAntes: null,
    talles: ["S", "M", "L"],
    colores: ["Champagne", "Rosa", "Negro"],
    fotos: [],
    descripcion: "Camisa con botones y short de satén con ribete en contraste. Ideal para regalar.",
    etiqueta: "",
    disponible: true
  },
  {
    id: "pijama-algodon",
    nombre: "Pijama Algodón Corazones",
    categoria: "pijamas",
    precio: 25900,
    precioAntes: 28500,
    talles: ["M", "L", "XL", "XXL"],
    colores: ["Blanco y rosa", "Gris y rosa"],
    fotos: [],
    descripcion: "Remera y short de algodón peinado con estampa de corazones. El de todos los días.",
    etiqueta: "Oferta",
    disponible: true
  }
];
