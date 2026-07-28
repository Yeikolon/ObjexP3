/* ============================================================
   postex.js
   Página: pages/publicaciones/postex.html
   Depende de: storage.js, utils.js
   ============================================================ */

const RUTAS_POSTEX = {
  publicaciones: "../../json/publicaciones.json",
  usuarios: "../../json/usuarios.json"
};
const CLAVE_POSTEX = "objex_postex_feed";

let estadoPostex = {
  posts: [],
  usuarios: [],
  filtroTexto: "",
  filtroEstado: "todos",
  paginaActual: 1,
  porPagina: 5
};

document.addEventListener("DOMContentLoaded", iniciarPostex);

async function iniciarPostex() {
  mostrarCargando("contenedor-anuncios", true, "Cargando anuncios...");

  try {
    const usuarios = await cargarColeccion(RUTAS_POSTEX.usuarios, OBJEX_DB.usuarios);
    estadoPostex.usuarios = usuarios;
    estadoPostex.posts = await cargarFeedPostex(usuarios);

    renderPostex();
    enlazarEventosPostex();

  } catch (error) {
    console.error(error);
    mostrarError("No se pudieron cargar los anuncios. Intenta recargar la página.");
  }
}

/* --------- Carga el feed --------- */
async function cargarFeedPostex(usuarios) {
  const publicaciones = await cargarColeccion(RUTAS_POSTEX.publicaciones, OBJEX_DB.publicaciones);

  return publicaciones.map(p => ({
    id: p.id,
    titulo: p.titulo,
    mensaje: p.descripcion,
    estado: p.estado,
    fecha: p.fecha,
    usuarioId: p.usuarioId,
    likes: p.likes || 0,
    comentarios: p.comentarios || []
  }));
}

function guardarFeedPostex() {
  const publicacionesCompletas = estadoPostex.posts.map(p => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: p.mensaje,
    estado: p.estado,
    fecha: p.fecha,
    usuarioId: p.usuarioId,
    likes: p.likes,
    comentarios: p.comentarios
  }));
  
  guardarColeccion(OBJEX_DB.publicaciones, publicacionesCompletas);
}

function obtenerAutor(usuarioId) {
  return estadoPostex.usuarios.find(u => u.id === usuarioId) || null;
}

/* --------- Filtro + búsqueda --------- */
function obtenerPostsFiltrados() {
  let lista = [...estadoPostex.posts];
  const texto = estadoPostex.filtroTexto.trim().toLowerCase();

  if (texto) {
    lista = lista.filter(p =>
      p.titulo.toLowerCase().includes(texto) ||
      p.mensaje.toLowerCase().includes(texto)
    );
  }

  if (estadoPostex.filtroEstado !== "todos") {
    lista = lista.filter(p => p.estado === estadoPostex.filtroEstado);
  }

  lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return lista;
}

/* --------- Render --------- */
function renderPostex() {
  const lista = obtenerPostsFiltrados();
  const totalPaginas = Math.max(1, Math.ceil(lista.length / estadoPostex.porPagina));
  estadoPostex.paginaActual = Math.min(estadoPostex.paginaActual, totalPaginas);

  renderTarjetasPostex(lista);
  renderPaginacionPostex(lista.length);
}

function renderTarjetasPostex(lista) {
  const contenedor = document.getElementById("contenedor-anuncios");
  if (!contenedor) return;

  if (!lista.length) {
    mostrarSinResultados("contenedor-anuncios", "No hay anuncios que coincidan con tu búsqueda.");
    return;
  }

  const inicio = (estadoPostex.paginaActual - 1) * estadoPostex.porPagina;
  const pagina = lista.slice(inicio, inicio + estadoPostex.porPagina);

  contenedor.innerHTML = pagina.map(p => {
    const autor = obtenerAutor(p.usuarioId);
    const sesion = obtenerSesion();
    const likesUsuario = sesion ? obtenerLikesDeUsuario(sesion.id) : [];
    const yaLikeado = likesUsuario.includes(p.id);

    let avatar = "../../src/icons/usuario.png";
    if (autor && autor.avatar) {
      if (autor.avatar.startsWith("src/")) {
        avatar = "../../" + autor.avatar;
      } else if (autor.avatar.startsWith("../../")) {
        avatar = autor.avatar;
      } else {
        avatar = "../../src/icons/usuario.png";
      }
    }

    const nombreAutor = autor ? `${autor.nombres} ${autor.apellidos}` : "Usuario ESPE";
    const claseLike = yaLikeado ? "fa-solid fa-heart text-danger" : "fa-regular fa-heart";

    return `
      <section class="card-post" data-id="${p.id}">
        <div class="post-encabezado">
          <img src="${avatar}" onerror="this.src='../../src/icons/usuario.png'" alt="Avatar">
          <label>${p.titulo}</label>
          <label class="nombre">${nombreAutor.toUpperCase()}</label>
          <label class="fecha">${formatearFechaRelativa(p.fecha)}</label>
          <a class="eliminar-post" data-id="${p.id}" title="Eliminar anuncio"><i class="fa-solid fa-trash"></i></a>
        </div>
        <div class="post-info">
          <p>${p.mensaje}</p>
        </div>
        <div class="post-pie">
          <div>
            <i class="${claseLike} me-like" data-id="${p.id}" style="${yaLikeado ? "color:#dc3545;" : ""}"></i>
            <span class="contador-likes">${p.likes}</span>
          </div>
          <div>
            <i class="fa-solid fa-comment me-comentar" data-id="${p.id}"></i>
            <span class="contador-comentarios">${p.comentarios.length}</span>
          </div>
        </div>
      </section>`;
  }).join("");

  contenedor.querySelectorAll(".me-like").forEach(icono => {
    icono.addEventListener("click", () => manejarLike(Number(icono.dataset.id)));
  });

  contenedor.querySelectorAll(".me-comentar").forEach(icono => {
    icono.addEventListener("click", () => manejarComentario(Number(icono.dataset.id)));
  });

  contenedor.querySelectorAll(".eliminar-post").forEach(enlace => {
    enlace.addEventListener("click", (e) => {
      e.preventDefault();
      manejarEliminarPost(Number(enlace.dataset.id));
    });
  });
}

