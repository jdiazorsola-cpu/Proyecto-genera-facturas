/* ═══════════════════════════════════════════════════════
   GENERADOR DE FACTURAS — APP.JS
   100% Client-Side · jsPDF + AutoTable
   ═══════════════════════════════════════════════════════ */

// ─── DATOS DEL EMISOR (editar aquí) ────────────────────
const EMISOR = {
    nombre: "Tu Empresa S.A.",
    rut: "XX.XXX.XXX-X",
    direccion: "Tu dirección comercial",
    email: "contacto@tuempresa.com",
    telefono: "+56 9 XXXX XXXX"
};

// Logo en base64 — se carga dinámicamente desde logo.png
let LOGO_BASE64 = null;

// ─── UTILIDADES ────────────────────────────────────────
function formatearMoneda(n) {
    const num = Math.round(n);
    return "$ " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatearFecha(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return d + "/" + m + "/" + y;
}

function mostrarToast(msg, tipo) {
    const c = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = "toast toast-" + (tipo || "success");
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

// ─── NUMERACIÓN AUTOMÁTICA ─────────────────────────────
function obtenerNumeroFactura() {
    let n = parseInt(localStorage.getItem("factura_counter") || "0", 10);
    n++;
    localStorage.setItem("factura_counter", n.toString());
    return "FAC-" + String(n).padStart(4, "0");
}

function getNumeroActual() {
    return document.getElementById("numero-factura").value;
}

// ─── LOGO ──────────────────────────────────────────────
function cargarLogo() {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d").drawImage(img, 0, 0);
            LOGO_BASE64 = canvas.toDataURL("image/png");
            resolve(LOGO_BASE64);
        };
        img.onerror = function () {
            console.warn("No se pudo cargar logo.png");
            LOGO_BASE64 = null;
            resolve(null);
        };
        img.src = "logo.png?v=" + Date.now();
    });
}

