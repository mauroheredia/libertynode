/**
 * LIBERTYNODE - LOGIC (State Layer)
 * Fuente única de la verdad para el estado del lienzo.
 * ui.js lee desde aquí; engine.js se mantiene sincronizado vía syncToEngine().
 */

window.LibertyState = {

    nodes: {},  // { nodeId: { moduleId, data: {}, targetNodes: [] } }

    /**
     * Registra un nuevo nodo en el estado maestro.
     */
    addNode: function (nodeId, moduleId) {
        this.nodes[nodeId] = {
            moduleId: moduleId,
            data: {},
            targetNodes: []
        };
        console.log(`[LibertyState] Nodo registrado: ${nodeId} (${moduleId})`);
    },

    /**
     * Elimina un nodo y lo purga del targetNodes de todos los demás.
     */
    deleteNode: function (nodeId) {
        delete this.nodes[nodeId];
        Object.values(this.nodes).forEach(node => {
            if (node.targetNodes) {
                node.targetNodes = node.targetNodes.filter(id => id !== nodeId);
            }
        });
        console.log(`[LibertyState] Nodo eliminado: ${nodeId}`);
    },

    /**
     * Conecta source → target (agrega targetId al array del nodo source).
     */
    linkNodes: function (sourceId, targetId) {
        if (!this.nodes[sourceId]) return false;
        if (!this.nodes[sourceId].targetNodes) this.nodes[sourceId].targetNodes = [];
        if (this.nodes[sourceId].targetNodes.includes(targetId)) return false; // ya existe
        this.nodes[sourceId].targetNodes.push(targetId);
        console.log(`[LibertyState] Enlace: ${sourceId} → ${targetId}`);
        return true;
    },

    /**
     * Desconecta source → target.
     */
    unlinkNodes: function (sourceId, targetId) {
        if (!this.nodes[sourceId] || !this.nodes[sourceId].targetNodes) return;
        this.nodes[sourceId].targetNodes = this.nodes[sourceId].targetNodes.filter(id => id !== targetId);
        console.log(`[LibertyState] Enlace roto: ${sourceId} → ${targetId}`);
    },

    /**
     * Actualiza el valor de un campo de datos en un nodo.
     */
    updateData: function (nodeId, key, value) {
        if (this.nodes[nodeId]) {
            this.nodes[nodeId].data[key] = value;
        }
    },

    /**
     * Sincroniza LibertyState → LibertyEngine para mantener backward-compat
     * con engine.js (generateCode usa state.connections[]).
     */
    syncToEngine: function () {
        if (!window.LibertyEngine) return;

        // Copiar nodes al engine
        window.LibertyEngine.state.nodes = this.nodes;

        // Reconstruir connections[] a partir de targetNodes
        const conns = [];
        Object.keys(this.nodes).forEach(srcId => {
            const node = this.nodes[srcId];
            if (node.targetNodes) {
                node.targetNodes.forEach(tgtId => {
                    conns.push({ source: srcId, target: tgtId });
                });
            }
        });
        window.LibertyEngine.state.connections = conns;
    },

    /**
     * Recarga el estado desde un objeto workspaceData guardado.
     * Soporta tanto el formato nuevo (targetNodes) como el viejo (connections[]).
     */
    loadFromData: function (workspaceData) {
        this.nodes = {};

        // Cargar nodos
        if (workspaceData.nodes) {
            Object.keys(workspaceData.nodes).forEach(nodeId => {
                const info = workspaceData.nodes[nodeId];
                this.nodes[nodeId] = {
                    moduleId: info.moduleId,
                    data: info.data || {},
                    ui: info.ui || {},
                    targetNodes: info.targetNodes || []
                };
            });
        }

        // Migración desde formato viejo: connections[] → targetNodes
        if (workspaceData.connections && Array.isArray(workspaceData.connections)) {
            workspaceData.connections.forEach(conn => {
                this.linkNodes(conn.source, conn.target);
            });
        }

        this.syncToEngine();
        console.log(`[LibertyState] Estado cargado: ${Object.keys(this.nodes).length} nodos.`);
    },

    /**
     * Exporta el estado actual como objeto serializable (para guardar).
     * Solo guarda nodes (con targetNodes embebido). Sin connections separadas.
     */
    exportClean: function () {
        const packs = JSON.parse(localStorage.getItem('liberty_imported_packs') || '[]');
        return {
            metadata: {
                name: window.currentProjectName || "Nuevo_Proyecto",
                version: "3.0",
                date: new Date().toISOString()
            },
            importedPacks: packs,
            nodes: JSON.parse(JSON.stringify(this.nodes))
        };
    }
};
