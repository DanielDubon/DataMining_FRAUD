import React, { useState } from 'react';
import { Container } from '@mui/material';
import driver from '../config/neo4jConfig';
import Read from './Read';

function DatabaseManager({ executeQuery }) {
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const predefinedQueries = {
        clientes: "MATCH (c:Cliente) RETURN c.Nombre as Nombre, c.FechaNacimiento as FechaNacimiento, c.Direccion as Direccion, toString(c.DPI) as DPI, toString(c.NivelRiesgo) as NivelRiesgo",
        cuentas: "MATCH (c:Cuenta) RETURN toString(c.ID) as ID, c.Tipo as Tipo, c.Saldo as Saldo, c.FechaCreacion as FechaCreacion, c.Estado as Estado",
        dispositivos: "MATCH (d:Dispositivo) RETURN toString(d.ID) as ID, d.Tipo as Tipo, d.Ubicacion as Ubicacion, d.UsoFrecuente as UsoFrecuente, d.FechaRegistro as FechaRegistro",
        establecimientos: "MATCH (e:Establecimiento) RETURN toString(e.ID) as ID, e.Nombre as Nombre, e.Ubicacion as Ubicacion, e.Tipo as Tipo, toString(e.NivelRiesgo) as NivelRiesgo",
        personas: "MATCH (p:Persona) RETURN p.Nombre as Nombre, p.FechaNacimiento as FechaNacimiento, p.Direccion as Direccion, toString(p.NivelRiesgo) as NivelRiesgo, toString(p.DPI) as DPI",
        transacciones: "MATCH (t:Transacción) RETURN toString(t.ID) as ID, t.Monto as Monto, t.Fecha as Fecha, t.Ubicacion as Ubicacion, t.Tipo as Tipo",
        relacionesClientes: "MATCH (c:Cliente)-[r]->(n) RETURN c.Nombre as Cliente, type(r) as Relacion, n.Nombre as Relacionado, n.Tipo as TipoRelacionado"
    };

    const handleQuery = async (selectedQuery) => {
        if (!selectedQuery) {
            setError('Por favor, selecciona una consulta.');
            return;
        }

        const session = driver.session();
        try {
            const result = await session.run(predefinedQueries[selectedQuery]);
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

    return (
        <Container>
            <Read executeQuery={handleQuery} results={results} error={error} />
        </Container>
    );
}

export default DatabaseManager;