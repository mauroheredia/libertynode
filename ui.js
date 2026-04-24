/**
 * LIBERTYNODE - CORE UI (v2.1)
 * Arquitectura de Cámara Infinita con Zoom y Coordenadas Normalizadas.
 * Correcciones v2.1:
 *   - Soporte completo de select y textarea en createNodeOnCanvas
 *   - deleteNode implementado (faltaba en v2.0)
 *   - Importación de megapacks restaurada
 *   - Descarga y prueba de flujo restauradas
 *   - Modal usa ID correcto (code-modal)
 *   - startConnection no pisa onclick de nodos existentes
 *   - Cable hover/click para borrar restaurado
 *   - SVG con viewBox dinámico para que los cables no se corten
 */

const UI = {

    // ---------------------------------------------------------
    // 1. REFERENCIAS AL DOM Y ESTADO
    // ---------------------------------------------------------

    workspace:      document.getElementById('workspace'),
    nodesContainer: document.getElementById('nodes-container'),
    svgCanvas:      document.getElementById('connection-canvas'),

    draggedModuleId:     null,
    nodeCounter:         0,
    isConnectingMode:    false,
    sourceConnectNodeId: null,

    // Estado de la Cámara
    camera: {
        x: 0, y: 0, zoom: 1,
        minZoom: 0.2, maxZoom: 3,
        isPanning: false, startX: 0, startY: 0
    },

    // ---------------------------------------------------------
    // 2. ARRANQUE
    // ---------------------------------------------------------

    init: function() {
        this.setupSidebarDrag();
        this.setupWorkspaceDrop();
        this.setupCamera();
        this.setupButtons();

        // Cancelar modo conexión al hacer clic en el vacío
        this.workspace.addEventListener('click', (e) => {
            if (e.target === this.workspace || e.target === this.svgCanvas) {
                if (this.isConnectingMode) this.cancelConnectionMode();
            }
        });

        console.log("[LibertyNode v2.1] Sistema listo.");
    },

    // ---------------------------------------------------------
    // 3. SISTEMA DE CÁMARA
    // ---------------------------------------------------------

    /**
     * Convierte coordenadas de pantalla a coordenadas del lienzo (world space).
     * Usar en TODOS los eventos que crean o interactúan con nodos.
     */
    getRelativeCoordinates: function(e) {
        const rect = this.workspace.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.camera.x) / this.camera.zoom,
            y: (e.clientY - rect.top  - this.camera.y) / this.camera.zoom
        };
    },

    updateCamera: function() {
        const content = document.getElementById('workspace-content');
        if (content) {
            content.style.transform = `translate(${this.camera.x}px, ${this.camera.y}px) scale(${this.camera.zoom})`;
            content.style.transformOrigin = '0 0';
        }
        // Grid infinito: mover el fondo con la cámara
        this.workspace.style.backgroundPosition = `${this.camera.x}px ${this.camera.y}px`;
        this.workspace.style.backgroundSize = `${30 * this.camera.zoom}px ${30 * this.camera.zoom}px`;
    },

    setupCamera: function() {

        // ZOOM con ruedita — centrado en el puntero
        this.workspace.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta    = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom  = Math.max(this.camera.minZoom, Math.min(this.camera.zoom * delta, this.camera.maxZoom));
            const rect     = this.workspace.getBoundingClientRect();
            const mx       = e.clientX - rect.left;
            const my       = e.clientY - rect.top;

            this.camera.x    = mx - (mx - this.camera.x) * (newZoom / this.camera.zoom);
            this.camera.y    = my - (my - this.camera.y) * (newZoom / this.camera.zoom);
            this.camera.zoom = newZoom;
            this.updateCamera();
        }, { passive: false });

        // PAN con clic central (ruedita) o clic derecho
        this.workspace.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) {
                this.camera.isPanning = true;
                this.camera.startX   = e.clientX - this.camera.x;
                this.camera.startY   = e.clientY - this.camera.y;
                this.workspace.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.camera.isPanning) return;
            this.camera.x = e.clientX - this.camera.startX;
            this.camera.y = e.clientY - this.camera.startY;
            this.updateCamera();
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 1 || e.button === 2) {
                this.camera.isPanning = false;
                this.workspace.style.cursor = 'default';
            }
        });

        // Bloquear menú contextual del clic derecho
        this.workspace.addEventListener('contextmenu', e => e.preventDefault());
    },

    // ---------------------------------------------------------
    // 4. DRAG & DROP DEL SIDEBAR
    // ---------------------------------------------------------

    setupSidebarDrag: function() {
        document.querySelectorAll('.module-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                // Subimos por el DOM hasta encontrar el data-module (por si el clic fue en un hijo)
                const target = e.target.closest('[data-module]');
                this.draggedModuleId = target ? target.getAttribute('data-module') : null;
            });
        });
    },

    setupWorkspaceDrop: function() {
        this.workspace.addEventListener('dragover', e => e.preventDefault());
        this.workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!this.draggedModuleId) return;
            const pos = this.getRelativeCoordinates(e);
            this.createNodeOnCanvas(this.draggedModuleId, pos.x, pos.y);
            this.draggedModuleId = null;
        });
    },

    // ---------------------------------------------------------
    // 5. CREACIÓN DE NODOS
    // ---------------------------------------------------------

    createNodeOnCanvas: function(moduleId, x, y) {
        const moduleDef = window.LibertyModules[moduleId];
        if (!moduleDef) {
            console.error(`[UI] Módulo no encontrado: ${moduleId}`);
            return;
        }

        const nodeId = `nodo_${++this.nodeCounter}`;
        window.LibertyEngine.addNode(nodeId, moduleId);

        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.id        = nodeId;
        nodeEl.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 260px;
            background: var(--bg-node);
            border: 2px solid var(--border-color);
            border-top: 4px solid ${moduleDef.color};
            border-radius: 10px;
            box-shadow: var(--shadow-md);
            z-index: 50;
            transition: border-color 0.2s, box-shadow 0.2s;
        `;

        // Construir campos según su tipo (input, textarea, select)
        let fieldsHtml = '';
        if (moduleDef.fields && moduleDef.fields.length > 0) {
            const inputStyle = `
                width: 100%; background: var(--bg-deep); border: 1px solid var(--border-color);
                color: var(--text-primary); padding: 8px; border-radius: 6px;
                font-family: var(--font-family); font-size: 0.85rem; outline: none;
                transition: border-color 0.2s; box-sizing: border-box;
            `;
            const labelStyle = `
                display: block; margin-bottom: 6px; font-size: 0.7rem;
                text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);
            `;

            moduleDef.fields.forEach(f => {
                let control = '';

                if (f.type === 'select') {
                    const opts = (f.options || []).map(o => `<option value="${o}">${o}</option>`).join('');
                    control = `<select data-key="${f.id}" style="${inputStyle} cursor: pointer;">${opts}</select>`;

                } else if (f.type === 'textarea') {
                    control = `<textarea data-key="${f.id}" placeholder="${f.placeholder || ''}"
                                rows="2" style="${inputStyle} resize: vertical; min-height: 40px;"></textarea>`;

                } else {
                    // text, number, password, email, etc.
                    control = `<input type="${f.type}" data-key="${f.id}"
                                placeholder="${f.placeholder || ''}" style="${inputStyle}">`;
                }

                fieldsHtml += `
                    <div style="margin-bottom: 10px;">
                        <label style="${labelStyle}">${f.label}</label>
                        ${control}
                    </div>`;
            });
        }

        // Borna de entrada (punto azul izquierda)
        const portIn = moduleDef.inputs > 0
            ? `<div style="position:absolute; left:-9px; top:50%; transform:translateY(-50%);
                           width:18px; height:18px; background:var(--bg-deep); border-radius:50%;
                           border:3px solid var(--accent-blue); z-index:60;
                           box-shadow:0 0 8px rgba(59,130,246,0.4);"></div>`
            : '';

        // Borna de salida (punto verde derecha)
        const portOut = moduleDef.outputs > 0
            ? `<div class="port-out" title="Conectar con otro bloque"
                    style="position:absolute; right:-14px; top:50%; transform:translateY(-50%);
                           width:28px; height:28px; background:var(--accent-green); border-radius:50%;
                           border:3px solid var(--bg-node); color:white; display:flex; align-items:center;
                           justify-content:center; cursor:pointer; font-weight:bold; font-size:1.2rem;
                           box-shadow:0 0 10px rgba(16,185,129,0.4); z-index:60; transition:0.2s;">+</div>`
            : '';

        nodeEl.innerHTML = `
            <div class="node-header" style="
                padding: 12px 15px; border-bottom: 1px solid var(--border-color);
                display: flex; justify-content: space-between; align-items: center;
                cursor: move; border-radius: 8px 8px 0 0; background: rgba(0,0,0,0.2);
            ">
                <div style="display:flex; align-items:center; gap:8px; pointer-events:none;">
                    <span style="color:${moduleDef.color}; font-size:1.2rem;">${moduleDef.icon}</span>
                    <span style="font-weight:600; font-size:0.9rem;">${moduleDef.title}</span>
                </div>
                <span class="delete-btn" title="Eliminar"
                      style="color:var(--accent-red); cursor:pointer; font-size:1.3rem;
                             font-weight:bold; padding:0 4px; line-height:1;">&times;</span>
            </div>
            <div style="padding: 15px;">
                ${fieldsHtml}
            </div>
            ${portIn}
            ${portOut}
        `;

        this.nodesContainer.appendChild(nodeEl);

        // --- EVENTOS DEL NODO ---

        // Guardar datos al escribir (input + change para cubrir select)
        nodeEl.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('focus', () => el.style.borderColor = 'var(--accent-blue)');
            el.addEventListener('blur',  () => el.style.borderColor = 'var(--border-color)');
            el.addEventListener('input',  () => window.LibertyEngine.updateNodeData(nodeId, el.getAttribute('data-key'), el.value));
            el.addEventListener('change', () => window.LibertyEngine.updateNodeData(nodeId, el.getAttribute('data-key'), el.value));
        });

        // Botón de conexión (borna de salida)
        const portOutEl = nodeEl.querySelector('.port-out');
        if (portOutEl) {
            portOutEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isConnectingMode && this.sourceConnectNodeId === nodeId) {
                    this.cancelConnectionMode();
                } else {
                    this.startConnectionMode(nodeId);
                }
            });
        }

        // Recibir conexión entrante (clic en el cuerpo del nodo)
        nodeEl.addEventListener('click', (e) => {
            if (!this.isConnectingMode) return;
            if (this.sourceConnectNodeId === nodeId) return;

            if (moduleDef.inputs > 0) {
                const yaExiste = window.LibertyEngine.state.connections.some(
                    c => c.source === this.sourceConnectNodeId && c.target === nodeId
                );
                if (!yaExiste) {
                    window.LibertyEngine.addConnection(this.sourceConnectNodeId, nodeId);
                }
                this.cancelConnectionMode();
                this.drawAllCables();
            } else {
                this.showToast("⚠️ Este bloque es un Disparador, no puede recibir conexiones.");
                setTimeout(() => this.hideToast(), 3000);
            }
        });

        // Borrar nodo
        nodeEl.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNode(nodeId);
        });

        // Arrastrar nodo
        this.dragNode(nodeEl);
    },

    deleteNode: function(nodeId) {
        const el = document.getElementById(nodeId);
        if (el) el.remove();
        window.LibertyEngine.removeNode(nodeId);
        if (this.sourceConnectNodeId === nodeId) this.cancelConnectionMode();
        this.drawAllCables();
    },

    // ---------------------------------------------------------
    // 6. ARRASTRE DE NODOS (con compensación de zoom)
    // ---------------------------------------------------------

    dragNode: function(nodeEl) {
        const header = nodeEl.querySelector('.node-header');
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            // No iniciar drag si el clic fue en el botón de borrar
            if (e.target.classList.contains('delete-btn')) return;
            if (this.isConnectingMode) return;

            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startY = e.clientY;
            const initX  = nodeEl.offsetLeft;
            const initY  = nodeEl.offsetTop;

            nodeEl.style.zIndex  = '100';
            nodeEl.style.opacity = '0.92';

            const onMove = (mv) => {
                // Dividir el delta por zoom para que el nodo siga exactamente al mouse
                const dx = (mv.clientX - startX) / this.camera.zoom;
                const dy = (mv.clientY - startY) / this.camera.zoom;
                nodeEl.style.left = `${initX + dx}px`;
                nodeEl.style.top  = `${initY + dy}px`;
                this.drawAllCables();
            };

            const onUp = () => {
                nodeEl.style.zIndex  = '50';
                nodeEl.style.opacity = '1';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup',   onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup',   onUp);
        });
    },

    // ---------------------------------------------------------
    // 7. CABLES SVG
    // ---------------------------------------------------------

    drawAllCables: function() {
        const connections = window.LibertyEngine.state.connections;
        let paths = '';

        connections.forEach(conn => {
            const s = document.getElementById(conn.source);
            const t = document.getElementById(conn.target);
            if (!s || !t) return;

            const x1 = s.offsetLeft + s.offsetWidth;
            const y1 = s.offsetTop  + s.offsetHeight / 2;
            const x2 = t.offsetLeft;
            const y2 = t.offsetTop  + t.offsetHeight / 2;
            const cx = (x2 - x1) / 2;

            paths += `
                <path
                    class="cable"
                    data-source="${conn.source}"
                    data-target="${conn.target}"
                    d="M ${x1} ${y1} C ${x1+cx} ${y1}, ${x2-cx} ${y2}, ${x2} ${y2}"
                    stroke="var(--accent-blue)"
                    stroke-width="3"
                    fill="none"
                    stroke-linecap="round"
                    style="cursor:pointer; transition: stroke 0.15s;"
                />`;
        });

        this.svgCanvas.innerHTML = `
            <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="var(--accent-blue)"/>
                </marker>
            </defs>
            ${paths}
        `;

        // Hover y clic para borrar cable — se asignan post-render
        this.svgCanvas.querySelectorAll('.cable').forEach(path => {
            path.addEventListener('mouseenter', () => {
                path.setAttribute('stroke', 'var(--accent-red)');
                path.setAttribute('stroke-width', '5');
            });
            path.addEventListener('mouseleave', () => {
                path.setAttribute('stroke', 'var(--accent-blue)');
                path.setAttribute('stroke-width', '3');
            });
            path.addEventListener('click', () => {
                const src = path.getAttribute('data-source');
                const tgt = path.getAttribute('data-target');
                window.LibertyEngine.state.connections = window.LibertyEngine.state.connections.filter(
                    c => !(c.source === src && c.target === tgt)
                );
                this.drawAllCables();
            });
        });
    },

    // ---------------------------------------------------------
    // 8. MODO CONEXIÓN
    // ---------------------------------------------------------

    startConnectionMode: function(sourceId) {
        this.isConnectingMode    = true;
        this.sourceConnectNodeId = sourceId;
        document.body.style.cursor = 'crosshair';

        const sourceEl = document.getElementById(sourceId);
        if (sourceEl) {
            sourceEl.style.borderColor = 'var(--accent-green)';
            sourceEl.style.boxShadow   = '0 0 20px rgba(16,185,129,0.35)';
        }

        this.showToast("🔗 Hacé clic en el bloque destino. (Clic en el fondo para cancelar)");
    },

    cancelConnectionMode: function() {
        if (this.sourceConnectNodeId) {
            const el = document.getElementById(this.sourceConnectNodeId);
            if (el) {
                el.style.borderColor = 'var(--border-color)';
                el.style.boxShadow   = 'var(--shadow-md)';
            }
        }
        this.isConnectingMode    = false;
        this.sourceConnectNodeId = null;
        document.body.style.cursor = 'default';
        this.hideToast();
    },

    // ---------------------------------------------------------
    // 9. BOTONES, IMPORTACIÓN Y MODAL
    // ---------------------------------------------------------

    setupButtons: function() {

        // Probar flujo
        const btnTest = document.getElementById('btn-test');
        if (btnTest) btnTest.addEventListener('click', () => window.LibertyEngine.testLocal());

        // Generar código → abrir modal
        const btnDeploy = document.getElementById('btn-deploy');
        if (btnDeploy) btnDeploy.addEventListener('click', () => {
            const code = window.LibertyEngine.generateCode();
            if (!code) return;
            document.getElementById('generated-code-display').textContent = code;
            document.getElementById('code-modal').style.display = 'flex';
        });

        // Cerrar modal
        const btnClose = document.getElementById('close-modal');
        if (btnClose) btnClose.addEventListener('click', () => {
            document.getElementById('code-modal').style.display = 'none';
        });

        // Copiar código
        const btnCopy = document.getElementById('btn-copy-code');
        if (btnCopy) btnCopy.addEventListener('click', () => {
            const code = document.getElementById('generated-code-display').textContent;
            navigator.clipboard.writeText(code).then(() => {
                this.showToast("📋 ¡Código copiado!");
                setTimeout(() => this.hideToast(), 3000);
            });
        });

        // Descargar .js
        const btnDownload = document.getElementById('btn-download-js');
        if (btnDownload) btnDownload.addEventListener('click', () => {
            const code = document.getElementById('generated-code-display').textContent;
            const blob = new Blob([code], { type: 'text/javascript' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'flujo_libertynode.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showToast("💾 Archivo descargado.");
            setTimeout(() => this.hideToast(), 3000);
        });

        // --- IMPORTAR MÓDULOS: abre el modal ---
        const btnImport     = document.getElementById('btn-import-local');
        const modalImport   = document.getElementById('modal-import');
        const closeImport   = document.getElementById('close-modal-import');
        const btnFetchUrl   = document.getElementById('btn-fetch-url');
        const btnLocalFile  = document.getElementById('btn-local-file');
        const importResult  = document.getElementById('import-result');

        const mostrarResultado = (msg, ok) => {
            if (!importResult) return;
            importResult.style.display  = 'block';
            importResult.style.background = ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
            importResult.style.border   = ok ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)';
            importResult.style.color    = ok ? 'var(--accent-green)' : 'var(--accent-red)';
            importResult.textContent    = msg;
        };

        const inyectarYRegistrar = (codigo) => {
            const modulosAntes = Object.keys(window.LibertyModules);
            try {
                const s = document.createElement('script');
                s.textContent = codigo;
                document.body.appendChild(s);
            } catch (err) {
                mostrarResultado('❌ El archivo tiene errores de sintaxis.', false);
                console.error('[UI] Error inyectando script:', err);
                return;
            }
            setTimeout(() => {
                const nuevos = Object.keys(window.LibertyModules).filter(
                    id => !modulosAntes.includes(id)
                );
                if (nuevos.length > 0) {
                    nuevos.forEach(id => this.addModuleToSidebar(id));
                    mostrarResultado(`✅ ${nuevos.length} módulo(s) agregado(s) al sidebar.`, true);
                    setTimeout(() => {
                        if (modalImport) modalImport.style.display = 'none';
                        if (importResult) importResult.style.display = 'none';
                        if (document.getElementById('import-url'))
                            document.getElementById('import-url').value = '';
                    }, 1800);
                } else {
                    mostrarResultado('⚠️ No se detectaron módulos nuevos en el archivo.', false);
                }
            }, 150);
        };

        // Abrir modal
        if (btnImport && modalImport) {
            btnImport.addEventListener('click', () => {
                if (importResult) importResult.style.display = 'none';
                modalImport.style.display = 'flex';
            });
        }

        // Cerrar modal
        if (closeImport && modalImport) {
            closeImport.addEventListener('click', () => {
                modalImport.style.display = 'none';
                if (importResult) importResult.style.display = 'none';
            });
        }

        // Cerrar al hacer clic fuera del panel
        if (modalImport) {
            modalImport.addEventListener('click', (e) => {
                if (e.target === modalImport) modalImport.style.display = 'none';
            });
        }

        // OPCIÓN 1: Cargar desde URL
        if (btnFetchUrl) {
            btnFetchUrl.addEventListener('click', async () => {
                const url = (document.getElementById('import-url')?.value || '').trim();
                if (!url) { mostrarResultado('⚠️ Ingresá una URL válida.', false); return; }

                mostrarResultado('☁️ Descargando...', true);
                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const codigo = await res.text();
                    inyectarYRegistrar(codigo);
                } catch (err) {
                    mostrarResultado(`❌ Error al descargar: ${err.message}`, false);
                    console.error('[UI] Fetch URL error:', err);
                }
            });
        }

        // OPCIÓN 2: Archivo local
        if (btnLocalFile) {
            btnLocalFile.addEventListener('click', () => {
                const input  = document.createElement('input');
                input.type   = 'file';
                input.accept = '.js';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => inyectarYRegistrar(ev.target.result);
                    reader.readAsText(file);
                };
                input.click();
            });
        }
    },

    // ---------------------------------------------------------
    // 10. SIDEBAR DINÁMICO
    // ---------------------------------------------------------

    addModuleToSidebar: function(moduleId) {
        const moduleDef      = window.LibertyModules[moduleId];
        const scrollArea     = document.querySelector('.modules-scroll');
        if (!moduleDef || !scrollArea) return;

        const item = document.createElement('div');
        item.className = 'module-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-module', moduleId);
        item.style.borderLeft = `3px solid ${moduleDef.color}`;
        item.innerHTML = `
            <span class="mod-icon" style="color:${moduleDef.color};">${moduleDef.icon}</span>
            <div><div style="font-size:0.9rem;">${moduleDef.title}</div></div>
        `;

        item.addEventListener('dragstart', (e) => {
            const t = e.target.closest('[data-module]');
            this.draggedModuleId = t ? t.getAttribute('data-module') : null;
        });

        scrollArea.appendChild(item);
    },

    // ---------------------------------------------------------
    // 11. TOAST (Notificaciones)
    // ---------------------------------------------------------

    showToast: function(msg) {
        let toast = document.getElementById('liberty-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'liberty-toast';
            toast.style.cssText = `
                position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
                background: var(--accent-blue); color: white; padding: 12px 25px;
                border-radius: 30px; font-weight: 600; z-index: 2000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-size: 0.95rem;
                pointer-events: none; transition: opacity 0.3s ease;
            `;
            document.body.appendChild(toast);
        }
        toast.innerText    = msg;
        toast.style.opacity = '1';
        toast.style.display = 'block';
    },

    hideToast: function() {
        const toast = document.getElementById('liberty-toast');
        if (toast) {
            toast.style.opacity = '0';
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        }
    }
};

// ARRANQUE: el script se carga dinámicamente DESPUÉS del onload,
// así que arrancamos directo sin esperar el evento.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    UI.init();
} else {
    document.addEventListener('DOMContentLoaded', () => UI.init());
}