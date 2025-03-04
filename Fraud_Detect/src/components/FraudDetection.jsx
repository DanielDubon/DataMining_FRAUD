import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

function FraudDetection({ executeQuery, tabValue }) {
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const fraudQueries = {
        transaccionesSospechosas: "MATCH (t:Transacción) WHERE t.Monto > 10000 RETURN t.ID as ID, t.Monto as Monto, t.Fecha as Fecha, t.Ubicacion as Ubicacion, t.Tipo as Tipo",
        clientesMultiplesCuentas: "MATCH (c:Cliente)-[:POSEE]->(cu:Cuenta) WITH c, COUNT(cu) as numCuentas WHERE numCuentas > 3 RETURN c.Nombre as Nombre, c.DPI as DPI, numCuentas",
        dispositivosFrecuentes: `
            MATCH (d:Dispositivo)-[:USADO_EN]->(l:Ubicacion)
            WITH d, COLLECT(l.Nombre) as ubicaciones, COUNT(DISTINCT l) as numUbicaciones
            WHERE numUbicaciones > 5
            RETURN d.ID as ID, d.Tipo as Tipo, d.UsoFrecuente as UsoFrecuente, d.FechaRegistro as FechaRegistro, numUbicaciones, ubicaciones
        `
    };

    useEffect(() => {
        const handleFraudQuery = async () => {
            const queryKeys = ['transaccionesSospechosas', 'clientesMultiplesCuentas', 'dispositivosFrecuentes'];
            const query = fraudQueries[queryKeys[tabValue]];
            if (!query) {
                setError('Consulta no válida.');
                return;
            }
            try {
                const result = await executeQuery(query);
                const formattedResults = result.records.map(record => {
                    const obj = record.toObject();
                    // Convertir valores a enteros o flotantes
                    for (let key in obj) {
                        if (typeof obj[key] === 'object' && obj[key].low !== undefined) {
                            obj[key] = obj[key].low; // o parseFloat(obj[key].low) si es necesario
                        }
                    }
                    // Convertir FechaRegistro a un formato legible
                    if (obj.FechaRegistro) {
                        const { year, month, day } = obj.FechaRegistro;
                        obj.FechaRegistro = `${year.low}-${month.low.toString().padStart(2, '0')}-${day.low.toString().padStart(2, '0')}`;
                    }
                    return obj;
                });
                setResults(formattedResults);
                setError('');
            } catch (err) {
                console.error('Error al ejecutar la consulta de fraude:', err);
                setError(err.message);
            }
        };

        handleFraudQuery();
    }, [tabValue, executeQuery]);

    return (
        <Box sx={{ display: 'flex' }}>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" gutterBottom>
                    Detección de Fraude
                </Typography>
                {error && <Typography color="error">{error}</Typography>}
                <Box>
                    {results.map((result, index) => (
                        <Typography key={index}>{JSON.stringify(result)}</Typography>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

export default FraudDetection;
