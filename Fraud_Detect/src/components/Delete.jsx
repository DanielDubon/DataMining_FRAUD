import React, { useState } from "react";
import driver from "../config/neo4jConfig";

const DeleteNodesView = () => {
  const [nodeType, setNodeType] = useState("Clientes");
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeProperties, setNodeProperties] = useState([]);
  const [nodeRelationships, setNodeRelationships] = useState([]);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isNodePropertiesModalOpen, setIsNodePropertiesModalOpen] = useState(false);
  const [isRelationshipsModalOpen, setIsRelationshipsModalOpen] = useState(false);
  const [isRelationshipPropertiesModalOpen, setIsRelationshipPropertiesModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [selectedRelationshipProperty, setSelectedRelationshipProperty] = useState(null);

  // Fetch nodes by type
  const fetchNodes = async () => {
    const session = driver.session();
    try {
      const result = await session.run(`MATCH (n:${nodeType}) RETURN n`);
      const formattedNodes = result.records.map((record) => ({
        id: record.get("n").identity.low,
        ...record.get("n").properties,
      }));
      setNodes(formattedNodes);
    } catch (error) {
      console.error("Error al obtener nodos:", error);
      alert("Error al obtener nodos");
    } finally {
      await session.close();
    }
  };

  // Fetch detailed node properties and relationships
  const fetchNodeProperties = async (nodeId) => {
    const session = driver.session();
    try {
      // Fetch node properties
      const nodeResult = await session.run(
        `MATCH (n) WHERE ID(n) = $id RETURN n`,
        { id: parseInt(nodeId) }
      );
      const node = nodeResult.records[0].get("n");
      
      // Fetch all relationships (both incoming and outgoing)
      const relationshipsResult = await session.run(
        `MATCH (n)-[r]-(m) WHERE ID(n) = $id RETURN r, m, labels(m) AS targetLabels`,
        { id: parseInt(nodeId) }
      );

      const relationships = relationshipsResult.records.map((record) => ({
        relationType: record.get("r").type,
        properties: record.get("r").properties,
        relationId: record.get("r").identity.low,
        targetNode: record.get("m").properties,
        targetLabels: record.get("targetLabels").map(label => label.toString())
      }));

      setNodeProperties(Object.keys(node.properties));
      setNodeRelationships(relationships);
      setSelectedNode(nodeId);
      setIsNodeModalOpen(true);
    } catch (error) {
      console.error("Error al obtener propiedades del nodo:", error);
      alert("Error al obtener propiedades del nodo");
    } finally {
      await session.close();
    }
  };

  // Delete node with all relationships
  const handleDeleteNode = async () => {
    if (!window.confirm("¿Estás seguro de eliminar este nodo y todas sus relaciones?")) return;

    const session = driver.session();
    try {
      await session.run(
        `MATCH (n) WHERE ID(n) = $id
         DETACH DELETE n`,
        { id: parseInt(selectedNode) }
      );
      
      alert("Nodo y sus relaciones eliminados correctamente");
      setIsNodeModalOpen(false);
      fetchNodes(); // Refresh the list of nodes
    } catch (error) {
      console.error("Error al borrar el nodo:", error);
      alert("Hubo un error al borrar el nodo.");
    } finally {
      await session.close();
    }
  };

  // Delete a specific node property
  const handleDeleteNodeProperty = async () => {
    if (!selectedProperty) return;

    const session = driver.session();
    try {
      await session.run(
        `MATCH (n) WHERE ID(n) = $id REMOVE n.${selectedProperty}`,
        { id: parseInt(selectedNode) }
      );
      alert(`Propiedad ${selectedProperty} borrada correctamente.`);
      
      // Refresh node properties
      fetchNodeProperties(selectedNode);
      setIsNodePropertiesModalOpen(false);
    } catch (error) {
      console.error("Error al borrar la propiedad del nodo:", error);
      alert("Hubo un error al borrar la propiedad del nodo.");
    } finally {
      await session.close();
    }
  };

  // Delete a specific relationship
  const handleDeleteRelationship = async () => {
    if (!selectedRelationship) return;

    const session = driver.session();
    try {
      await session.run(
        `MATCH ()-[r]->() WHERE ID(r) = $relId DELETE r`,
        { relId: parseInt(selectedRelationship.relationId) }
      );
      
      alert("Relación borrada correctamente.");
      
      // Refresh relationships
      fetchNodeProperties(selectedNode);
      setIsRelationshipsModalOpen(false);
    } catch (error) {
      console.error("Error al borrar la relación:", error);
      alert("Hubo un error al borrar la relación.");
    } finally {
      await session.close();
    }
  };

  // Delete a specific relationship property
  const handleDeleteRelationshipProperty = async () => {
    if (!selectedRelationshipProperty) return;

    const session = driver.session();
    try {
      await session.run(
        `MATCH ()-[r]->() WHERE ID(r) = $relId REMOVE r.${selectedRelationshipProperty}`,
        { relId: parseInt(selectedRelationship.relationId) }
      );
      
      alert(`Propiedad ${selectedRelationshipProperty} de la relación borrada correctamente.`);
      
      // Refresh relationships
      fetchNodeProperties(selectedNode);
      setIsRelationshipPropertiesModalOpen(false);
    } catch (error) {
      console.error("Error al borrar la propiedad de la relación:", error);
      alert("Hubo un error al borrar la propiedad de la relación.");
    } finally {
      await session.close();
    }
  };

  return (
    <div style={styles.container}>
  <h2>Borrar Nodos y Relaciones</h2>

  <label style={styles.label}>Selecciona el tipo de nodo:</label>
  <select 
    onChange={(e) => setNodeType(e.target.value)} 
    value={nodeType} 
    style={styles.select}
  >
    <option value="Persona:Cliente">Clientes</option>
    <option value="Cuenta">Cuentas</option>
    <option value="Dispositivo">Dispositivos</option>
    <option value="Establecimiento">Establecimientos</option>
    <option value="Persona">Personas</option>
    <option value="Transacción">Transacciones</option>
  </select>

  <button onClick={fetchNodes} style={styles.button}>Buscar Nodos</button>

  <ul>
    {nodes.map((node) => (
      <li key={node.id} onClick={() => fetchNodeProperties(node.id)}>
        Nodo {node.id}
      </li>
    ))}
  </ul>

  {/* Modal for Node Actions */}
  {isNodeModalOpen && (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3>Acciones para el Nodo {selectedNode}</h3>
        <button onClick={() => setIsNodePropertiesModalOpen(true)} style={styles.greenButton}>
          Borrar propiedades del nodo
        </button>
        <button onClick={handleDeleteNode} style={styles.redButton}>
          Borrar nodo completo
        </button>
        <button onClick={() => setIsRelationshipsModalOpen(true)} style={styles.orangeButton}>
          Borrar relaciones
        </button>
        <button onClick={() => setIsRelationshipPropertiesModalOpen(true)} style={styles.blueButton}>
          Borrar propiedades de relaciones
        </button>
        <button onClick={() => setIsNodeModalOpen(false)} style={styles.grayButton}>
          Cerrar
        </button>
      </div>
    </div>
  )}

  {/* Modal for Node Properties Deletion */}
  {isNodePropertiesModalOpen && (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3>Propiedades del Nodo {selectedNode}</h3>
        <ul>
          {nodeProperties.map((property) => (
            <li 
              key={property} 
              onClick={() => setSelectedProperty(property)}
              style={selectedProperty === property ? styles.selectedItem : {}}
            >
              {property}
            </li>
          ))}
        </ul>
        {selectedProperty && (
          <button 
            onClick={handleDeleteNodeProperty} 
            style={styles.redButton}
          >
            Borrar Propiedad {selectedProperty}
          </button>
        )}
        <button 
          onClick={() => setIsNodePropertiesModalOpen(false)} 
          style={styles.grayButton}
        >
          Cerrar
        </button>
      </div>
    </div>
  )}

  {/* Modal for Relationships Deletion */}
  {isRelationshipsModalOpen && (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3>Relaciones del Nodo {selectedNode}</h3>
        <ul>
          {nodeRelationships.map((rel) => (
            <li 
              key={rel.relationId} 
              onClick={() => setSelectedRelationship(rel)}
              style={selectedRelationship === rel ? styles.selectedItem : {}}
            >
              ID: {rel.relationId} 
              | Tipo: {rel.relationType}
              | Destino: {rel.targetLabels.join(', ')}
            </li>
          ))}
        </ul>
        {selectedRelationship && (
          <button 
            onClick={handleDeleteRelationship} 
            style={styles.redButton}
          >
            Borrar Relación
          </button>
        )}
        <button 
          onClick={() => setIsRelationshipsModalOpen(false)} 
          style={styles.grayButton}
        >
          Cerrar
        </button>
      </div>
    </div>
  )}

  {/* Modal for Relationship Properties Deletion */}
  {isRelationshipPropertiesModalOpen && (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3>Propiedades de Relaciones del Nodo {selectedNode}</h3>
        {nodeRelationships.map((rel) => (
          <div key={rel.relationId}>
            <h4>Relación ID: {rel.relationId} - Tipo: {rel.relationType}</h4>
            <ul>
              {Object.keys(rel.properties).map((property) => (
                <li 
                  key={property} 
                  onClick={() => {
                    setSelectedRelationship(rel);
                    setSelectedRelationshipProperty(property);
                  }}
                  style={
                    selectedRelationship === rel && 
                    selectedRelationshipProperty === property 
                      ? styles.selectedItem 
                      : {}
                  }
                >
                  {property}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {selectedRelationshipProperty && (
          <button 
            onClick={handleDeleteRelationshipProperty} 
            style={styles.redButton}
          >
            Borrar Propiedad {selectedRelationshipProperty}
          </button>
        )}
        <button 
          onClick={() => setIsRelationshipPropertiesModalOpen(false)} 
          style={styles.grayButton}
        >
          Cerrar
        </button>
      </div>
    </div>
  )}
</div>
  );
};

const styles = {
    blueButton: {
      padding: "10px 20px",
      margin: "10px",
      backgroundColor: "#007BFF",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    greenButton: {
      padding: "10px 20px",
      margin: "10px",
      backgroundColor: "#28A745",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    redButton: {
      padding: "10px 20px",
      margin: "10px",
      backgroundColor: "#DC3545",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    orangeButton: {
      padding: "10px 20px",
      margin: "10px",
      backgroundColor: "#FD7E14",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    grayButton: {
      padding: "10px 20px",
      margin: "10px",
      backgroundColor: "#6C757D",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      overflowY: "scroll",
    },
    modalContent: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "5px",
      width: "80%",
      maxWidth: "600px",
      maxHeight: "80%",
      overflowY: "auto",
    },
    selectedItem: {
      backgroundColor: "#e0e0e0",
      fontWeight: "bold",
    },
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
  };

export default DeleteNodesView;