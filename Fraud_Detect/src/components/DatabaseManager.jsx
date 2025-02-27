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
        clientes: "MATCH (c:Cliente) RETURN c.Nombre as Nombre, c.FechaNacimiento as FechaNacimiento, c.Direccion as Direccion, toString(c.DPI) as DPI, c.NivelRiesgo as NivelRiesgo",
        cuentas: "MATCH (c:Cuenta) RETURN c.NumeroCuenta as NumeroCuenta, c.Tipo as Tipo, c.Saldo as Saldo",
        dispositivos: "MATCH (d:Dispositivo) RETURN d.ID as ID, d.Tipo as Tipo, d.IP as IP, d.Sistema as Sistema, d.Ubicacion as Ubicacion",
        establecimientos: "MATCH (e:Establecimiento) RETURN e.ID as ID, e.Nombre as Nombre, e.Direccion as Direccion, e.Tipo as Tipo, e.Categoria as Categoria",
        personas: "MATCH (p:Persona) RETURN p.Nombre as Nombre, p.FechaNacimiento as FechaNacimiento, p.Direccion as Direccion, p.NivelRiesgo as NivelRiesgo, toString(p.DPI) as DPI",
        transacciones: "MATCH (t:Transacción) RETURN t.ID as ID, t.Monto as Monto, t.Fecha as Fecha, t.Ubicacion as Ubicacion, t.Tipo as Tipo",
        relacionesClientes: "MATCH (c:Cliente)-[r]->(n) RETURN c.Nombre as Cliente, type(r) as Relacion, n.Nombre as Relacionado, n.Tipo as TipoRelacionado"
    };

    const executeQuery = async (customQuery = null) => {
        const session = driver.session();
        try {
            const result = await session.run(customQuery || query);
            console.log("Resultados de la consulta:", result.records); // Depuración
            const formattedResults = result.records.map(record => {
                const obj = record.toObject();
                return Object.entries(obj).reduce((acc, [key, value]) => {
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
            console.error("Error en la consulta:", err); // Depuración
            setError(err.message);
        } finally {
            await session.close();
        }
    };

    const formatDate = (dateObj) => {
        if (!dateObj || !dateObj.year || !dateObj.month || !dateObj.day) return '';
        const year = dateObj.year.low;
        const month = String(dateObj.month.low).padStart(2, '0');
        const day = String(dateObj.day.low).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatValue = (value, columnName) => {
        if (value === null || value === undefined || value === '') return 'N/A'; // Mostrar 'N/A' si el valor está vacío
    
        if (columnName.includes('Fecha')) {
            return formatDate(value);
        }
    
        if (columnName.includes('DPI')) {
            if (typeof value === 'string') {
                return value;
            }
            if (typeof value === 'number') {
                return value.toString();
            }
            if (typeof value === 'object' && 'low' in value) {
                return value.low.toString();
            }
            return value;
        }
    
        if (['Saldo', 'Monto', 'NivelRiesgo', 'ID'].some(field => columnName.includes(field))) {
            if (typeof value === 'object' && 'low' in value) {
                return value.low;
            }
            return value;
        }
    
        if (typeof value === 'object') {
            if ('properties' in value) {
                return Object.values(value.properties).join(', ');
            }
            if ('low' in value) {
                return value.low;
            }
            return Object.values(value).filter(v => v !== null && v !== undefined && v !== '').join(', ');
        }
    
        return value.toString();
    };

    const renderTableContent = (results) => {
        if (results.length === 0) {
            return (
                <Typography variant="body1" style={{ marginTop: '20px' }}>
                    No se encontraron resultados.
                </Typography>
            );
        }
    
        const allColumns = new Set();
        results.forEach(result => {
            Object.keys(result).forEach(key => {
                if (result[key] !== null && result[key] !== undefined) {
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
                                {columns.map((column) => (
                                    <TableCell key={column}>
                                        {formatValue(result[column], column)}
                                    </TableCell>
                                ))}
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