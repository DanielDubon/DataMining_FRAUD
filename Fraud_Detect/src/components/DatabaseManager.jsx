import React, { useState } from 'react';
import { Container, Tab, Tabs, Box } from '@mui/material';
import driver from '../config/neo4jConfig';
import Read from './Read';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function DatabaseManager({ executeQuery, showOnlyQueries, showOnlyConsulta }) {
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const predefinedQueries = {
        clientes: "MATCH (c:Cliente) RETURN c.Nombre as Nombre, c.FechaNacimiento as FechaNacimiento, c.Direccion as Direccion, toString(c.DPI) as DPI, toString(c.NivelRiesgo) as NivelRiesgo",
        cuentas: "MATCH (c:Cuenta) RETURN toString(c.ID) as ID, c.Tipo as Tipo, c.Saldo as Saldo, c.FechaCreacion as FechaCreacion, c.Estado as Estado",
        dispositivos: "MATCH (d:Dispositivo) RETURN toString(d.ID) as ID, d.Tipo as Tipo, d.Ubicacion as Ubicacion, d.UsoFrecuente as UsoFrecuente, d.FechaRegistro as FechaRegistro",
        establecimientos: "MATCH (e:Establecimiento) RETURN toString(e.ID) as ID, e.Nombre as Nombre, e.Ubicacion as Ubicacion, e.Tipo as Tipo, toString(e.NivelRiesgo) as NivelRiesgo",
        personas: "MATCH (p:Persona) RETURN p.Nombre as Nombre, p.FechaNacimiento as FechaNacimiento, p.Direccion as Direccion, toString(p.NivelRiesgo) as NivelRiesgo, toString(p.DPI) as DPI",
        transacciones: "MATCH (t:Transacción) RETURN toString(t.ID) as ID, t.Monto as Monto, t.Fecha as Fecha, t.Ubicacion as Ubicacion, t.Tipo as Tipo",
        relacionesClientes: "MATCH (c:Cliente)-[r]->(n) RETURN c.Nombre as Cliente, type(r) as Relacion, n.Nombre as Relacionado, n.Tipo as TipoRelacionado",
        consultarUnNodo: (tipo, propiedad, valor) => `MATCH (n:${tipo}) WHERE n.${propiedad} = $valor RETURN n`
    };

    const handleQuery = async (query, params = {}) => {
        if (!query) {
            setError('Por favor, proporciona una consulta válida.');
            return;
        }

        const session = driver.session();
        try {
            // Si es una consulta predefinida, obtenerla del objeto predefinedQueries
            const cypherQuery = predefinedQueries[query] || query;
            const result = await session.run(cypherQuery, params);
            const formattedResults = result.records.map(record => record.toObject());
            setResults(formattedResults);
            setError('');
        } catch (err) {
            console.error('Error al ejecutar la consulta:', err);
            setError(err.message);
        } finally {
            await session.close();
        }
    };

    const handleConsultarUnNodo = async (tipo, propiedad, valor) => {
        // Convertir el tipo de nodo a formato correcto (primera letra mayúscula)
        const tipoNodo = tipo.charAt(0).toUpperCase() + tipo.slice(1, -1);
        
        let returnClause;
        switch(tipoNodo) {
            case 'Cliente':
                returnClause = `n.Nombre as Nombre, 
                               n.FechaNacimiento as FechaNacimiento, 
                               n.Direccion as Direccion, 
                               toString(n.DPI) as DPI, 
                               toString(n.NivelRiesgo) as NivelRiesgo`;
                break;
            case 'Cuenta':
                returnClause = `toString(n.ID) as ID, 
                               n.Tipo as Tipo, 
                               n.Saldo as Saldo, 
                               n.FechaCreacion as FechaCreacion, 
                               n.Estado as Estado`;
                break;
            case 'Dispositivo':
                returnClause = `toString(n.ID) as ID, 
                               n.Tipo as Tipo, 
                               n.Ubicacion as Ubicacion, 
                               n.UsoFrecuente as UsoFrecuente, 
                               n.FechaRegistro as FechaRegistro`;
                break;
            case 'Establecimiento':
                returnClause = `toString(n.ID) as ID, 
                               n.Nombre as Nombre, 
                               n.Ubicacion as Ubicacion, 
                               n.Tipo as Tipo, 
                               toString(n.NivelRiesgo) as NivelRiesgo`;
                break;
            case 'Transacción':
                returnClause = `toString(n.ID) as ID, 
                               n.Monto as Monto, 
                               n.Fecha as Fecha, 
                               n.Ubicacion as Ubicacion, 
                               n.Tipo as Tipo`;
                break;
            default:
                returnClause = '*';
        }

        const query = `MATCH (n:${tipoNodo}) 
                      WHERE toString(n.${propiedad}) = '${valor}' 
                      RETURN ${returnClause}`;
        try {
            await handleQuery(query);
        } catch (err) {
            setError('Error al consultar el nodo: ' + err.message);
        }
    };

    return (
        <Read 
            executeQuery={handleQuery} 
            consultarUnNodo={showOnlyConsulta ? handleConsultarUnNodo : undefined} 
            results={results} 
            error={error}
            showOnlyQueries={showOnlyQueries} 
            showOnlyConsulta={showOnlyConsulta} 
        />
    );
}

export default DatabaseManager;