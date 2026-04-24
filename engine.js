/**
 * LIBERTYNODE - CORE ENGINE
 * El motor lógico que procesa el grafo visual y genera el código final.
 * Soporta ramificaciones (1-a-N) y ejecución recursiva.
 */

window.LibertyEngine = {
    // El estado guarda la "memoria" técnica del circuito actual
    state: {
        nodes: {},       // Diccionario de instancias: { "nodo_1": { moduleId: "...", data: {...} } }
        connections: []  // Lista de cables: [ { source: "id_origen", target: "id_destino" } ]
    },

    // ---------------------------------------------------------
    // 1. GESTIÓN DEL ESTADO (API para UI.js)
    // ---------------------------------------------------------
    
    /**
     * Registra un nuevo componente en el tablero.
     */
    addNode: function(nodeId, moduleId) {
        this.state.nodes[nodeId] = {
            moduleId: moduleId,
            data: {} // Aquí se guardarán los valores de los inputs (tokens, rutas, etc.)
        };
        console.log(`[Engine] Componente montado: ${nodeId} (Tipo: ${moduleId})`);
    },

    /**
     * Actualiza los valores internos de un bloque cuando el usuario escribe.
     */
    updateNodeData: function(nodeId, key, value) {
        if (this.state.nodes[nodeId]) {
            this.state.nodes[nodeId].data[key] = value;
        }
    },

    /**
     * "Suelda" una conexión entre dos bloques.
     */
    addConnection: function(sourceId, targetId) {
        this.state.connections.push({ source: sourceId, target: targetId });
        console.log(`[Engine] Conexión establecida: ${sourceId} -> ${targetId}`);
    },

    /**
     * Limpia la memoria de un bloque si se borra de la interfaz.
     */
    removeNode: function(nodeId) {
        delete this.state.nodes[nodeId];
        // También cortamos todos los cables asociados
        this.state.connections = this.state.connections.filter(
            conn => conn.source !== nodeId && conn.target !== nodeId
        );
    },

    // ---------------------------------------------------------
    // 2. EL COMPILADOR (Generador de Código Multirama)
    // ---------------------------------------------------------

    /**
     * Transforma el diagrama visual en un script de JavaScript puro.
     */
    generateCode: function() {
        console.log("[Engine] Iniciando secuencia de compilación...");
        
        let finalCode = "";
        
        // Encabezado técnico del archivo
        finalCode += "// ==========================================\n";
        finalCode += "// SCRIPT GENERADO POR LIBERTYNODE\n";
        finalCode += "// Soberanía total: Código local y abierto.\n";
        finalCode += "// ==========================================\n\n";

        // 1. Identificar los puntos de inicio (Triggers)
        // Buscamos todos los nodos que son de tipo "trigger" en modules.js
        let triggerNodes = Object.keys(this.state.nodes).filter(id => {
            const node = this.state.nodes[id];
            return window.LibertyModules[node.moduleId].type === "trigger";
        });

        if (triggerNodes.length === 0) {
            alert("⚠️ Error de circuito: Necesitas al menos un 'Trigger' para iniciar el flujo.");
            return null;
        }

        /**
         * FUNCIÓN INTERNA RECURSIVA: Procesa una rama del circuito.
         * Es como seguir la corriente eléctrica por los cables.
         */
        const procesarRama = (nodeId, indentacion = 0) => {
            const node = this.state.nodes[nodeId];
            const moduleDef = window.LibertyModules[node.moduleId];
            const espaciado = "    ".repeat(indentacion);

            // Obtenemos la plantilla de código del módulo y le inyectamos sus datos
            let snippet = moduleDef.generateCode(node.data);
            
            // Aplicamos indentación para que el código sea legible (estilo profesional)
            let snippetFormateado = snippet.split('\n')
                .map(linea => espaciado + linea)
                .join('\n');
            
            finalCode += snippetFormateado + "\n";

            // 2. Buscar hacia dónde van los cables que salen de este nodo
            let hijos = this.state.connections.filter(conn => conn.source === nodeId);

            hijos.forEach(conn => {
                // Si el nodo actual es de lógica (como un IF), aumentamos la indentación
                let nuevaIndentacion = (moduleDef.type === "logic") ? indentacion + 1 : indentacion;
                procesarRama(conn.target, nuevaIndentacion);
            });

            // Si es un bloque de lógica, cerramos la llave del bloque al terminar la rama
            if (moduleDef.type === "logic") {
                finalCode += espaciado + "}\n";
            }
        };

        // Iniciamos la propagación desde cada Trigger encontrado
        triggerNodes.forEach(id => {
            procesarRama(id, 0);
            finalCode += "}\n\n"; // Cierre de la función principal del trigger
        });

        finalCode += "console.log('Flujo ejecutado correctamente.');\n";
        
        console.log("=== RESULTADO DEL ENSAMBLAJE ===");
        console.log(finalCode);
        return finalCode;
    },

    // ---------------------------------------------------------
    // 3. EL SIMULADOR (Prueba de Banco)
    // ---------------------------------------------------------
    
    /**
     * Ejecuta una simulación del flujo generado en la consola del navegador.
     */
    testLocal: function() {
        const script = this.generateCode();
        if (!script) return;

        console.log("▶️ Iniciando simulación en entorno seguro...");
        
        // En una implementación real, aquí podríamos usar un Web Worker
        // Por ahora, mostramos el resultado para que el técnico lo valide
        alert("El esquema lógico se ha compilado. Revisa la Consola (F12) para ver el script final.");
    }
};