// ── CARGAR DATOS GUARDADOS O USAR DATOS INICIALES ────────────
function cargarDatos() {
    const productosGuardados = localStorage.getItem("ip_productos");
    const ventasGuardadas    = localStorage.getItem("ip_ventas");
    const creditosGuardados  = localStorage.getItem("ip_creditos");

    productos = productosGuardados ? JSON.parse(productosGuardados) : [
        { id:"P001", nombre:"Cuaderno universitario", categoria:"Papelería",
          precioCompra:3500, precioVenta:6000, stock:45, tipo:"normal" },
        { id:"P002", nombre:"Esfero azul", categoria:"Papelería",
          precioCompra:800, precioVenta:1500, stock:90, tipo:"normal" },
        { id:"P003", nombre:"Mochila escolar", categoria:"Accesorios",
          precioCompra:25000, precioVenta:45000, stock:3, tipo:"normal" },
    ];

    ventas   = ventasGuardadas   ? JSON.parse(ventasGuardadas)   : [];
    creditos = creditosGuardados ? JSON.parse(creditosGuardados) : [];
    contadorProductos = productos.length + 1;
    contadorVentas    = ventas.length + 1;
    contadorCreditos  = creditos.length + 1;
}

function guardarDatos() {
    localStorage.setItem("ip_productos", JSON.stringify(productos));
    localStorage.setItem("ip_ventas",    JSON.stringify(ventas));
    localStorage.setItem("ip_creditos",  JSON.stringify(creditos));
}

// ── VARIABLES GLOBALES ───────────────────────────────────────
let productos = [];
let ventas    = [];
let creditos  = [];
let contadorProductos = 1;
let contadorVentas    = 1;
let contadorCreditos  = 1;

// ── UTILIDADES ───────────────────────────────────────────────
function formatearPeso(valor) {
    return "$" + valor.toLocaleString("es-CO");
}

function obtenerEstadoBadge(stock) {
    if (stock === 0) return '<span class="card-badge badge-red">Agotado</span>';
    if (stock <= 5)  return '<span class="card-badge badge-amber">Stock bajo</span>';
    return '<span class="card-badge badge-green">Disponible</span>';
}

