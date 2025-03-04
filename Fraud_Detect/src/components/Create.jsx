import React, { useState } from 'react';
import {
    Paper,
    Typography,
    FormControl,
    FormControlLabel,
    Checkbox,
    TextField,
    Button,
    Grid,
    Select,
    MenuItem,
    InputLabel,
    FormGroup,
    Alert
} from '@mui/material';

function Create({ executeQuery }) {
    const [selectedNodes, setSelectedNodes] = useState([]);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const nodeTypes = {
        Persona: {
            labels: ['Persona'],
            additionalLabels: ['Cliente', 'NoCliente'],
            properties: {
                DPI: { type: 'string', required: true },
                Nombre: { type: 'string', required: true },
                FechaNacimiento: { type: 'date', required: true },
                Direccion: { type: 'string', required: true },
                NivelRiesgo: { type: 'number', required: true, min: 1, max: 3 }
            }
        },
        Cuenta: {
            labels: ['Cuenta'],
            additionalLabels: ['Interna', 'Externa'],
            properties: {
                ID: { type: 'number', required: true },
                Tipo: { type: 'select', options: ['Ahorro', 'Corriente'], required: true },
                Saldo: { type: 'number', required: true },
                FechaCreacion: { type: 'date', required: true },
                Estado: { type: 'boolean', required: true }
            }
        },
        Transaccion: {
            labels: ['Transaccion'],
            properties: {
                ID: { type: 'number', required: true },
                Monto: { type: 'number', required: true },
                Fecha: { type: 'datetime', required: true },
                Ubicacion: { type: 'string', required: true },
                Tipo: { type: 'select', options: ['Retiro', 'Depósito', 'Pago', 'Transferencia'], required: true }
            }
        },
        Dispositivo: {
            labels: ['Dispositivo'],
            properties: {
                ID: { type: 'number', required: true },
                Tipo: { type: 'select', options: ['Móvil', 'Computadora', 'Cajero'], required: true },
                Ubicacion: { type: 'string', required: true },
                UsoFrecuente: { type: 'boolean', required: true },
                FechaRegistro: { type: 'date', required: true }
            }
        },
        Establecimiento: {
            labels: ['Establecimiento'],
            properties: {
                ID: { type: 'number', required: true },
                Nombre: { type: 'string', required: true },
                Ubicacion: { type: 'string', required: true },
                Tipo: { type: 'select', options: ['Supermercado', 'Gasolinera', 'Tienda', 'Centro Comercial', 'Restaurante'], required: true },
                NivelRiesgo: { type: 'number', required: true, min: 1, max: 3 }
            }
        }
    };

    const handleNodeSelection = (nodeName) => {
        const isSelected = selectedNodes.includes(nodeName);
        if (isSelected) {
            setSelectedNodes(selectedNodes.filter(n => n !== nodeName));
            const newFormData = { ...formData };
            delete newFormData[nodeName];
            setFormData(newFormData);
        } else {
            setSelectedNodes([...selectedNodes, nodeName]);
            setFormData({
                ...formData,
                [nodeName]: {
                    additionalLabels: [],
                    properties: {}
                }
            });
        }
    };

    const handlePropertyChange = (nodeName, propertyName, value) => {
        const processedValue = propertyName === 'ID' ?
            (value === '' ? '' : parseInt(value, 10)) : value;

        setFormData({
            ...formData,
            [nodeName]: {
                ...formData[nodeName],
                properties: {
                    ...formData[nodeName]?.properties,
                    [propertyName]: processedValue
                }
            }
        });
    };

    const handleAdditionalLabelChange = (nodeName, label) => {
        const currentLabels = formData[nodeName]?.additionalLabels || [];
        const newLabels = currentLabels.includes(label)
            ? currentLabels.filter(l => l !== label)
            : [...currentLabels, label];

        setFormData({
            ...formData,
            [nodeName]: {
                ...formData[nodeName],
                additionalLabels: newLabels
            }
        });
    };

    const generateCypherQuery = () => {
        const queries = selectedNodes.map(nodeName => {
            const nodeData = formData[nodeName];
            const allLabels = [
                ...nodeTypes[nodeName].labels,
                ...nodeData.additionalLabels
            ].join(':');

            const properties = Object.entries(nodeData.properties)
                .map(([key, value]) => {
                    if (nodeTypes[nodeName].properties[key].type === 'date' ||
                        nodeTypes[nodeName].properties[key].type === 'datetime') {
                        return `${key}: date('${value}')`;
                    }
                    if (key === 'ID') {
                        return `${key}: ${value}`;
                    }
                    if (typeof value === 'string') {
                        return `${key}: '${value}'`;
                    }
                    return `${key}: ${value}`;
                })
                .join(', ');

            return `CREATE (n:${allLabels} {${properties}})`;
        });

        return queries.join('\n');
    };

    const handleSubmit = async () => {
        try {
            const query = generateCypherQuery();
            await executeQuery(query);
            setSuccess('Nodo(s) creado(s) exitosamente');
            setError('');
            setFormData({});
            setSelectedNodes([]);
        } catch (err) {
            setError(err.message);
            setSuccess('');
        }
    };

    return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h5" gutterBottom>
                Crear Nuevo(s) Nodo(s)
            </Typography>

            <FormGroup>
                <Typography variant="h6" gutterBottom>
                    Seleccionar Tipo(s) de Nodo
                </Typography>
                <Grid container spacing={2}>
                    {Object.keys(nodeTypes).map((nodeName) => (
                        <Grid item xs={12} sm={6} md={4} key={nodeName}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedNodes.includes(nodeName)}
                                        onChange={() => handleNodeSelection(nodeName)}
                                    />
                                }
                                label={nodeName}
                            />
                        </Grid>
                    ))}
                </Grid>
            </FormGroup>

            {selectedNodes.map((nodeName) => (
                <div key={nodeName} style={{ marginTop: '20px' }}>
                    <Typography variant="h6">
                        Configurar {nodeName}
                    </Typography>

                    {nodeTypes[nodeName].additionalLabels && (
                        <FormGroup row style={{ marginBottom: '20px' }}>
                            <Typography variant="subtitle1">Labels Adicionales:</Typography>
                            {nodeTypes[nodeName].additionalLabels.map((label) => (
                                <FormControlLabel
                                    key={label}
                                    control={
                                        <Checkbox
                                            checked={formData[nodeName]?.additionalLabels?.includes(label)}
                                            onChange={() => handleAdditionalLabelChange(nodeName, label)}
                                        />
                                    }
                                    label={label}
                                />
                            ))}
                        </FormGroup>
                    )}

                    <Grid container spacing={2}>
                        {Object.entries(nodeTypes[nodeName].properties).map(([propName, propConfig]) => (
                            <Grid item xs={12} sm={6} md={4} key={propName}>
                                {propConfig.type === 'select' ? (
                                    <FormControl fullWidth>
                                        <InputLabel>{propName}</InputLabel>
                                        <Select
                                            value={formData[nodeName]?.properties[propName] || ''}
                                            onChange={(e) => handlePropertyChange(nodeName, propName, e.target.value)}
                                            required={propConfig.required}
                                        >
                                            {propConfig.options.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : propConfig.type === 'date' || propConfig.type === 'datetime' ? (
                                    <TextField
                                        fullWidth
                                        label={propName}
                                        type="date"
                                        value={formData[nodeName]?.properties[propName] || ''}
                                        onChange={(e) => handlePropertyChange(nodeName, propName, e.target.value)}
                                        required={propConfig.required}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                ) : propConfig.type === 'boolean' ? (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData[nodeName]?.properties[propName] || false}
                                                onChange={(e) => handlePropertyChange(nodeName, propName, e.target.checked)}
                                            />
                                        }
                                        label={propName}
                                    />
                                ) : (
                                    <TextField
                                        fullWidth
                                        label={propName}
                                        type={propConfig.type}
                                        value={formData[nodeName]?.properties[propName] || ''}
                                        onChange={(e) => handlePropertyChange(nodeName, propName, e.target.value)}
                                        required={propConfig.required}
                                        inputProps={{
                                            min: propConfig.min,
                                            max: propConfig.max
                                        }}
                                    />
                                )}
                            </Grid>
                        ))}
                    </Grid>
                </div>
            ))}

            {selectedNodes.length > 0 && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    style={{ marginTop: '20px' }}
                >
                    Crear Nodo(s)
                </Button>
            )}

            {error && (
                <Alert severity="error" style={{ marginTop: '20px' }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" style={{ marginTop: '20px' }}>
                    {success}
                </Alert>
            )}
        </Paper>
    );
}

export default Create;
