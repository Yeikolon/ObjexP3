/* ============================================================
   perfil.js
   Página: pages/perfil/perfil.html
   Depende de: storage.js, utils.js
   ============================================================ */

document.addEventListener("DOMContentLoaded", function() {
    const sesion = obtenerSesion();
    
    if (!sesion) {
        // Si no hay sesión, redirigir al login
        window.location.href = "../../index.html";
        return;
    }

    // Actualizar avatar
    const avatarImg = document.getElementById("avatar-perfil");
    if (avatarImg && sesion.avatar) {
        avatarImg.src = "../../" + sesion.avatar;
        avatarImg.alt = sesion.nombres;
    }

    // Actualizar nombre
    const nombreSpan = document.getElementById("nombre-perfil");
    if (nombreSpan) {
        nombreSpan.textContent = sesion.nombres + " " + sesion.apellidos;
    }

    // Actualizar correo (si existe el elemento)
    const correoElemento = document.querySelector(".card-perfil p:nth-of-type(2)");
    if (correoElemento && sesion.correo) {
        correoElemento.innerHTML = "<strong>Correo:</strong>" + sesion.correo;
    }

    // Actualizar barra de confiabilidad
    const meter = document.querySelector(".meter-objex");
    const spanConfiabilidad = meter ? meter.parentElement.querySelector("span") : null;
    if (meter && sesion.confiabilidad !== undefined) {
        meter.value = sesion.confiabilidad;
        if (spanConfiabilidad) {
            spanConfiabilidad.textContent = sesion.confiabilidad + "%";
        }
    }

    // Actualizar nombre en el navbar
    const nombreUsuario = document.querySelector(".nombre-usuario");
    if (nombreUsuario && sesion.nombres && sesion.apellidos) {
        nombreUsuario.textContent = sesion.nombres + " " + sesion.apellidos;
    }

    // Cargar publicaciones del usuario en la tabla
    cargarPublicacionesUsuario(sesion.id);
});

async function cargarPublicacionesUsuario(usuarioId) {
    try {
        const publicaciones = await cargarColeccion("../../json/publicaciones.json", OBJEX_DB.publicaciones);
        const misPublicaciones = publicaciones.filter(p => p.usuarioId === usuarioId);

        const tabla = document.getElementById("publicados");
        if (!tabla) return;

        // Verificar si ya tiene body, si no, crearlo
        let tbody = tabla.querySelector("tbody");
        if (!tbody) {
            tbody = document.createElement("tbody");
            // Mover las filas existentes al tbody
            const filas = tabla.querySelectorAll("tr");
            if (filas.length > 1) {
                for (let i = 1; i < filas.length; i++) {
                    tbody.appendChild(filas[i].cloneNode(true));
                }
                // Limpiar filas originales (excepto el encabezado)
                for (let i = filas.length - 1; i >= 1; i--) {
                    filas[i].remove();
                }
            }
            tabla.appendChild(tbody);
        }

        // Limpiar tbody
        tbody.innerHTML = "";

        if (misPublicaciones.length === 0) {
            const fila = document.createElement("tr");
            fila.innerHTML = `<td colspan="6" style="text-align:center; padding:20px;">No has publicado ningún objeto aún.</td>`;
            tbody.appendChild(fila);
            return;
        }

        // Obtener ubicaciones para mostrar nombres
        const ubicaciones = await cargarColeccion("../../json/ubicaciones.json", OBJEX_DB.ubicaciones);

        misPublicaciones.forEach(p => {
            const ubicacion = ubicaciones.find(u => u.id === p.ubicacionId);
            const nombreUbicacion = ubicacion ? ubicacion.nombre : "N/D";
            const estadoTexto = p.estado === "perdido" ? "Perdido" : "Encontrado";

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><img src="../../${p.imagen}" class="img-publicado" onerror="this.src='../../src/icons/usuario.png'"></td>
                <td>${p.titulo}</td>
                <td>${estadoTexto}</td>
                <td>${formatearFechaRelativa(p.fecha)}</td>
                <td>${nombreUbicacion}</td>
                <td>
                    <button class="eliminar" data-id="${p.id}">Eliminar</button>
                    <br><br>
                    <button class="editar" data-id="${p.id}">Editar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        // Agregar eventos a los botones de eliminar
        document.querySelectorAll("#publicados .eliminar").forEach(btn => {
            btn.addEventListener("click", async function() {
                const id = parseInt(this.dataset.id);
                const confirmado = await confirmar("¿Eliminar publicación?", "Esta acción no se puede deshacer.");
                if (confirmado) {
                    const publicacionesActualizadas = publicaciones.filter(p => p.id !== id);
                    guardarColeccion(OBJEX_DB.publicaciones, publicacionesActualizadas);
                    notificar("Publicación eliminada.", "exito");
                    cargarPublicacionesUsuario(usuarioId);
                }
            });
        });

        // Agregar eventos a los botones de editar
        document.querySelectorAll("#publicados .editar").forEach(btn => {
            btn.addEventListener("click", function() {
                const id = parseInt(this.dataset.id);
                window.location.href = "../publicaciones/editar.html?id=" + id;
            });
        });

    } catch (error) {
        console.error("Error al cargar publicaciones del usuario:", error);
    }
}