// ─── GESTIÓN DE PRODUCTOS ──────────────────────────────
function crearFilaProducto() {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" placeholder="Nombre del producto" class="prod-nombre" required></td>
        <td><input type="number" value="1" min="1" step="1" class="prod-cantidad"></td>
        <td><input type="number" value="0" min="0" step="0.01" class="prod-precio"></td>
        <td><span class="subtotal-display">$ 0</span></td>
        <td><button type="button" class="btn btn-eliminar" title="Eliminar fila">✕</button></td>
    `;
    // Event listeners para cálculo reactivo
    tr.querySelector(".prod-cantidad").addEventListener("input", () => { calcularSubtotalLinea(tr); actualizarTotales(); });
    tr.querySelector(".prod-precio").addEventListener("input", () => { calcularSubtotalLinea(tr); actualizarTotales(); });
    tr.querySelector(".btn-eliminar").addEventListener("click", () => eliminarFila(tr));
    return tr;
}

function agregarFila() {
    document.getElementById("productos-body").appendChild(crearFilaProducto());
    actualizarBotonesEliminar();
    actualizarTotales();
}

function eliminarFila(tr) {
    const tbody = document.getElementById("productos-body");
    if (tbody.rows.length <= 1) return;
    tr.style.opacity = "0";
    tr.style.transform = "translateX(20px)";
    tr.style.transition = "all 0.25s ease";
    setTimeout(() => { tr.remove(); actualizarBotonesEliminar(); actualizarTotales(); }, 250);
}

function actualizarBotonesEliminar() {
    const filas = document.getElementById("productos-body").rows;
    const soloUna = filas.length <= 1;
    for (let f of filas) {
        f.querySelector(".btn-eliminar").disabled = soloUna;
    }
}

function calcularSubtotalLinea(tr) {
    const cant = parseFloat(tr.querySelector(".prod-cantidad").value) || 0;
    const precio = parseFloat(tr.querySelector(".prod-precio").value) || 0;
    const sub = cant * precio;
    tr.querySelector(".subtotal-display").textContent = formatearMoneda(sub);
    return sub;
}

function actualizarTotales() {
    const filas = document.getElementById("productos-body").rows;
    let subtotal = 0;
    for (let f of filas) subtotal += calcularSubtotalLinea(f);
    const pct = parseFloat(document.getElementById("impuesto-porcentaje").value) || 0;
    const impuesto = subtotal * (pct / 100);
    const total = subtotal + impuesto;
    document.getElementById("display-subtotal").textContent = formatearMoneda(subtotal);
    document.getElementById("display-impuesto").textContent = formatearMoneda(impuesto);
    document.getElementById("display-total").textContent = formatearMoneda(total);
    document.getElementById("display-impuesto-pct").textContent = pct;
}

// ─── VALIDACIÓN ────────────────────────────────────────
function limpiarErrores() {
    document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
    document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");
}

function mostrarError(inputId, errorId, msg) {
    const inp = document.getElementById(inputId);
    if (inp) { inp.classList.add("input-error"); inp.scrollIntoView({ behavior: "smooth", block: "center" }); }
    const err = document.getElementById(errorId);
    if (err) err.textContent = msg;
}

function validarFormulario() {
    limpiarErrores();
    const nombre = document.getElementById("nombre-cliente").value.trim();
    const dir = document.getElementById("direccion-cliente").value.trim();
    const email = document.getElementById("email-cliente").value.trim();
    const fecha = document.getElementById("fecha-factura").value;

    if (!nombre) { mostrarError("nombre-cliente", "error-nombre-cliente", "El nombre es obligatorio"); return false; }
    if (!dir) { mostrarError("direccion-cliente", "error-direccion-cliente", "La dirección es obligatoria"); return false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarError("email-cliente", "error-email-cliente", "Ingrese un email válido"); return false; }
    if (!fecha) { mostrarToast("Seleccione una fecha", "error"); return false; }

    const filas = document.getElementById("productos-body").rows;
    if (filas.length === 0) { document.getElementById("error-productos").textContent = "Agregue al menos un producto"; return false; }
    for (let i = 0; i < filas.length; i++) {
        const n = filas[i].querySelector(".prod-nombre").value.trim();
        const c = parseFloat(filas[i].querySelector(".prod-cantidad").value);
        const p = parseFloat(filas[i].querySelector(".prod-precio").value);
        if (!n) { filas[i].querySelector(".prod-nombre").classList.add("input-error"); document.getElementById("error-productos").textContent = "Producto " + (i+1) + ": nombre vacío"; filas[i].scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
        if (!c || c < 1) { filas[i].querySelector(".prod-cantidad").classList.add("input-error"); document.getElementById("error-productos").textContent = "Producto " + (i+1) + ": cantidad inválida"; return false; }
        if (!p || p <= 0) { filas[i].querySelector(".prod-precio").classList.add("input-error"); document.getElementById("error-productos").textContent = "Producto " + (i+1) + ": precio inválido"; return false; }
    }
    return true;
}

// ─── OBTENER DATOS ─────────────────────────────────────
function obtenerDatosFactura() {
    const filas = document.getElementById("productos-body").rows;
    const productos = [];
    let subtotal = 0;
    for (let f of filas) {
        const nombre = f.querySelector(".prod-nombre").value.trim();
        const cantidad = parseFloat(f.querySelector(".prod-cantidad").value) || 0;
        const precio = parseFloat(f.querySelector(".prod-precio").value) || 0;
        const sub = cantidad * precio;
        subtotal += sub;
        productos.push({ nombre, cantidad, precio, subtotal: sub });
    }
    const pct = parseFloat(document.getElementById("impuesto-porcentaje").value) || 0;
    const impuesto = subtotal * (pct / 100);
    return {
        numero: getNumeroActual(),
        fecha: document.getElementById("fecha-factura").value,
        cliente: {
            nombre: document.getElementById("nombre-cliente").value.trim(),
            direccion: document.getElementById("direccion-cliente").value.trim(),
            email: document.getElementById("email-cliente").value.trim()
        },
        productos,
        subtotal,
        impuestoPct: pct,
        impuesto,
        total: subtotal + impuesto
    };
}

// ─── VISTA PREVIA ──────────────────────────────────────
function mostrarPreview() {
    if (!validarFormulario()) return;
    const d = obtenerDatosFactura();
    const sec = document.getElementById("seccion-preview");
    const cont = document.getElementById("preview-contenido");

    let productosHTML = "";
    d.productos.forEach((p, i) => {
        productosHTML += `<tr>
            <td>${i + 1}</td>
            <td>${p.nombre}</td>
            <td class="text-right">${p.cantidad}</td>
            <td class="text-right">${formatearMoneda(p.precio)}</td>
            <td class="text-right">${formatearMoneda(p.subtotal)}</td>
        </tr>`;
    });

    cont.innerHTML = `
        <div class="preview-header-block">
            <div class="preview-empresa">
                ${LOGO_BASE64 ? `<img src="${LOGO_BASE64}" alt="Logo">` : ""}
                <div>
                    <div class="preview-empresa-nombre">${EMISOR.nombre}</div>
                    <div class="preview-empresa-info">
                        ${EMISOR.rut} · ${EMISOR.telefono}<br>
                        ${EMISOR.email}<br>${EMISOR.direccion}
                    </div>
                </div>
            </div>
            <div class="preview-factura-num">
                <h3>${d.numero}</h3>
                <p>Fecha: ${formatearFecha(d.fecha)}</p>
            </div>
        </div>
        <div class="preview-datos-grid">
            <div class="preview-datos-block">
                <h4>Emisor</h4>
                <p><strong>${EMISOR.nombre}</strong><br>${EMISOR.rut}<br>${EMISOR.direccion}<br>${EMISOR.email}</p>
            </div>
            <div class="preview-datos-block">
                <h4>Cliente</h4>
                <p><strong>${d.cliente.nombre}</strong><br>${d.cliente.direccion}<br>${d.cliente.email}</p>
            </div>
        </div>
        <table class="preview-table">
            <thead><tr><th>#</th><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">P. Unit.</th><th class="text-right">Total</th></tr></thead>
            <tbody>${productosHTML}</tbody>
        </table>
        <div class="preview-totales">
            <div class="pv-row"><span>Subtotal</span><span>${formatearMoneda(d.subtotal)}</span></div>
            <div class="pv-row"><span>Impuesto (${d.impuestoPct}%)</span><span>${formatearMoneda(d.impuesto)}</span></div>
            <div class="pv-row pv-final"><span>TOTAL</span><span>${formatearMoneda(d.total)}</span></div>
        </div>`;

    sec.style.display = "block";
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
    mostrarToast("Vista previa generada", "success");
}

// ─── GENERACIÓN PDF ────────────────────────────────────
async function generarPDF() {
    if (!validarFormulario()) return;

    const btnText = document.querySelector("#btn-generar-pdf .btn-text");
    const btnLoad = document.querySelector("#btn-generar-pdf .btn-loading");
    const btnIcon = document.querySelector("#btn-generar-pdf .btn-icon");
    btnText.style.display = "none";
    btnIcon.style.display = "none";
    btnLoad.style.display = "inline-flex";

    try {
        await cargarLogo();
        const d = obtenerDatosFactura();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentW = pageW - margin * 2;
        let y = margin;

        // — Header con logo —
        const headerColor = [44, 62, 80];
        doc.setFillColor(...headerColor);
        doc.rect(0, 0, pageW, 42, "F");

        if (LOGO_BASE64) {
            try { doc.addImage(LOGO_BASE64, "PNG", margin, 6, 30, 30); } catch (e) { console.warn("Logo error:", e); }
        }

        const textX = LOGO_BASE64 ? margin + 36 : margin;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(EMISOR.nombre, textX, 16);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${EMISOR.rut}  |  ${EMISOR.telefono}  |  ${EMISOR.email}`, textX, 23);
        doc.text(EMISOR.direccion, textX, 29);

        y = 50;

        // — Factura N° y Fecha —
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
        doc.setTextColor(...headerColor);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`FACTURA N°: ${d.numero}`, margin + 6, y + 9);
        doc.setFont("helvetica", "normal");
        doc.text(`FECHA: ${formatearFecha(d.fecha)}`, pageW - margin - 6, y + 9, { align: "right" });

        y += 22;

        // — Datos Emisor / Cliente —
        const halfW = contentW / 2 - 4;

        doc.setFillColor(44, 62, 80);
        doc.roundedRect(margin, y, halfW, 7, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("DATOS EMISOR", margin + 4, y + 5);

        doc.roundedRect(margin + halfW + 8, y, halfW, 7, 1, 1, "F");
        doc.text("DATOS CLIENTE", margin + halfW + 12, y + 5);

        y += 11;
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        doc.text(EMISOR.nombre, margin + 4, y);
        doc.text(EMISOR.rut, margin + 4, y + 5);
        doc.text(EMISOR.direccion, margin + 4, y + 10);
        doc.text(EMISOR.email, margin + 4, y + 15);

        doc.text(d.cliente.nombre, margin + halfW + 12, y);
        doc.text(d.cliente.direccion, margin + halfW + 12, y + 5);
        doc.text(d.cliente.email, margin + halfW + 12, y + 10);

        y += 24;

        // — Tabla de productos —
        const tableBody = d.productos.map((p, i) => [
            i + 1,
            p.nombre,
            p.cantidad,
            formatearMoneda(p.precio),
            formatearMoneda(p.subtotal)
        ]);

        doc.autoTable({
            startY: y,
            head: [["#", "Producto / Servicio", "Cant.", "P. Unitario", "Total"]],
            body: tableBody,
            margin: { left: margin, right: margin },
            styles: { font: "helvetica", fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            columnStyles: {
                0: { cellWidth: 12, halign: "center" },
                2: { cellWidth: 18, halign: "center" },
                3: { cellWidth: 32, halign: "right" },
                4: { cellWidth: 32, halign: "right" }
            }
        });

        y = doc.lastAutoTable.finalY + 10;

        // — Totales —
        const totX = pageW - margin - 75;
        const totW = 75;

        doc.setFillColor(248, 249, 250);
        doc.roundedRect(totX, y, totW, 10, 1, 1, "F");
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text("Subtotal:", totX + 4, y + 7);
        doc.setTextColor(44, 62, 80);
        doc.text(formatearMoneda(d.subtotal), totX + totW - 4, y + 7, { align: "right" });

        y += 12;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(totX, y, totW, 10, 1, 1, "F");
        doc.setTextColor(100, 100, 100);
        doc.text(`IVA (${d.impuestoPct}%):`, totX + 4, y + 7);
        doc.setTextColor(44, 62, 80);
        doc.text(formatearMoneda(d.impuesto), totX + totW - 4, y + 7, { align: "right" });

        y += 13;
        doc.setFillColor(...headerColor);
        doc.roundedRect(totX, y, totW, 13, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL:", totX + 4, y + 9);
        doc.text(formatearMoneda(d.total), totX + totW - 4, y + 9, { align: "right" });

        // — Pie de página —
        const pageH = doc.internal.pageSize.getHeight();
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`Generado el ${formatearFecha(new Date().toISOString().split("T")[0])}`, margin, pageH - 8);
        doc.text("1/1", pageW - margin, pageH - 8, { align: "right" });

        // — Descargar —
        const clienteName = d.cliente.nombre.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
        const fileName = `Factura_${d.numero}_${clienteName}_${d.fecha}.pdf`;
        doc.save(fileName);
        mostrarToast("PDF descargado: " + fileName, "success");

    } catch (err) {
        console.error(err);
        mostrarToast("Error al generar PDF: " + err.message, "error");
    } finally {
        btnText.style.display = "inline";
        btnIcon.style.display = "inline";
        btnLoad.style.display = "none";
    }
}

