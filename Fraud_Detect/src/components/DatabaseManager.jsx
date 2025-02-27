import React, { useState } from 'react';
import {
    Container,
    TextField,
    Button,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    ButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import driver from '../config/neo4jConfig';

function DatabaseManager() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const predefinedQueries = {
        clientes: "MATCH (c:Cliente) RETURN c",
        cuentas: "MATCH (c:Cuenta) RETURN c",
        dispositivos: "MATCH (d:Dispositivo) RETURN d",
        establecimientos: "MATCH (e:Establecimiento) RETURN e",
        personas: "MATCH (p:Persona) RETURN p",
        transacciones: "MATCH (t:Transaccion) RETURN t",
        relacionesClientes: "MATCH (c:Cliente)-[r]->(n) RETURN c, type(r), n",
    };

    const executeQuery = async (customQuery = null) => {
        const session = driver.session();
        try {
            const result = await session.run(customQuery || query);
            const formattedResults = result.records.map(record => {
                const obj = record.toObject();
                return Object.entries(obj).reduce((acc, [key, value]) => {
                    // Formatear los nodos y relaciones para mejor lectura
                    if (value && value.properties) {
                        acc[key] = {
                            type: value.labels ? value.labels[0] : value.type,
                            ...value.properties
                        };
                    } else {
                        acc[key] = value;
                    }
                    return acc;
                }, {});
            });
            setResults(formattedResults);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            await session.close();
        }
    };

    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        return `${dateObj.year.low}-${String(dateObj.month.low).padStart(2, '0')}-${String(dateObj.day.low).padStart(2, '0')}`;
    };

    const renderTableContent = (results) => {
        if (results.length === 0) return null;

        // Obtener todas las columnas únicas de todos los resultados
        const allColumns = new Set();
        results.forEach(result => {
            Object.entries(result).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    Object.keys(value).forEach(k => {
                        if (k !== 'type') allColumns.add(`${key}_${k}`);
                    });
                } else {
                    allColumns.add(key);
                }
            });
        });

        const columns = Array.from(allColumns);

        return (
            <TableContainer component={Paper} style={{ marginTop: '20px' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column} style={{ fontWeight: 'bold' }}>
                                    {column}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.map((result, index) => (
                            <TableRow key={index}>
                                {columns.map((column) => {
                                    const [parentKey, childKey] = column.split('_');
                                    let value = result[parentKey];

                                    if (childKey && value) {
                                        value = value[childKey];
                                    }

                                    // Formateo especial para fechas
                                    if (column === 'FechaNacimiento') {
                                        return (
                                            <TableCell key={column}>
                                                {formatDate(value)}
                                            </TableCell>
                                        );
                                    }

                                    // Manejo de diferentes tipos de valores
                                    if (typeof value === 'object' && value !== null) {
                                        value = JSON.stringify(value);
                                    }

                                    return (
                                        <TableCell key={column}>
                                            {value?.toString() || ''}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
                <Typography variant="h5" gutterBottom>
                    Base de Datos Neo4j
                </Typography>

                <Grid container spacing={2} style={{ marginBottom: '20px' }}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Consultas Disponibles
                        </Typography>
                        <ButtonGroup variant="contained" style={{ flexWrap: 'wrap', gap: '10px' }}>
                            <Button onClick={() => executeQuery(predefinedQueries.clientes)}>
                                Ver Clientes
                            </Button>
                            <Button onClick={() => executeQuery(predefinedQueries.cuentas)}>
                                Ver Cuentas
                            </Button>
                            <Button onClick={() => executeQuery(predefinedQueries.dispositivos)}>
                                Ver Dispositivos
                            </Button>
                            <Button onClick={() => executeQuery(predefinedQueries.establecimientos)}>
                                Ver Establecimientos
                            </Button>
                            <Button onClick={() => executeQuery(predefinedQueries.personas)}>
                                Ver Personas
                            </Button>
                            <Button onClick={() => executeQuery(predefinedQueries.transacciones)}>
                                Ver Transacciones
                            </Button>
                            <Button onClick={() => executeQuery(predefinedQueries.relacionesClientes)}>
                                Ver Relaciones de Clientes
                            </Button>
                        </ButtonGroup>
                    </Grid>
                </Grid>

                {error && (
                    <Typography color="error" style={{ marginTop: '10px' }}>
                        {error}
                    </Typography>
                )}

                {renderTableContent(results)}
            </Paper>
        </Container>
    );
}

export default DatabaseManager;