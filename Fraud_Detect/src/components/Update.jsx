import React, { useState } from "react";
import driver from "../config/neo4jConfig";

const UpdateNodesView = () => {
  const [nodeType, setNodeType] = useState("Clientes");
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeProperties, setNodeProperties] = useState({});
  const [nodeRelationships, setNodeRelationships] = useState([]); // Para almacenar las relaciones
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateOption, setUpdateOption] = useState(null); // Nueva opción para seleccionar lo que se va a actualizar
  const [selectedRelationship, setSelectedRelationship] = useState(null); // Para almacenar la relación seleccionada

  // Obtener nodos por tipo
  const fetchNodes = async () => {
    const session = driver.session();
    try {
      console.log(`Buscando nodos del tipo: ${nodeType}`);
      const result = await session.run(`MATCH (n:${nodeType}) RETURN n`);

      const formattedNodes = result.records.map((record) => ({
        id: record.get("n").identity.low, // Neo4j maneja IDs como un objeto con `low`
        ...record.get("n").properties,
      }));

      console.log("Nodos obtenidos:", formattedNodes);
      setNodes(formattedNodes);
    } catch (error) {
      console.error("Error al obtener nodos:", error);
    } finally {
      await session.close();
    }
  };

  // Obtener propiedades de un nodo y sus relaciones
  const fetchNodeProperties = async (nodeId) => {
    const session = driver.session();
    try {
      console.log("Buscando propiedades del nodo:", nodeId);

      const result = await session.run(
        `MATCH (n)-[r]->(m) WHERE ID(n) = $id RETURN n, r, m`,
        { id: parseInt(nodeId) }
      );

      if (result.records.length === 0) {
        console.warn("No se encontraron propiedades para el nodo", nodeId);
        return;
      }

      const node = result.records[0].get("n");
      const relationships = result.records.map((record) => ({
        relationType: record.get("r").type,
        properties: record.get("r").properties,
        targetNode: record.get("m").properties,
        relationId: record.get("r").identity.low, // Capturamos el ID de la relación
      }));

      console.log("Propiedades del nodo:", node.properties);
      console.log("Relaciones del nodo:", relationships);

      setNodeProperties(node.properties);
      setNodeRelationships(relationships);
      setSelectedNode(nodeId);

      setUpdateOption(null); // Reiniciar opción de actualización cuando se selecciona un nodo
      setSelectedRelationship(null); // Reiniciar relación seleccionada
      setIsModalOpen(true); // Asegurarse de que el modal se abre
    } catch (error) {
      console.error("Error al obtener propiedades del nodo:", error);
    } finally {
      await session.close();
    }
  };

  // Manejar actualización de propiedades del nodo
  const handleUpdateProperties = async () => {
    const session = driver.session();
    try {
      const setClause = Object.keys(nodeProperties)
        .filter((key) => nodeProperties[key] !== "")
        .map((key) => `n.${key} = $${key}`)
        .join(", ");

      if (!setClause) {
        alert("No hay cambios para actualizar.");
        return;
      }

      const parameters = { id: selectedNode, ...nodeProperties };

      console.log(`Actualizando nodo ${selectedNode} con:`, nodeProperties);

      await session.run(
        `MATCH (n) WHERE ID(n) = $id
         SET ${setClause} 
         RETURN n`,
        parameters
      );

      alert("Propiedades del nodo actualizadas correctamente");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al actualizar propiedades del nodo:", error);
    } finally {
      await session.close();
    }
  };

  // Manejar actualización de relaciones del nodo
  const handleUpdateRelationships = async () => {
    if (!selectedRelationship) {
      alert("Selecciona una relación para actualizar.");
      return;
    }

    const session = driver.session();
    try {
      const relationSetClauses = `MATCH (n)-[r:${selectedRelationship.relationType}]->(m)
                                  WHERE ID(r) = $relId
                                  SET r = $relProperties`;

      const updatedProperties = selectedRelationship.properties;
      const parameters = {
        relId: selectedRelationship.relationId,
        relProperties: updatedProperties,
      };

      console.log("Actualizando relación con propiedades:", updatedProperties);

      await session.run(relationSetClauses, parameters);

      alert("Relación actualizada correctamente.");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al actualizar relaciones del nodo:", error);
      alert("Hubo un error al actualizar las relaciones.");
    } finally {
      await session.close();
    }
  };

  return (
    <div style={styles.container}>
      <h2>Actualizar Propiedades de Nodos</h2>

      <label style={styles.label}>Selecciona el tipo de nodo:</label>
      <select onChange={(e) => setNodeType(e.target.value)} value={nodeType} style={styles.select}>
        <option value="Persona:Cliente">Clientes</option>
        <option value="Cuenta">Cuentas</option>
        <option value="Dispositivo">Dispositivos</option>
        <option value="Establecimiento">Establecimientos</option>
        <option value="Persona">Personas</option>
        <option value="Transacción">Transacciones</option>
      </select>

      <button onClick={fetchNodes} style={styles.button}>Buscar Nodos</button>

      <ul style={styles.nodeList}>
        {nodes.map((node) => (
          <li key={node.id} onClick={() => fetchNodeProperties(node.id)} style={styles.nodeItem}
>
            Nodo {node.id}
          </li>
        ))}
      </ul>

      {isModalOpen && !updateOption && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>¿Qué deseas actualizar para el Nodo {selectedNode}?</h3>
            <button
              onClick={() => setUpdateOption("properties")}
              style={styles.button}
            >
              Actualizar propiedades del nodo
            </button>
            <button
              onClick={() => setUpdateOption("relationships")}
              style={styles.button}
            >
              Actualizar relaciones del nodo
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              style={styles.button}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {isModalOpen && updateOption === "properties" && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Editar Propiedades del Nodo {selectedNode}</h3>
            {Object.entries(nodeProperties).map(([key, value]) => (
              <div key={key}>
                <label>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    setNodeProperties({ ...nodeProperties, [key]: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
            ))}
            <button onClick={handleUpdateProperties} style={styles.button}>
              Actualizar propiedades
            </button>
            <button onClick={() => setIsModalOpen(false)} style={styles.button}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {isModalOpen && updateOption === "relationships" && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Selecciona una Relación del Nodo {selectedNode}</h3>
            <ul>
              {nodeRelationships.map((rel) => (
                <li
                  key={rel.relationId}
                  onClick={() => setSelectedRelationship(rel)}
                  style={styles.relationshipItem}
                >
                  Relación ID: {rel.relationId} - Tipo: {rel.relationType}
                </li>
              ))}
            </ul>

            {selectedRelationship && (
              <div>
                <h4>Propiedades de la Relación ID: {selectedRelationship.relationId}</h4>
                {Object.entries(selectedRelationship.properties).map(([key, value]) => (
                  <div key={key}>
                    <label>{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const updatedRelations = [...nodeRelationships];
                        updatedRelations.find(
                          (rel) => rel.relationId === selectedRelationship.relationId
                        ).properties[key] = e.target.value;
                        setNodeRelationships(updatedRelations);
                      }}
                      style={styles.input}
                    />
                  </div>
                ))}
                <button
                  onClick={handleUpdateRelationships}
                  style={styles.button}
                >
                  Actualizar relación
                </button>
              </div>
            )}

            <button onClick={() => setIsModalOpen(false)} style={styles.buttonClose}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos en línea para el modal y botones
// Estilos en línea para el modal, botones, y otros elementos
const styles = {
    container: {
      padding: "20px",
      fontFamily: "'Arial', sans-serif",
    },
    label: {
      fontSize: "16px",
      fontWeight: "bold",
    },
    select: {
      width: "100%",
      padding: "10px",
      margin: "10px 0",
      borderRadius: "5px",
      border: "1px solid #ddd",
      backgroundColor: "#f9f9f9",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    selectHover: {
      backgroundColor: "#f1f1f1",
    },
    button: {
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "none",
      padding: "10px 20px",
      margin: "10px 0",
      cursor: "pointer",
      borderRadius: "5px",
      transition: "background-color 0.3s",
    },
    buttonClose: {
      backgroundColor: "#f44336",
      color: "#fff",
      border: "none",
      padding: "10px 20px",
      margin: "10px 0",
      cursor: "pointer",
      borderRadius: "5px",
      transition: "background-color 0.3s",
    },
    nodeList: {
      listStyleType: "none",
      padding: "0",
    },
    nodeItem: {
      padding: "10px",
      margin: "5px 0",
      backgroundColor: "#f4f4f4",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.3s",
    },
    nodeItemHover: {
      backgroundColor: "#e2e2e2",
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      overflowY: "scroll",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "5px",
      width: "400px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    },
    relationshipItem: {
      padding: "10px",
      margin: "5px 0",
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.3s",
    },
    input: {
      width: "100%",
      padding: "8px",
      margin: "5px 0 10px",
      border: "1px solid #ddd",
      borderRadius: "5px",
      backgroundColor: "#f9f9f9",
    },
  };
  
export default UpdateNodesView;
