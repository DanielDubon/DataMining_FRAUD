import React, { useState } from 'react';
import {
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';

function Read({ executeQuery, consultarUnNodo, handleAggregateQuery, results, error, showOnlyQueries, showOnlyConsulta, showOnlyAggregates }) {
    const [selectedQuery, setSelectedQuery] = useState('');
    const [tipoNodo, setTipoNodo] = useState('clientes');
    const [propiedad, setPropiedad] = useState('');
    const [valor, setValor] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedAggregateQuery, setSelectedAggregateQuery] = useState('');

    // Mapeo de propiedades por tipo de nodo
    const propiedadesPorTipo = {
        clientes: ['DPI', 'Nombre', 'FechaNacimiento', 'Direccion', 'NivelRiesgo'],
        cuentas: ['ID', 'Tipo', 'Saldo', 'FechaCreacion', 'Estado'],
        dispositivos: ['ID', 'Tipo', 'Ubicacion', 'UsoFrecuente', 'FechaRegistro'],
        establecimientos: ['ID', 'Nombre', 'Ubicacion', 'Tipo', 'NivelRiesgo'],
        personas: ['DPI', 'Nombre', 'FechaNacimiento', 'Direccion', 'NivelRiesgo'],
        transacciones: ['ID', 'Monto', 'Fecha', 'Ubicacion', 'Tipo']
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }
        if (typeof value === 'object' && value !== null) {
            if ('year' in value) {
                return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}:${value.second}`;
            }
            return JSON.stringify(value);
        }
        return value.toString();
    };

    const handleConsultarUnNodo = () => {
        setHasSearched(true);
        consultarUnNodo(tipoNodo, propiedad, valor);
    };

    const handleExecuteQuery = () => {
        setHasSearched(true);
        executeQuery(selectedQuery);
    };

    return (
        <Paper elevation={3} style={{ padding: '30px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
            {showOnlyQueries && (
                <>
                    <Typography variant="h5" gutterBottom style={{ color: '#333', fontWeight: 'bold', marginBottom: '20px' }}>
                        Operaciones de Lectura
                    </Typography>
                    <FormControl fullWidth style={{ marginBottom: '20px' }}>
                        <InputLabel>Selecciona una consulta</InputLabel>
                        <Select
                            value={selectedQuery}
                            onChange={(e) => setSelectedQuery(e.target.value)}
                        >
                            <MenuItem value="clientes">Ver Clientes</MenuItem>
                            <MenuItem value="cuentas">Ver Cuentas</MenuItem>
                            <MenuItem value="dispositivos">Ver Dispositivos</MenuItem>
                            <MenuItem value="establecimientos">Ver Establecimientos</MenuItem>
                            <MenuItem value="personas">Ver Personas</MenuItem>
                            <MenuItem value="transacciones">Ver Transacciones</MenuItem>
                            <MenuItem value="relacionesClientes">Ver Relaciones de Clientes</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleExecuteQuery}
                        style={{ marginBottom: '20px' }}
                    >
                        Buscar
                    </Button>
                </>
            )}

            {showOnlyConsulta && (
                <>
                    <Typography variant="h5" gutterBottom style={{ color: '#333', fontWeight: 'bold', marginBottom: '20px' }}>
                        Consultar un Nodo
                    </Typography>
                    <FormControl component="fieldset" style={{ marginBottom: '20px' }}>
                        <RadioGroup
                            row
                            value={tipoNodo}
                            onChange={(e) => {
                                setTipoNodo(e.target.value);
                                setPropiedad(''); // Resetear propiedad al cambiar tipo de nodo
                            }}
                        >
                            <FormControlLabel value="clientes" control={<Radio />} label="Clientes" />
                            <FormControlLabel value="cuentas" control={<Radio />} label="Cuentas" />
                            <FormControlLabel value="dispositivos" control={<Radio />} label="Dispositivos" />
                            <FormControlLabel value="establecimientos" control={<Radio />} label="Establecimientos" />
                            <FormControlLabel value="personas" control={<Radio />} label="Personas" />
                            <FormControlLabel value="transacciones" control={<Radio />} label="Transacciones" />
                        </RadioGroup>
                    </FormControl>
                    <FormControl fullWidth style={{ marginBottom: '20px' }}>
                        <InputLabel>Propiedad</InputLabel>
                        <Select
                            value={propiedad}
                            onChange={(e) => setPropiedad(e.target.value)}
                        >
                            {propiedadesPorTipo[tipoNodo].map((prop) => (
                                <MenuItem key={prop} value={prop}>{prop}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Valor"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        fullWidth
                        style={{ marginBottom: '20px' }}
                    />
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleConsultarUnNodo}
                        style={{ marginBottom: '20px' }}
                    >
                        Consultar un Nodo
                    </Button>
                </>
            )}

            {showOnlyAggregates && (
                <>
                    <Typography variant="h5" gutterBottom style={{ color: '#333', fontWeight: 'bold', marginBottom: '20px' }}>
                        Operaciones Agregadas
                    </Typography>
                    <FormControl fullWidth style={{ marginBottom: '20px' }}>
                        <InputLabel>Selecciona una consulta agregada</InputLabel>
                        <Select
                            value={selectedAggregateQuery}
                            onChange={(e) => setSelectedAggregateQuery(e.target.value)}
                        >
                            <MenuItem value="countClientes">Contar Clientes</MenuItem>
                            <MenuItem value="avgSaldoCuentas">Promedio de Saldo de Cuentas</MenuItem>
                            <MenuItem value="sumTransacciones">Suma de Montos de Transacciones</MenuItem>
                            <MenuItem value="maxTransaccion">Máximo Monto de Transacción</MenuItem>
                            <MenuItem value="minTransaccion">Mínimo Monto de Transacción</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleAggregateQuery(selectedAggregateQuery)}
                        style={{ marginBottom: '20px' }}
                    >
                        Ejecutar Consulta Agregada
                    </Button>
                </>
            )}

            {error && (
                <Typography color="error" style={{ marginTop: '10px' }}>
                    {error}
                </Typography>
            )}
            {results.length > 0 ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {Object.keys(results[0]).map((key) => (
                                    <TableCell key={key}>{key}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.map((row, index) => (
                                <TableRow key={index}>
                                    {Object.values(row).map((value, idx) => (
                                        <TableCell key={idx}>{formatValue(value)}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : hasSearched ? (
                <Typography>No se encontraron resultados.</Typography>
            ) : null}
        </Paper>
    );
}

export default Read;