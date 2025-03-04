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

function DatabaseManager({ executeQuery, showOnlyQueries, showOnlyConsulta, showOnlyAggregates, showOnlyFilters, showOnlyAdvancedSearch }) {
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
        consultarUnNodo: (tipo, propiedad, valor) => `MATCH (n:${tipo}) WHERE n.${propiedad} = $valor RETURN n`,
        buscarPropietarioDispositivo: "MATCH (p:Persona)-[:USA]->(d:Dispositivo {ID: $valor}) RETURN p.Nombre as Nombre, p.DPI as DPI, d.ID as DispositivoID",
        buscarPropietarioTransaccion: "MATCH (cu:Cuenta)-[:REALIZA]->(t:Transacción {ID: $valor}) RETURN cu.ID as CuentaID, t.ID as TransaccionID",
    };

    const aggregateQueries = {
        countClientes: "MATCH (c:Cliente) RETURN COUNT(c) as TotalClientes",
        avgSaldoCuentas: "MATCH (c:Cuenta) RETURN AVG(c.Saldo) as PromedioSaldo",
        sumTransacciones: "MATCH (t:Transacción) RETURN SUM(t.Monto) as TotalMonto",
        maxTransaccion: "MATCH (t:Transacción) RETURN MAX(t.Monto) as MaximoMonto",
        minTransaccion: "MATCH (t:Transacción) RETURN MIN(t.Monto) as MinimoMonto",
        maxNivelRiesgo: "MATCH (c:Cliente) RETURN c.Nombre as Nombre, c.DPI as DPI, c.NivelRiesgo as NivelRiesgo ORDER BY c.NivelRiesgo DESC LIMIT 1",
        minNivelRiesgo: "MATCH (c:Cliente) RETURN c.Nombre as Nombre, c.DPI as DPI, c.NivelRiesgo as NivelRiesgo ORDER BY c.NivelRiesgo ASC LIMIT 1"
    };

    const filterQueries = {
        clientesAltoRiesgo: "MATCH (c:Cliente) WHERE toFloat(c.NivelRiesgo) > 2 RETURN c.Nombre as Nombre, c.DPI as DPI, c.NivelRiesgo as NivelRiesgo, c.FechaNacimiento as FechaNacimiento, c.Direccion as Direccion",
        clientesBajoRiesgo: "MATCH (c:Cliente) WHERE toFloat(c.NivelRiesgo) < 2 RETURN c.Nombre as Nombre, c.DPI as DPI, c.NivelRiesgo as NivelRiesgo, c.FechaNacimiento as FechaNacimiento, c.Direccion as Direccion",
        transaccionesAltoMonto: "MATCH (t:Transacción) WHERE toFloat(t.Monto) > 3500 RETURN t.ID as ID, t.Monto as Monto, t.Fecha as Fecha, t.Tipo as Tipo, t.Ubicacion as Ubicacion",
        transaccionesBajoMonto: "MATCH (t:Transacción) WHERE toFloat(t.Monto) < 1000 RETURN t.ID as ID, t.Monto as Monto, t.Fecha as Fecha, t.Tipo as Tipo, t.Ubicacion as Ubicacion",
        cuentasInactivas: "MATCH (c:Cuenta) WHERE c.Estado = false RETURN c.ID as ID, c.Tipo as Tipo, c.Saldo as Saldo, c.FechaCreacion as FechaCreacion, c.Estado as Estado",
        establecimientosRiesgosos: "MATCH (e:Establecimiento) WHERE toFloat(e.NivelRiesgo) > 2 RETURN e.ID as ID, e.Nombre as Nombre, e.Ubicacion as Ubicacion, e.Tipo as Tipo, e.NivelRiesgo as NivelRiesgo"
    };

    const advancedQueries = {
        buscarTransaccionPorID: "MATCH (p:Persona)-[:POSEE]->(c:Cuenta)-[:REALIZA]->(t:Transacción {ID: $valor}) RETURN p.Nombre, p.DPI",
        buscarPropietarioDispositivo: "MATCH (p:Persona)-[:USA]->(d:Dispositivo {ID: $valor}) RETURN p.Nombre as Nombre, p.DPI as DPI, d.ID as DispositivoID, d.FrecuenciaUso as FrecuenciaUso, d.UltimoUso as UltimoUso",
        buscarVisitasEstablecimiento: "MATCH (p:Persona)-[:VISITA]->(e:Establecimiento {ID: $valor}) RETURN p.Nombre as Nombre, e.Nombre as Establecimiento",
    };

    const handleQuery = async (query, params = {}) => {
        if (!query) {
            setError('Por favor, proporciona una consulta válida.');
            return;
        }

        const session = driver.session();
        try {
            // Verificar si la consulta es predefinida o avanzada
            const cypherQuery = predefinedQueries[query] || advancedQueries[query] || query;
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
        const tipoNodo = tipo.charAt(0).toUpperCase() + tipo.slice(1, -1);
        
        let returnClause;
        switch(tipoNodo) {
            case 'Cliente':
                returnClause = `n.Nombre as Nombre, 
                               (n.FechaNacimiento) as FechaNacimiento, 
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
            case 'Persona':
                returnClause = `n.DPI as DPI, 
                                n.Nombre as Nombre, 
                                n.FechaNacimiento as FechaNacimiento, 
                                n.Direccion as Direccion, 
                                n.NivelRiesgo as NivelRiesgo`;
                break;
            case 'Transacción':
                returnClause = `n.ID as ID, 
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

    const handleAggregateQuery = async (query) => {
        if (!query) {
            setError('Por favor, selecciona una consulta agregada válida.');
            return;
        }

        const session = driver.session();
        try {
            const cypherQuery = aggregateQueries[query];
            const result = await session.run(cypherQuery);
            const formattedResults = result.records.map(record => record.toObject());
            setResults(formattedResults);
            setError('');
        } catch (err) {
            console.error('Error al ejecutar la consulta agregada:', err);
            setError(err.message);
        } finally {
            await session.close();
        }
    };

    const handleFilterQuery = async (query) => {
        if (!query) {
            setError('Por favor, selecciona un filtro válido.');
            return;
        }

        const session = driver.session();
        try {
            const cypherQuery = filterQueries[query];
            const result = await session.run(cypherQuery);
            const formattedResults = result.records.map(record => record.toObject());
            setResults(formattedResults);
            setError('');
        } catch (err) {
            console.error('Error al ejecutar la consulta filtrada:', err);
            setError(err.message);
        } finally {
            await session.close();
        }
    };

    const handleAdvancedQuery = async (query, params = {}) => {
        console.log("handleAdvancedQuery llamada");

        if (!query) {
            setError('Por favor, proporciona una consulta avanzada válida.');
            return;
        }

        const session = driver.session();
        try {
            console.log("Consulta avanzada:", query);
            console.log("Parámetros:", params);

            const cypherQuery = advancedQueries[query];
            console.log("Consulta Cypher:", cypherQuery);

            const result = await session.run(cypherQuery, params);
            const formattedResults = result.records.map(record => record.toObject());
            setResults(formattedResults);
            setError('');
        } catch (err) {
            console.error('Error al ejecutar la consulta avanzada:', err);
            setError(err.message);
        } finally {
            await session.close();
        }
    };

    return (
        <Read 
            executeQuery={handleQuery} 
            consultarUnNodo={showOnlyConsulta ? handleConsultarUnNodo : undefined} 
            handleAggregateQuery={showOnlyAggregates ? handleAggregateQuery : undefined}
            handleFilterQuery={showOnlyFilters ? handleFilterQuery : undefined} 
            handleAdvancedQuery={showOnlyAdvancedSearch ? handleAdvancedQuery : undefined}
            results={results} 
            error={error}
            showOnlyQueries={showOnlyQueries} 
            showOnlyConsulta={showOnlyConsulta} 
            showOnlyAggregates={showOnlyAggregates}
            showOnlyFilters={showOnlyFilters} 
            showOnlyAdvancedSearch={showOnlyAdvancedSearch}
        />
    );
}

export default DatabaseManager;