function renderPaginacionPostex(totalResultados) {
  const contenedor = document.getElementById("paginas");
  if (!contenedor) return;

  const totalPaginas = Math.max(1, Math.ceil(totalResultados / estadoPostex.porPagina));
  let html = `<a href="#" data-pagina="prev">&lt;</a>`;

  for (let i = 1; i <= totalPaginas; i++) {
    html += `<a href="#" data-pagina="${i}" style="${i === estadoPostex.paginaActual ? "text-decoration: underline;" : ""}">${i}</a>`;
  }

  html += `<a href="#" data-pagina="next">&gt;</a>`;
  contenedor.innerHTML = html;

  contenedor.querySelectorAll("a").forEach(enlace => {
    enlace.addEventListener("click", (e) => {
      e.preventDefault();
      const valor = enlace.dataset.pagina;

      if (valor === "prev") estadoPostex.paginaActual = Math.max(1, estadoPostex.paginaActual - 1);
      else if (valor === "next") estadoPostex.paginaActual = Math.min(totalPaginas, estadoPostex.paginaActual + 1);
      else estadoPostex.paginaActual = Number(valor);

      renderPostex();
    });
  });
}

/* --------- Like --------- */
function manejarLike(id) {
  const sesion = obtenerSesion();
  if (!sesion) {
    mostrarError("Debes iniciar sesión para dar like a un anuncio.");
    return;
  }

  const post = estadoPostex.posts.find(p => p.id === id);
  if (!post) return;

  const resultado = registrarLikeUsuario(sesion.id, id);
  if (!resultado.ok) {
    if (resultado.motivo === "ya_likeado") {
      mostrarError("Ya has dado like a este anuncio.");
    } else {
      mostrarError("No se pudo registrar el like. Intenta nuevamente.");
    }
    return;
  }

  post.likes += 1;
  guardarFeedPostex();
  renderPostex();
}

/* --------- Comentar --------- */
async function manejarComentario(id) {
  const post = estadoPostex.posts.find(p => p.id === id);
  if (!post) return;

  const { value: texto } = await Swal.fire({
    title: "Agregar comentario",
    input: "text",
    inputPlaceholder: "Escribe tu comentario...",
    showCancelButton: true,
    confirmButtonText: "Comentar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#003b27"
  });

  if (!texto || !texto.trim()) return;

  post.comentarios.push(texto.trim());
  guardarFeedPostex();
  notificar("Comentario agregado.", "exito");
  renderPostex();
}

/* --------- Eliminar post --------- */
async function manejarEliminarPost(id) {
  const confirmado = await confirmar("¿Eliminar este anuncio?", "Esta acción no se puede deshacer.", "Sí, eliminar");
  if (!confirmado) return;

  estadoPostex.posts = estadoPostex.posts.filter(p => p.id !== id);
  guardarFeedPostex();
  notificar("Anuncio eliminado.", "exito");
  renderPostex();
}

/* --------- Nuevo post --------- */
function manejarNuevoPost() {
  const form = document.getElementById("form-nuevo-post");
  if (!form) return;

  const titulo = form.titulo.value.trim();
  const mensaje = form.mensaje.value.trim();

  if (!titulo || !mensaje) {
    mostrarError("Completa el título y el mensaje antes de publicar.");
    return;
  }

  const sesion = obtenerSesion();

  const nuevoPost = {
    id: estadoPostex.posts.length ? Math.max(...estadoPostex.posts.map(p => p.id)) + 1 : 1,
    titulo,
    mensaje,
    estado: "perdido",
    fecha: new Date().toISOString().split("T")[0],
    usuarioId: sesion ? sesion.id : 1,
    likes: 0,
    comentarios: []
  };

  estadoPostex.posts.unshift(nuevoPost);
  guardarFeedPostex();
  notificar("Anuncio publicado.", "exito");

  form.reset();
  const modalElemento = document.getElementById("modalNuevoPost");
  if (modalElemento) {
    const modal = bootstrap.Modal.getInstance(modalElemento);
    if (modal) {
      modal.hide();
    }
  }

  estadoPostex.paginaActual = 1;
  renderPostex();
}

/* --------- Eventos --------- */
function enlazarEventosPostex() {
  const formBusqueda = document.getElementById("form-buscar-post");
  const buscar = document.getElementById("buscarPost");
  const filtro = document.getElementById("filtroPost");
  const formNuevo = document.getElementById("form-nuevo-post");

  if (formBusqueda) {
    formBusqueda.addEventListener("submit", (e) => e.preventDefault());
  }

  if (buscar) {
    buscar.addEventListener("input", debounce((e) => {
      estadoPostex.filtroTexto = e.target.value;
      estadoPostex.paginaActual = 1;
      renderPostex();
    }, 300));
  }

  if (filtro) {
    filtro.addEventListener("change", (e) => {
      estadoPostex.filtroEstado = e.target.value;
      estadoPostex.paginaActual = 1;
      renderPostex();
    });
  }

  if (formNuevo) {
    formNuevo.addEventListener("submit", (e) => {
      e.preventDefault();
      manejarNuevoPost();
    });
  }
}