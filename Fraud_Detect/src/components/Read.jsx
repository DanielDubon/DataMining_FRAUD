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
    TableRow
} from '@mui/material';

function Read({ executeQuery, results, error }) {
    const [selectedQuery, setSelectedQuery] = useState('');

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

    return (
        <Paper elevation={3} style={{ padding: '30px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
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
                onClick={() => executeQuery(selectedQuery)}
                style={{ marginBottom: '20px' }}
            >
                Buscar
            </Button>
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
            ) : (
                <Typography>No se encontraron resultados.</Typography>
            )}
        </Paper>
    );
}

export default Read;
