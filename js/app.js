// ── DATOS DEL SISTEMA ────────────────────────────────────────
let productos = [
    { id: "P001", nombre: "Cuaderno universitario", categoria: "Papelería", precioCompra: 3500, precioVenta: 6000, stock: 45 },
    { id: "P002", nombre: "Esfero azul", categoria: "Papelería", precioCompra: 800, precioVenta: 1500, stock: 90 },
    { id: "P003", nombre: "Mochila escolar", categoria: "Accesorios", precioCompra: 25000, precioVenta: 45000, stock: 3 },
    { id: "P004", nombre: "Televisor 42\"", categoria: "Electrónica", precioCompra: 800000, precioVenta: 1200000, stock: 0 },
    { id: "P005", nombre: "Curso de Excel", categoria: "Digital", precioCompra: 15000, precioVenta: 45000, stock: 100 },
];

let ventas = [];
let creditos = [];
let contadorVentas = 1;
let contadorCreditos = 1;

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
    const hoy = new Date();
    const opciones = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    el.textContent = hoy.toLocaleDateString("es-CO", opciones);
}

// ── CARGAR TABLA DE PRODUCTOS ────────────────────────────────
function cargarTablaProductos(lista = productos) {
    const tbody = document.getElementById("cuerpoTabla");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;padding:30px;">
            No hay productos registrados.</td></tr>`;
        return;
    }

    lista.forEach(p => {
        const ganancia = p.precioVenta - p.precioCompra;
        const iniciales = obtenerIniciales(p.nombre);
        tbody.innerHTML += `
            <tr>
                <td>
                    <span class="prod-avatar">${iniciales}</span>
                    ${p.nombre}
                </td>
                <td style="color:#888;">${p.categoria}</td>
                <td>${p.stock} uds</td>
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
        id: "P" + String(productos.length + 1).padStart(3, "0"),
        nombre, categoria, precioCompra: pCompra, precioVenta: pVenta, stock
    };

    productos.push(nuevo);
    cargarTablaProductos();
    limpiarFormulario(["inp-nombre","inp-categoria","inp-compra","inp-venta","inp-stock"]);
    mostrarAlerta("alerta-producto", `✅ Producto "${nombre}" agregado exitosamente.`, "success");
}

// ── REGISTRAR VENTA ──────────────────────────────────────────
function registrarVenta() {
    const idProducto = document.getElementById("venta-producto").value;
    const cantidad   = parseInt(document.getElementById("venta-cantidad").value);
    const cliente    = document.getElementById("venta-cliente").value.trim();
    const esCredito  = document.getElementById("venta-credito").checked;

    const producto = productos.find(p => p.id === idProducto);

    if (!producto || isNaN(cantidad) || !cliente) {
        mostrarAlerta("alerta-venta", "❌ Completa todos los campos.", "error");
        return;
    }
    if (cantidad <= 0) {
        mostrarAlerta("alerta-venta", "❌ La cantidad debe ser mayor a cero.", "error");
        return;
    }
    if (cantidad > producto.stock) {
        mostrarAlerta("alerta-venta", `❌ Stock insuficiente. Stock actual: ${producto.stock} uds.`, "error");
        return;
    }

    producto.stock -= cantidad;
    const total    = producto.precioVenta * cantidad;
    const ganancia = (producto.precioVenta - producto.precioCompra) * cantidad;
    const idVenta  = "V" + String(contadorVentas).padStart(3, "0");

    const venta = { id: idVenta, producto: producto.nombre, cliente, cantidad, total, ganancia,
                    fecha: new Date().toLocaleDateString("es-CO"), credito: esCredito };
    ventas.push(venta);
    contadorVentas++;

    if (esCredito) {
        const idCredito = "C" + String(contadorCreditos).padStart(3, "0");
        creditos.push({ id: idCredito, cliente, producto: producto.nombre,
                        total, pagado: 0, estado: "PENDIENTE" });
        contadorCreditos++;
    }

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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;padding:30px;">
            No hay ventas registradas.</td></tr>`;
        return;
    }

    ventas.forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${v.id}</strong></td>
                <td>${v.cliente}</td>
                <td>${v.producto}</td>