// ─── LIMPIAR FORMULARIO ────────────────────────────────
function limpiarFormulario() {
    if (!confirm("¿Está seguro de limpiar el formulario?")) return;
    document.getElementById("nombre-cliente").value = "";
    document.getElementById("direccion-cliente").value = "";
    document.getElementById("email-cliente").value = "";
    document.getElementById("fecha-factura").valueAsDate = new Date();
    document.getElementById("numero-factura").value = obtenerNumeroFactura();
    document.getElementById("impuesto-porcentaje").value = "19";
    const tbody = document.getElementById("productos-body");
    tbody.innerHTML = "";
    tbody.appendChild(crearFilaProducto());
    actualizarBotonesEliminar();
    actualizarTotales();
    limpiarErrores();
    document.getElementById("seccion-preview").style.display = "none";
    mostrarToast("Formulario limpiado", "warning");
}

// ─── INICIALIZACIÓN ────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    // Fecha de hoy
    document.getElementById("fecha-factura").valueAsDate = new Date();
    // Número de factura
    document.getElementById("numero-factura").value = obtenerNumeroFactura();
    // Primera fila de producto
    agregarFila();
    // Cargar logo
    await cargarLogo();
    // Listeners de impuesto
    document.getElementById("impuesto-porcentaje").addEventListener("input", actualizarTotales);
    // Botones
    document.getElementById("btn-agregar-producto").addEventListener("click", agregarFila);
    document.getElementById("btn-preview").addEventListener("click", mostrarPreview);
    document.getElementById("btn-generar-pdf").addEventListener("click", generarPDF);
    document.getElementById("btn-limpiar").addEventListener("click", limpiarFormulario);
    document.getElementById("btn-cerrar-preview").addEventListener("click", () => {
        document.getElementById("seccion-preview").style.display = "none";
    });
});