function obtenerIniciales(nombre) {
    return nombre.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function mostrarFecha() {
    const el = document.getElementById("fecha");
    if (!el) return;
    const opciones = { weekday:"long", year:"numeric", month:"long", day:"numeric" };
    el.textContent = new Date().toLocaleDateString("es-CO", opciones);
}

// ── CARGAR TABLA DE PRODUCTOS ────────────────────────────────
function cargarTablaProductos(lista = productos) {
    const tbody = document.getElementById("cuerpoTabla");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9"
            style="text-align:center;color:#888;padding:30px;">
            No hay productos registrados.</td></tr>`;
        return;
    }
    lista.forEach(p => {
        const ganancia  = p.precioVenta - p.precioCompra;
        const iniciales = obtenerIniciales(p.nombre);
        const tipo      = p.tipo === "perecedero" ? "🥛 Perecedero"
                        : p.tipo === "digital"    ? "💻 Digital"
                        : "📦 Normal";
        tbody.innerHTML += `
            <tr>
                <td style="color:#888;">${p.id}</td>
                <td><span class="prod-avatar">${iniciales}</span>${p.nombre}</td>
                <td>${tipo}</td>
                <td style="color:#888;">${p.categoria}</td>
                <td>${p.stock} uds</td>
                <td>${formatearPeso(p.precioCompra)}</td>
                <td>${formatearPeso(p.precioVenta)}</td>
                <td style="color:#3b6d11;">${formatearPeso(ganancia)}</td>
                <td>${obtenerEstadoBadge(p.stock)}</td>
            </tr>`;
    });
}

// ── FILTRAR TABLA ────────────────────────────────────────────
function filtrarTabla(texto) {
    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
        p.categoria.toLowerCase().includes(texto.toLowerCase()) ||
        p.id.toLowerCase().includes(texto.toLowerCase())
    );
    cargarTablaProductos(filtrados);
}

// ── AGREGAR PRODUCTO ─────────────────────────────────────────
function agregarProducto() {
    const nombre    = document.getElementById("inp-nombre").value.trim();
    const categoria = document.getElementById("inp-categoria").value.trim();
    const tipo      = document.getElementById("inp-tipo").value;
    const pCompra   = parseFloat(document.getElementById("inp-compra").value);
    const pVenta    = parseFloat(document.getElementById("inp-venta").value);
    const stock     = parseInt(document.getElementById("inp-stock").value);

    if (!nombre || !categoria || isNaN(pCompra) || isNaN(pVenta) || isNaN(stock)) {
        mostrarAlerta("alerta-producto", "❌ Por favor completa todos los campos.", "error");
        return;
    }
    if (pCompra < 0 || pVenta < 0 || stock < 0) {
        mostrarAlerta("alerta-producto", "❌ Los valores no pueden ser negativos.", "error");
        return;
    }

    const nuevo = {
        id: "P" + String(contadorProductos).padStart(3, "0"),
        nombre, categoria, tipo,
        precioCompra: pCompra,
        precioVenta:  pVenta,
        stock
    };

    productos.push(nuevo);
    contadorProductos++;
    guardarDatos();
    cargarTablaProductos();
    limpiarFormulario(["inp-nombre","inp-compra","inp-venta","inp-stock"]);
    document.getElementById("inp-categoria").selectedIndex = 0;
    document.getElementById("inp-tipo").selectedIndex = 0;
    document.getElementById("preview-ganancia").style.display = "none";
    mostrarAlerta("alerta-producto",
        `✅ Producto "${nombre}" agregado exitosamente.`, "success");
}

// ── REGISTRAR VENTA ──────────────────────────────────────────
function registrarVenta() {
    const idProducto = document.getElementById("venta-producto").value;
    const cantidad   = parseInt(document.getElementById("venta-cantidad").value);
    const cliente    = document.getElementById("venta-cliente").value.trim();
    const esCredito  = document.getElementById("venta-credito").checked;
    const producto   = productos.find(p => p.id === idProducto);

    if (!producto || isNaN(cantidad) || !cliente) {
        mostrarAlerta("alerta-venta", "❌ Completa todos los campos.", "error");
        return;
    }
    if (cantidad <= 0) {
        mostrarAlerta("alerta-venta", "❌ La cantidad debe ser mayor a cero.", "error");
        return;
    }
    if (cantidad > producto.stock) {
        mostrarAlerta("alerta-venta",
            `❌ Stock insuficiente. Stock actual: ${producto.stock} uds.`, "error");
        return;
    }

    producto.stock -= cantidad;
    const total    = producto.precioVenta * cantidad;
    const ganancia = (producto.precioVenta - producto.precioCompra) * cantidad;
    const idVenta  = "V" + String(contadorVentas).padStart(3, "0");

    const venta = { id:idVenta, producto:producto.nombre, idProducto,
                    cliente, cantidad, total, ganancia, esCredito,
                    fecha: new Date().toLocaleDateString("es-CO") };
    ventas.push(venta);
    contadorVentas++;

    if (esCredito) {
        const idCredito = "C" + String(contadorCreditos).padStart(3, "0");
        creditos.push({ id:idCredito, cliente, producto:producto.nombre,
                        total, pagado:0, estado:"PENDIENTE" });
        contadorCreditos++;
    }

    guardarDatos();
    cargarTablaVentas();
    cargarSelectProductos();
    limpiarFormulario(["venta-cantidad","venta-cliente"]);
    mostrarAlerta("alerta-venta",
        `✅ Venta ${idVenta} registrada. Total: ${formatearPeso(total)}`, "success");
}

// ── CARGAR TABLA DE VENTAS ───────────────────────────────────
function cargarTablaVentas() {
    const tbody = document.getElementById("cuerpo-ventas");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (ventas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"
            style="text-align:center;color:#888;padding:30px;">
            No hay ventas registradas.</td></tr>`;
        return;
    }
    ventas.forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${v.id}</strong></td>
                <td>${v.cliente}</td>
                <td>${v.producto}</td>
                <td>${v.cantidad} uds</td>
                <td>${formatearPeso(v.total)}</td>
                <td style="color:#3b6d11;">${formatearPeso(v.ganancia)}</td>
                <td>${v.esCredito
                    ? '<span class="card-badge badge-amber">Crédito</span>'
                    : '<span class="card-badge badge-green">Contado</span>'}</td>
            </tr>`;
    });
}

// ── CARGAR SELECT DE PRODUCTOS ───────────────────────────────
function cargarSelectProductos() {
    const sel = document.getElementById("venta-producto");
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccionar producto --</option>';
    productos.filter(p => p.stock > 0).forEach(p => {
        sel.innerHTML += `<option value="${p.id}">
            ${p.nombre} (Stock: ${p.stock})</option>`;
    });
}

// ── CARGAR TABLA CRÉDITOS ────────────────────────────────────
function cargarTablaCreditos() {
    const tbody = document.getElementById("cuerpo-creditos");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (creditos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"
            style="text-align:center;color:#888;padding:30px;">
            No hay créditos registrados.</td></tr>`;
        return;
    }
    creditos.forEach((c, i) => {
        const pendiente = c.total - c.pagado;
        const badge = c.estado === "PAGADO"
            ? '<span class="card-badge badge-green">PAGADO</span>'
            : '<span class="card-badge badge-amber">PENDIENTE</span>';
        const boton = c.estado !== "PAGADO"
            ? `<button class="btn-primary"
                style="padding:6px 12px;font-size:12px;"
                onclick="abrirFormPago(${i})">💳 Pagar</button>`
            : '<span style="color:#888;font-size:12px;">Completado</span>';
        tbody.innerHTML += `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td>${c.cliente}</td>
                <td>${c.producto}</td>
                <td>${formatearPeso(c.total)}</td>
                <td style="color:#3b6d11;">${formatearPeso(c.pagado)}</td>
                <td style="color:#a32d2d;">${formatearPeso(pendiente)}</td>
                <td>${badge}</td>
                <td>${boton}</td>
            </tr>`;
    });
}

// ── UTILIDADES UI ────────────────────────────────────────────
function mostrarAlerta(id, mensaje, tipo) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `alert alert-${tipo}`;
    el.textContent = mensaje;
    el.style.display = "block";
    setTimeout(() => el.style.display = "none", 4000);
}

function limpiarFormulario(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// ── INICIALIZAR ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    mostrarFecha();
    cargarTablaProductos();
    cargarTablaVentas();
    cargarSelectProductos();
    cargarTablaCreditos();
});