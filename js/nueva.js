/* ============================================================
   nueva.js
   Página: pages/publicaciones/nueva.html
   Depende de: storage.js, utils.js
   ============================================================ */

const RUTAS_NUEVA = {
  categorias: "../../json/categorias.json",
  ubicaciones: "../../json/ubicaciones.json",
  publicaciones: "../../json/publicaciones.json"
};

let categoriasNueva = [];
let ubicacionesNueva = [];
let publicacionesNueva = [];

document.addEventListener("DOMContentLoaded", iniciarNueva);

async function iniciarNueva() {
  try {
    const [categorias, ubicaciones, publicaciones] = await Promise.all([
      cargarColeccion(RUTAS_NUEVA.categorias, OBJEX_DB.categorias),
      cargarColeccion(RUTAS_NUEVA.ubicaciones, OBJEX_DB.ubicaciones),
      cargarColeccion(RUTAS_NUEVA.publicaciones, OBJEX_DB.publicaciones)
    ]);

    categoriasNueva = categorias;
    ubicacionesNueva = ubicaciones;
    publicacionesNueva = publicaciones;

    poblarSelect("categoria", categorias, "todos", "Selecciona una categoría");
    poblarSelect("ubicacion", ubicaciones, "toda", "Selecciona una ubicación");

    enlazarFormularioNueva();

  } catch (error) {
    console.error(error);
    mostrarError("No se pudo preparar el formulario de nueva publicación.");
  }
}

function enlazarFormularioNueva() {
  const form = document.querySelector(".card-nueva form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    manejarEnvioNueva(form);
  });
}

function manejarEnvioNueva(form) {
  const titulo = form.titulo.value.trim();
  const descripcion = form.descripcion.value.trim();
  const categoriaValor = form.categoria.value;
  const ubicacionValor = form.ubicacion.value;
  const imagen = form.imagen ? form.imagen.value : "";
  const estado = form.estado ? form.estado.value : "perdido";
  const contacto = form.contacto.value.trim();

  // --- Validaciones (punto 7.6) ---
  if (!titulo || !descripcion || !contacto) {
    mostrarError("Por favor completa todos los campos obligatorios.");
    return;
  }

  if (categoriaValor === "todos" || ubicacionValor === "toda") {
    mostrarError("Selecciona una categoría y una ubicación válidas.");
    return;
  }

  const soloNumeros = /^[0-9]{7,10}$/;
  if (!soloNumeros.test(contacto)) {
    mostrarError("El número de contacto debe tener entre 7 y 10 dígitos.");
    return;
  }

  const categoria = categoriasNueva.find(c => c.valor === categoriaValor);
  const ubicacion = ubicacionesNueva.find(u => u.valor === ubicacionValor);

  const sesion = obtenerSesion();

  const nuevaPublicacion = {
    id: generarId(publicacionesNueva), // evita ids duplicados
    titulo,
    descripcion,
    categoriaId: categoria ? categoria.id : null,
    ubicacionId: ubicacion ? ubicacion.id : null,
    estado,
    fecha: new Date().toISOString().split("T")[0],
    contacto,
    imagen: imagen || "src/icons/usuario.png",
    usuarioId: sesion ? sesion.id : 1,
    destacado: false
  };

  publicacionesNueva.push(nuevaPublicacion);
  const guardado = guardarColeccion(OBJEX_DB.publicaciones, publicacionesNueva);

  if (!guardado) {
    mostrarError("No se pudo guardar la publicación. Intenta nuevamente.");
    return;
  }

  notificar("Publicación creada correctamente.", "exito");
  form.reset();

  setTimeout(() => {
    window.location.href = "publicaciones.html";
  }, 1200);
}

/* Reutilizamos la misma lógica de poblarSelect de publicaciones.js.
   Si nueva.js se carga solo (sin publicaciones.js en la misma página),
   se define aquí también para no depender del orden de carga. */
function poblarSelect(idSelect, coleccion, valorTodos, textoTodos) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  select.innerHTML = `<option value="${valorTodos}" disabled selected>${textoTodos}</option>`;
  coleccion.forEach(item => {
    const opcion = document.createElement("option");
    opcion.value = item.valor;
    opcion.textContent = item.nombre;
    select.appendChild(opcion);
  });
}