/**
 * LIBERTYNODE - CORE UI (v3.0)
 * Capa puramente visual. El estado vive en logic.js (LibertyState).
 * Los cables se trazan con getBoundingClientRect() para precisión total.
 * Carga con doble-disparo a 300ms y 1000ms para máxima fiabilidad.
 */

const UI = {

    // ---------------------------------------------------------
    // 1. REFERENCIAS AL DOM Y ESTADO
    // ---------------------------------------------------------

    workspace: document.getElementById('workspace'),
    nodesContainer: document.getElementById('nodes-container'),
    svgCanvas: document.getElementById('connection-canvas'),

    draggedModuleId: null,
    nodeCounter: 0,
    isConnectingMode: false,
    sourceConnectNodeId: null,

    // Estado de la Cámara
    camera: {
        x: 0, y: 0, zoom: 1,
        minZoom: 0.2, maxZoom: 3,
        isPanning: false, startX: 0, startY: 0
    },

    // ---------------------------------------------------------
    // 2. ARRANQUE, MEMORIA Y RENDERIZADO
    // ---------------------------------------------------------

    /**
     * Limpia y vuelve a dibujar toda la barra lateral leyendo window.LibertyModules
     */
    renderSidebar: function () {
        const scrollArea = document.querySelector('.modules-scroll');
        if (!scrollArea) return;

        scrollArea.innerHTML = ''; // Limpiamos el HTML viejo

        if (window.LibertyModules) {
            Object.keys(window.LibertyModules).forEach(id => {
                // Asume que addModuleToSidebar ya tiene la lógica de categorías
                if (typeof this.addModuleToSidebar === 'function') {
                    this.addModuleToSidebar(id);
                }
            });
        }
    },

    /**
     * Restaura los módulos importados previamente desde el localStorage
     */
    loadSavedPacks: async function () {
        const saved = JSON.parse(localStorage.getItem('liberty_imported_packs') || '[]');
        if (saved.length === 0) return;

        console.log(`[LibertyNode] 🔄 Restaurando ${saved.length} packs de expansión...`);
        let huboCambios = false;

        for (const url of saved) {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    const code = await res.text();
                    const script = document.createElement('script');
                    script.textContent = code;
                    document.body.appendChild(script);
                    huboCambios = true;
                }
            } catch (e) {
                console.error("❌ Fallo al restaurar pack: " + url);
            }
        }

        // Si inyectamos código, repintamos la barra lateral
        if (huboCambios) {
            setTimeout(() => this.renderSidebar(), 200);
        }
    },

    /**
     * Configura los eventos específicos del modal de importación
     */
    setupImports: function () {
        // --- CONTROL DEL MODAL ---
        const btnOpenModal = document.getElementById('btn-import-local');
        const btnCloseModal = document.getElementById('close-modal-import');
        const modalImport = document.getElementById('modal-import');
        
        if (btnOpenModal && modalImport) {
            btnOpenModal.onclick = () => { modalImport.style.display = 'flex'; };
        }
        if (btnCloseModal && modalImport) {
            btnCloseModal.onclick = () => { modalImport.style.display = 'none'; };
        }

        // --- OPCIÓN 1: Descargar desde URL de GitHub ---
        const btnFetchUrl = document.getElementById('btn-fetch-url');
        if (btnFetchUrl) {
            btnFetchUrl.onclick = async () => {
                const url = document.getElementById('import-url').value.trim();
                if (!url) return this.showToast("⚠️ Por favor, ingresa una URL válida.");

                try {
                    this.showToast("☁️ Descargando módulo...");
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Error HTTP: " + response.status);

                    const script = document.createElement('script');
                    script.textContent = await response.text();
                    document.body.appendChild(script);

                    // Forzamos el repintado y guardamos en memoria
                    setTimeout(() => {
                        this.renderSidebar();
                        this.showToast("✅ Pack instalado y sincronizado.");

                        let savedPacks = JSON.parse(localStorage.getItem('liberty_imported_packs') || '[]');
                        if (!savedPacks.includes(url)) {
                            savedPacks.push(url);
                            localStorage.setItem('liberty_imported_packs', JSON.stringify(savedPacks));
                        }

                        const modalImport = document.getElementById('modal-import');
                        if (modalImport) modalImport.style.display = 'none';
                        document.getElementById('import-url').value = '';
                    }, 150);

                } catch (err) {
                    console.error("Error importando:", err);
                    this.showToast("❌ Error al cargar. Verificá que sea un link RAW.");
                }
            };
        }

        // --- OPCIÓN 2: Cargar archivo local (.js) ---
        const btnLocalFile = document.getElementById('btn-local-file');
        if (btnLocalFile) {
            btnLocalFile.onclick = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.js';
                input.onchange = e => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = ev => {
                        const script = document.createElement('script');
                        script.textContent = ev.target.result;
                        document.body.appendChild(script);

                        setTimeout(() => {
                            this.renderSidebar();
                            this.showToast("✅ Archivo local sincronizado.");
                            const modalImport = document.getElementById('modal-import');
                            if (modalImport) modalImport.style.display = 'none';
                        }, 150);
                    };
                    reader.readAsText(file);
                };
                input.click();
            };
        }
    },

    setupProjectWidget: function () {
        const existing = document.getElementById('project-name-widget');
        if (existing) existing.remove();

        const widget = document.createElement('div');
        widget.id = 'project-name-widget';
        widget.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #0e1420; border: 1px solid #1e2d42; padding: 8px 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.4); border-left: 3px solid var(--accent-blue);';
        widget.innerHTML = `
            <span style="font-size: 1.2rem;">📂</span>
            <input type="text" id="project-name-input" value="${window.currentProjectName || 'Nuevo_Proyecto'}" 
                style="background: transparent; border: none; color: #e8edf5; font-family: inherit; font-size: 0.95rem; font-weight: bold; outline: none; width: 160px; border-bottom: 1px dashed #4a5568;">
        `;
        document.body.appendChild(widget);

        const input = document.getElementById('project-name-input');
        input.addEventListener('change', (e) => {
            let safeName = e.target.value.trim().replace(/\\s+/g, '_');
            if (!safeName) safeName = "Nuevo_Proyecto";
            e.target.value = safeName;
            window.currentProjectName = safeName;
        });
    },

    /**
     * Inicializador Principal
     */
    init: function () {
        // Configuraciones base
        this.setupSidebarDrag();
        this.setupWorkspaceDrop();
        this.setupCamera();

        if (typeof this.setupProjectWidget === 'function') {
            this.setupProjectWidget();
        }

        // Asumo que setupButtons maneja los demás botones (exportar, cerrar modales, etc.)
        if (typeof this.setupButtons === 'function') this.setupButtons();

        // Configuramos los botones de importación
        if (typeof this.setupImports === 'function') this.setupImports();

        // Dibujamos los módulos base que ya están en modules.js
        this.renderSidebar();

        // Disparamos la recuperación de packs externos al iniciar
        this.loadSavedPacks();

        // Cancelar modo conexión al hacer clic en el vacío del lienzo
        this.workspace.addEventListener('click', (e) => {
            if (e.target === this.workspace || e.target === this.svgCanvas) {
                if (this.isConnectingMode) this.cancelConnectionMode();
            }
        });

        console.log("[LibertyNode v2.1] Sistema y Motor de Memoria listos.");

        // Disparamos la carga de proyecto si venimos de proyectos.html
        // Damos 500ms para asegurar que LibertyUser y los módulos externos se hayan cargado.
        setTimeout(() => {
            if (typeof this.loadWorkspace === 'function') {
                this.loadWorkspace();
            }
        }, 500);
    }, // <-- ¡Atención a esta coma!

    // ---------------------------------------------------------
    // RECONSTRUCCIÓN DE PROYECTOS
    // ---------------------------------------------------------
    loadWorkspace: async function () {
        const urlParams = new URLSearchParams(window.location.search);
        const projectName = urlParams.get('load');
        const source = urlParams.get('from');

        if (!projectName || !source) return;

        window.currentProjectName = projectName;
        const nameInput = document.getElementById('project-name-input');
        if (nameInput) nameInput.value = projectName;

        console.log(`[LibertyNode] 🔄 Cargando proyecto: ${projectName} desde ${source}`);
        let workspaceData = null;

        // 1. OBTENER LOS DATOS (Bóveda Local o GitHub)
        if (source === 'boveda') {
            const email = window.LibertyUser ? window.LibertyUser.email : null;
            if (!email) return;
            const localSaves = JSON.parse(localStorage.getItem(`liberty_saves_${email}`) || '{}');
            const dataStr = localSaves[projectName];
            if (dataStr) workspaceData = JSON.parse(dataStr);
        }
        else if (source === 'github') {
            const ghToken = window.LibertyUser ? window.LibertyUser.ghToken : null;
            const ghUser = window.LibertyUser ? window.LibertyUser.nombre : null;
            if (!ghToken || !ghUser) return;

            try {
                // Buscamos el nombre de usuario real de GitHub
                const userRes = await fetch("https://api.github.com/user", { headers: { "Authorization": `token ${ghToken}` } });
                const githubUsername = (await userRes.json()).login;

                const url = `https://api.github.com/repos/${githubUsername}/libertynode/contents/saves/${projectName}.json`;
                const res = await fetch(url, { headers: { "Authorization": `token ${ghToken}` } });
                if (res.ok) {
                    const fileData = await res.json();
                    const decoded = decodeURIComponent(escape(atob(fileData.content)));
                    workspaceData = JSON.parse(decoded);
                }
            } catch (e) {
                console.error("Fallo al descargar de GitHub", e);
            }
        }

        if (!workspaceData) {
            if (typeof this.showToast === 'function') this.showToast("❌ No se pudo cargar el proyecto.");
            return;
        }

        // 2. RECONSTRUIR EL LIENZO
        this.nodesContainer.innerHTML = '';
        this.svgCanvas.innerHTML = '';
        this.nodeCounter = 0;

        // AUTO-CLOUD DE MODULOS: Inyectar repositorios faltantes
        if (workspaceData.importedPacks && Array.isArray(workspaceData.importedPacks)) {
            let savedPacks = JSON.parse(localStorage.getItem('liberty_imported_packs') || '[]');
            let hubieronNuevos = false;
            for (const url of workspaceData.importedPacks) {
                if (!savedPacks.includes(url)) {
                    if (typeof this.showToast === 'function') this.showToast("☁️ Importando pack remoto faltante...");
                    try {
                        const res = await fetch(url);
                        if (res.ok) {
                            const script = document.createElement('script');
                            script.textContent = await res.text();
                            document.body.appendChild(script);
                            savedPacks.push(url);
                            hubieronNuevos = true;
                        }
                    } catch (e) {
                        console.error("Fallo al descargar pack remoto:", url);
                    }
                }
            }
            if (hubieronNuevos) {
                localStorage.setItem('liberty_imported_packs', JSON.stringify(savedPacks));
                if (typeof this.renderSidebar === 'function') this.renderSidebar();
            }
        }

        // Cargar en LibertyState (fuente de la verdad)
        window.LibertyState.loadFromData(workspaceData);

        // A. Dibujar los Nodos (solo visual, el estado ya está en LibertyState)
        const stateNodes = window.LibertyState.nodes;
        Object.keys(stateNodes).forEach(nodeId => {
            const nodeInfo = stateNodes[nodeId];
            const modId = nodeInfo.moduleId;

            // Avanzar el contador para evitar colisiones
            const nNum = parseInt(nodeId.split('_')[1] || 0);
            if (nNum >= this.nodeCounter) this.nodeCounter = nNum + 1;

            const x = nodeInfo.ui ? nodeInfo.ui.x : 100;
            const y = nodeInfo.ui ? nodeInfo.ui.y : 100;
            const el = this.createNodeOnCanvas(modId, x, y, nodeId);

            // Restaurar valores de campos
            if (nodeInfo.data && el) {
                Object.keys(nodeInfo.data).forEach(fieldId => {
                    const input = el.querySelector(`[data-key="${fieldId}"]`);
                    if (input) {
                        input.value = nodeInfo.data[fieldId];
                        window.LibertyState.updateData(nodeId, fieldId, nodeInfo.data[fieldId]);
                    }
                });
            }
        });

        window.currentProjectName = projectName;

        // C. DOBLE DISPARO de cables — 300ms (primer intento) + 1000ms (safety net)
        setTimeout(() => { this.syncCablesFromLogic(); }, 300);
        setTimeout(() => {
            this.syncCablesFromLogic();
            if (typeof this.showToast === 'function') {
                this.showToast(`✅ Proyecto '${projectName}' restaurado.`);
            }
        }, 1000);

    },

    // ---------------------------------------------------------
    // 3. SISTEMA DE CÁMARA
    // ---------------------------------------------------------

    /**
     * Convierte coordenadas de pantalla a coordenadas del lienzo (world space).
     * Usar en TODOS los eventos que crean o interactúan con nodos.
     */
    getRelativeCoordinates: function (e) {
        const rect = this.workspace.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.camera.x) / this.camera.zoom,
            y: (e.clientY - rect.top - this.camera.y) / this.camera.zoom
        };
    },

    updateCamera: function () {
        const content = document.getElementById('workspace-content');
        if (content) {
            content.style.transform = `translate(${this.camera.x}px, ${this.camera.y}px) scale(${this.camera.zoom})`;
            content.style.transformOrigin = '0 0';
        }
        // Grid infinito: mover el fondo con la cámara
        this.workspace.style.backgroundPosition = `${this.camera.x}px ${this.camera.y}px`;
        this.workspace.style.backgroundSize = `${30 * this.camera.zoom}px ${30 * this.camera.zoom}px`;
    },

    setupCamera: function () {

        // ZOOM con ruedita — centrado en el puntero
        this.workspace.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(this.camera.minZoom, Math.min(this.camera.zoom * delta, this.camera.maxZoom));
            const rect = this.workspace.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            this.camera.x = mx - (mx - this.camera.x) * (newZoom / this.camera.zoom);
            this.camera.y = my - (my - this.camera.y) * (newZoom / this.camera.zoom);
            this.camera.zoom = newZoom;
            this.updateCamera();
        }, { passive: false });

        // PAN con clic central (ruedita) o clic derecho
        this.workspace.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) {
                this.camera.isPanning = true;
                this.camera.startX = e.clientX - this.camera.x;
                this.camera.startY = e.clientY - this.camera.y;
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

        // --- TOUCH EVENTS (PAN Y PINCH TO ZOOM) ---
        let initialPinchDistance = null;
        let initialZoom = null;

        this.workspace.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.camera.isPanning = true;
                this.camera.startX = e.touches[0].clientX - this.camera.x;
                this.camera.startY = e.touches[0].clientY - this.camera.y;
            } else if (e.touches.length === 2) {
                this.camera.isPanning = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
                initialZoom = this.camera.zoom;
            }
        }, { passive: false });

        this.workspace.addEventListener('touchmove', (e) => {
            if (this.camera.isPanning && e.touches.length === 1) {
                this.camera.x = e.touches[0].clientX - this.camera.startX;
                this.camera.y = e.touches[0].clientY - this.camera.startY;
                this.updateCamera();
                e.preventDefault();
            } else if (e.touches.length === 2 && initialPinchDistance !== null) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const scale = dist / initialPinchDistance;
                this.camera.zoom = Math.max(this.camera.minZoom, Math.min(initialZoom * scale, this.camera.maxZoom));
                this.updateCamera();
                e.preventDefault();
            }
        }, { passive: false });

        this.workspace.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) initialPinchDistance = null;
            if (e.touches.length === 0) this.camera.isPanning = false;
        });

        // Bloquear menú contextual del clic derecho
        this.workspace.addEventListener('contextmenu', e => e.preventDefault());
    },

    // ---------------------------------------------------------
    // 4. DRAG & DROP DEL SIDEBAR
    // ---------------------------------------------------------

    setupSidebarDrag: function () {
        document.querySelectorAll('.module-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                // Subimos por el DOM hasta encontrar el data-module (por si el clic fue en un hijo)
                const target = e.target.closest('[data-module]');
                this.draggedModuleId = target ? target.getAttribute('data-module') : null;
            });
        });
    },

    setupWorkspaceDrop: function () {
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

    createNodeOnCanvas: function (moduleId, x, y, forcedId) {
        const moduleDef = window.LibertyModules[moduleId];
        if (!moduleDef) {
            console.error(`[UI] Módulo no encontrado: ${moduleId}`);
            return null;
        }

        const nodeId = forcedId || `nodo_${++this.nodeCounter}`;
        // Registrar en LibertyState (fuente de la verdad)
        if (!window.LibertyState.nodes[nodeId]) {
            window.LibertyState.addNode(nodeId, moduleId);
        }
        // Sincronizar backward-compat con Engine
        window.LibertyState.syncToEngine();

        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.id = nodeId;
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
            el.addEventListener('blur', () => el.style.borderColor = 'var(--border-color)');
            el.addEventListener('input', () => window.LibertyEngine.updateNodeData(nodeId, el.getAttribute('data-key'), el.value));
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
                window.LibertyState.linkNodes(this.sourceConnectNodeId, nodeId);
                window.LibertyState.syncToEngine();
                this.cancelConnectionMode();
                this.syncCablesFromLogic();
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

    // ---------------------------------------------------------
    // BORRADO SEGURO DE NODOS Y CABLES
    // ---------------------------------------------------------
    deleteNode: function (nodeId) {
        // 1. Borrar el bloque visual
        const nodeEl = document.getElementById(nodeId);
        if (nodeEl) nodeEl.remove();

        // 2. Borrar del estado maestro y re-sincronizar
        window.LibertyState.deleteNode(nodeId);
        window.LibertyState.syncToEngine();
        this.syncCablesFromLogic();

        if (typeof this.showToast === 'function') this.showToast("🗑️ Nodo eliminado.");
    },

    // ---------------------------------------------------------
    // 6. ARRASTRE DE NODOS (con compensación de zoom)
    // ---------------------------------------------------------

    dragNode: function (nodeEl) {
        const header = nodeEl.querySelector('.node-header');
        if (!header) return;

        const initDrag = (e, clientX, clientY, isTouch = false) => {
            if (e.target.classList.contains('delete-btn') || this.isConnectingMode) return;
            e.preventDefault(); e.stopPropagation();

            const startX = clientX; const startY = clientY;
            const initX = nodeEl.offsetLeft; const initY = nodeEl.offsetTop;

            nodeEl.style.zIndex = '100';
            nodeEl.style.opacity = '0.92';

            const onMove = (mvX, mvY) => {
                const dx = (mvX - startX) / this.camera.zoom;
                const dy = (mvY - startY) / this.camera.zoom;
                nodeEl.style.left = `${initX + dx}px`;
                nodeEl.style.top = `${initY + dy}px`;
                if (typeof this.syncCablesFromLogic === 'function') this.syncCablesFromLogic();
            };

            const onMouseMove = (mv) => onMove(mv.clientX, mv.clientY);
            const onTouchMove = (tv) => { onMove(tv.touches[0].clientX, tv.touches[0].clientY); tv.preventDefault(); };

            const onUp = () => {
                nodeEl.style.zIndex = '50';
                nodeEl.style.opacity = '1';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onUp);
            };

            if (isTouch) {
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onUp);
            } else {
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onUp);
            }
        };

        header.addEventListener('mousedown', (e) => initDrag(e, e.clientX, e.clientY, false));
        header.addEventListener('touchstart', (e) => initDrag(e, e.touches[0].clientX, e.touches[0].clientY, true), { passive: false });
    },

    // ---------------------------------------------------------
    // 7. CABLES SVG
    // ---------------------------------------------------------

    syncCablesFromLogic: function () {
        const wsContent = document.getElementById('workspace-content');
        const wsRect = wsContent ? wsContent.getBoundingClientRect() : { left: 0, top: 0 };

        const nodes = window.LibertyState.nodes || {};
        let paths = '';

        Object.keys(nodes).forEach(sourceId => {
            const nodeInfo = nodes[sourceId];
            if (!nodeInfo.targetNodes || nodeInfo.targetNodes.length === 0) return;

            // Auto-purga de targets huérfanos
            nodeInfo.targetNodes = nodeInfo.targetNodes.filter(t => !!nodes[t]);

            nodeInfo.targetNodes.forEach(targetId => {
                const s = document.getElementById(sourceId);
                const t = document.getElementById(targetId);
                if (!s || !t) return;

                // getBoundingClientRect relativo al workspace-content (preciso con zoom/transform)
                const sr = s.getBoundingClientRect();
                const tr = t.getBoundingClientRect();

                const x1 = (sr.right  - wsRect.left) / this.camera.zoom;
                const y1 = (sr.top + sr.height / 2 - wsRect.top) / this.camera.zoom;
                const x2 = (tr.left   - wsRect.left) / this.camera.zoom;
                const y2 = (tr.top + tr.height / 2 - wsRect.top) / this.camera.zoom;
                const cx = Math.abs(x2 - x1) / 2;

                paths += `<path
                    class="cable"
                    data-source="${sourceId}"
                    data-target="${targetId}"
                    d="M ${x1} ${y1} C ${x1 + cx} ${y1}, ${x2 - cx} ${y2}, ${x2} ${y2}"
                    stroke="var(--accent-blue)"
                    stroke-width="3"
                    fill="none"
                    stroke-linecap="round"
                    style="cursor:pointer; transition: stroke 0.15s;"
                />`;
            });
        });

        this.svgCanvas.innerHTML = `
            <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="var(--accent-blue)"/>
                </marker>
            </defs>
            ${paths}`;

        // Eventos en cables (borrar al clic, highlight en hover)
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
                window.LibertyState.unlinkNodes(src, tgt);
                window.LibertyState.syncToEngine();
                this.syncCablesFromLogic();
            });
        });

        // Backward-compat: sincronizar Engine
        window.LibertyState.syncToEngine();
    },

    // ---------------------------------------------------------
    // 8. MODO CONEXIÓN
    // ---------------------------------------------------------

    startConnectionMode: function (sourceId) {
        this.isConnectingMode = true;
        this.sourceConnectNodeId = sourceId;
        document.body.style.cursor = 'crosshair';

        const sourceEl = document.getElementById(sourceId);
        if (sourceEl) {
            sourceEl.style.borderColor = 'var(--accent-green)';
            sourceEl.style.boxShadow = '0 0 20px rgba(16,185,129,0.35)';
        }

        this.showToast("🔗 Hacé clic en el bloque destino. (Clic en el fondo para cancelar)");
    },

    cancelConnectionMode: function () {
        if (this.sourceConnectNodeId) {
            const el = document.getElementById(this.sourceConnectNodeId);
            if (el) {
                el.style.borderColor = 'var(--border-color)';
                el.style.boxShadow = 'var(--shadow-md)';
            }
        }
        this.isConnectingMode = false;
        this.sourceConnectNodeId = null;
        document.body.style.cursor = 'default';
        this.hideToast();
    },

    // ---------------------------------------------------------
    // 3. BOTONES Y CONTROLES (Exportación y Nube)
    // ---------------------------------------------------------
    setupButtons: function () {
        // --- 1. DESPLEGAR Y ENSAMBLAR CÓDIGO ---
        const btnDeploy = document.getElementById('btn-deploy');
        const modalCode = document.getElementById('modal-code'); // Asegurate de que este ID coincida con tu HTML
        if (btnDeploy && modalCode) {
            btnDeploy.onclick = () => {
                const finalCode = window.LibertyEngine.generateCode();
                document.getElementById('generated-code-display').textContent = finalCode;
                modalCode.style.display = 'flex';
            };
        }

        const btnCloseModal = document.getElementById('close-modal');
        if (btnCloseModal && modalCode) {
            btnCloseModal.onclick = () => modalCode.style.display = 'none';
        }

        // --- 2. COPIAR CÓDIGO AL PORTAPAPELES ---
        const btnCopy = document.getElementById('btn-copy-code');
        if (btnCopy) {
            btnCopy.onclick = () => {
                const code = document.getElementById('generated-code-display').textContent;
                navigator.clipboard.writeText(code);
                if (typeof this.showToast === 'function') this.showToast("📋 Código copiado al portapapeles.");
            };
        }

        // --- 3. DESCARGAR CÓDIGO (.js) ---
        const btnDownloadJs = document.getElementById('btn-download-js');
        if (btnDownloadJs) {
            btnDownloadJs.onclick = () => {
                const code = document.getElementById('generated-code-display').textContent;
                const blob = new Blob([code], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'liberty-bot.js';
                a.click();
                URL.revokeObjectURL(url);
                if (typeof this.showToast === 'function') this.showToast("⬇️ Archivo JS descargado.");
            };
        }

        const captureProjectNameAndCoords = () => {
            const nameInput = document.getElementById('project-name-input');
            let projectName = nameInput ? nameInput.value.trim() : (window.currentProjectName || "Nuevo_Proyecto");

            // Normalizar filename
            if (projectName.toLowerCase().endsWith('.json')) {
                projectName = projectName.slice(0, -5);
            }
            projectName = projectName.replace(/\\s+/g, '_');
            window.currentProjectName = projectName;

            // Sincronizar posiciones visuales actuales antes de guardar
            Object.keys(window.LibertyState.nodes).forEach(nodeId => {
                const el = document.getElementById(nodeId);
                if (el) {
                    window.LibertyState.nodes[nodeId].ui = { 
                        x: el.offsetLeft, 
                        y: el.offsetTop 
                    };
                }
            });

            const cleanState = window.LibertyState.exportClean();
            cleanState.metadata.name = projectName;
            return { projectName, cleanState };
        };

        // --- BUTÓN LOCAL (DESCARGA FÍSICA) ---
        const btnSaveLocal = document.getElementById('btn-save-local');
        if (btnSaveLocal) {
            btnSaveLocal.onclick = () => {
                const { projectName, cleanState } = captureProjectNameAndCoords();
                
                const blob = new Blob([JSON.stringify(cleanState, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = projectName + '.json';
                a.click();
                URL.revokeObjectURL(url);
                
                if (typeof this.showToast === 'function') this.showToast("💾 Proyecto exportado físicamente.");
            };
        }

        // --- BOTÓN CLOUD (FIRESTORE DB) ---
        const btnSaveCloud = document.getElementById('btn-save-cloud');
        if (btnSaveCloud) {
            btnSaveCloud.onclick = async () => {
                if (window.isGuest || !window.LibertyUser) {
                    return this.showToast("⚠️ Modo Invitado: Inicia sesión para sincronizar con la nube.");
                }
                
                const { projectName, cleanState } = captureProjectNameAndCoords();
                
                this.showToast("☁️ Guardando en la nube...");
                try {
                    if (typeof window.LibertyCloudSave === 'function') {
                        await window.LibertyCloudSave(window.LibertyUser.email, projectName, cleanState);
                        this.showToast(`✅ '${projectName}' guardado en la nube.`);
                    } else {
                        throw new Error("API Firebase no accesible.");
                    }
                } catch (e) {
                    console.error("[Liberty Cloud]", e);
                    this.showToast("❌ Error de sincronización.");
                }
            };
        }

    },
    // ---------------------------------------------------------
    // 10. SIDEBAR DINÁMICO
    // ---------------------------------------------------------

    /**
     * Dibuja un módulo nuevo agrupándolo por categorías colapsables
     */
    addModuleToSidebar: function (moduleId) {
        const moduleDef = window.LibertyModules[moduleId];
        const scrollArea = document.querySelector('.modules-scroll');
        if (!scrollArea || !moduleDef) return;

        // 1. Determinar la categoría automáticamente
        let catName = "Generales";
        if (moduleId.startsWith('tg_')) catName = "Telegram";
        else if (moduleId.startsWith('g_')) catName = "Google Workspace";
        else if (moduleId.startsWith('ai_')) catName = "Inteligencia Artificial";
        else if (moduleId.startsWith('trigger_') && !moduleDef.category) catName = "Disparadores (Triggers)";

        // Limpiamos el nombre para usarlo como ID
        const catId = 'cat-' + catName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let catContainer = document.getElementById(catId);

        // 2. Si la categoría no existe, creamos el "Acordeón"
        if (!catContainer) {
            const group = document.createElement('div');
            group.className = 'category-group';
            group.style.marginBottom = '8px';
            group.innerHTML = `
                <div class="category-title" style="padding: 10px 15px; cursor: pointer; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.85rem; font-weight: bold; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                    <span>${catName}</span>
                    <span style="font-size: 1.2rem; line-height: 0.5;">▾</span>
                </div>
                <div class="category-content active" id="${catId}" style="padding: 5px; display: flex; flex-direction: column; gap: 5px; margin-top: 5px;"></div>
            `;

            // Lógica para colapsar/expandir
            group.querySelector('.category-title').onclick = function () {
                const content = this.nextElementSibling;
                content.style.display = content.style.display === 'none' ? 'flex' : 'none';
            };

            scrollArea.appendChild(group);
            catContainer = group.querySelector('.category-content');
        }

        // 3. Crear el bloque arrastrable
        const item = document.createElement('div');
        item.className = 'module-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-module', moduleId);
        item.style.borderLeft = `3px solid ${moduleDef.color}`;

        item.innerHTML = `
            <span class="mod-icon" style="color: ${moduleDef.color};">${moduleDef.icon}</span>
            <div class="mod-info"><div>${moduleDef.title}</div></div>
        `;

        item.addEventListener('dragstart', (e) => {
            const t = e.target.closest('[data-module]');
            this.draggedModuleId = t ? t.getAttribute('data-module') : null;
        });

        // Agregarlo a su carpeta correspondiente
        catContainer.appendChild(item);
    },

    // ---------------------------------------------------------
    // 11. TOAST (Notificaciones)
    // ---------------------------------------------------------

    showToast: function (msg) {
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
        toast.innerText = msg;
        toast.style.opacity = '1';
        toast.style.display = 'block';
    },

    hideToast: function () {
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