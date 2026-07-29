/* ============================================================
   storage.js
   Motor de datos de Objex.
   - Carga inicial desde JSON (fetch)
   - Persistencia en localStorage
   - Funciones genéricas de lectura/escritura/reset
   ============================================================ */

const OBJEX_DB = {
  categorias: "objex_categorias",
  ubicaciones: "objex_ubicaciones",
  usuarios: "objex_usuarios",
  publicaciones: "objex_publicaciones",
  sesion: "objex_sesion" 
};

/**
 * Carga una colección: primero intenta localStorage;
 * si no existe, hace fetch al JSON original y lo guarda.
 * @param {string} rutaJson - ruta relativa al archivo JSON (según la página)
 * @param {string} clave - clave de OBJEX_DB a usar en localStorage
 * @returns {Promise<Array>} arreglo de datos
 */
function normalizarColeccion(datos) {
  if (Array.isArray(datos)) return datos;

  if (datos && typeof datos === "object") {
    const claves = Object.keys(datos);
    const claveArray = claves.find(k => Array.isArray(datos[k]));

    if (claveArray) {
      return datos[claveArray];
    }
  }

  return [];
}

async function cargarColeccion(rutaJson, clave) {
  const guardado = localStorage.getItem(clave);

  if (guardado) {
    try {
      const datos = JSON.parse(guardado);
      return normalizarColeccion(datos);
    } catch (error) {
      console.error(`Error al parsear ${clave} desde localStorage:`, error);
      localStorage.removeItem(clave);
    }
  }

  try {
    const respuesta = await fetch(rutaJson);

    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar ${rutaJson} (status ${respuesta.status})`);
    }

    const datos = await respuesta.json();
    const coleccionNormalizada = normalizarColeccion(datos);
    localStorage.setItem(clave, JSON.stringify(coleccionNormalizada));
    return coleccionNormalizada;

  } catch (error) {
    console.error(`Error al cargar la colección "${clave}":`, error);
    return [];
  }
}

/**
 * Guarda un arreglo completo en localStorage bajo una clave.
 */
function guardarColeccion(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
    return true;
  } catch (error) {
    console.error(`Error al guardar la colección "${clave}":`, error);
    return false;
  }
}

function obtenerLikesPorUsuario() {
  try {
    const guardado = localStorage.getItem("objex_likes_usuarios");
    if (!guardado) return {};

    const datos = JSON.parse(guardado);
    return datos && typeof datos === "object" ? datos : {};
  } catch (error) {
    console.error("Error al leer likes de usuarios:", error);
    return {};
  }
}

function guardarLikesPorUsuario(datos) {
  try {
    localStorage.setItem("objex_likes_usuarios", JSON.stringify(datos));
    return true;
  } catch (error) {
    console.error("Error al guardar likes de usuarios:", error);
    return false;
  }
}

function obtenerLikesDeUsuario(usuarioId) {
  const likesPorUsuario = obtenerLikesPorUsuario();
  const likes = likesPorUsuario[usuarioId];
  return Array.isArray(likes) ? likes : [];
}

function registrarLikeUsuario(usuarioId, postId) {
  if (!usuarioId || !postId) {
    return { ok: false, motivo: "datos_invalidos" };
  }

  const likesPorUsuario = obtenerLikesPorUsuario();
  const likesActuales = Array.isArray(likesPorUsuario[usuarioId]) ? likesPorUsuario[usuarioId] : [];

  if (likesActuales.includes(postId)) {
    return { ok: false, motivo: "ya_likeado" };
  }

  likesActuales.push(postId);
  likesPorUsuario[usuarioId] = likesActuales;

  if (!guardarLikesPorUsuario(likesPorUsuario)) {
    return { ok: false, motivo: "no_guardado" };
  }

  return { ok: true, likes: likesActuales };
}

/**
 * Restablece una colección a su estado original del JSON,
 * ignorando lo que haya en localStorage.
 */
async function restablecerColeccion(rutaJson, clave) {
  try {
    const respuesta = await fetch(rutaJson);

    if (!respuesta.ok) {
      throw new Error(`No se pudo restablecer ${rutaJson} (status ${respuesta.status})`);
    }

    const datos = await respuesta.json();
    localStorage.setItem(clave, JSON.stringify(datos));
    return datos;

  } catch (error) {
    console.error(`Error al restablecer la colección "${clave}":`, error);
    return null;
  }
}

/**
 * Restablece TODAS las colecciones de Objex a sus JSON originales.
 * Se usa en la opción "Restablecer datos" (punto 7.9 del proyecto).
 */
async function restablecerTodo(rutas) {
  // rutas = { categorias, ubicaciones, usuarios, publicaciones } con las rutas relativas de cada página
  const resultados = await Promise.all([
    restablecerColeccion(rutas.categorias, OBJEX_DB.categorias),
    restablecerColeccion(rutas.ubicaciones, OBJEX_DB.ubicaciones),
    restablecerColeccion(rutas.usuarios, OBJEX_DB.usuarios),
    restablecerColeccion(rutas.publicaciones, OBJEX_DB.publicaciones)
  ]);

  return {
    categorias: resultados[0],
    ubicaciones: resultados[1],
    usuarios: resultados[2],
    publicaciones: resultados[3]
  };
}

/**
 * Genera un nuevo id único dentro de un arreglo de objetos con propiedad "id".
 */
function generarId(arreglo) {
  if (!arreglo.length) return 1;
  return Math.max(...arreglo.map(item => item.id)) + 1;
}

/* --------- Sesión (usuario "logeado") --------- */

function guardarSesion(usuario) {
  localStorage.setItem(OBJEX_DB.sesion, JSON.stringify(usuario));
}

function obtenerSesion() {
  const datos = localStorage.getItem(OBJEX_DB.sesion);
  return datos ? JSON.parse(datos) : null;
}

function cerrarSesion() {
  localStorage.removeItem(OBJEX_DB.sesion);
}