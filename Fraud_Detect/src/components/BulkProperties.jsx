import React, { useState } from 'react';
import {
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Grid,
    Alert
} from '@mui/material';

function BulkProperties({ executeQuery }) {
    const [nodeType, setNodeType] = useState('');
    const [bulkProperties, setBulkProperties] = useState({});
    const [conditions, setConditions] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const nodeTypes = {
        Persona: {
            properties: {
                DPI: { type: 'number' },
                Nombre: { type: 'string' },
                NivelRiesgo: { type: 'number' }
            }
        },
        Cuenta: {
            properties: {
                ID: { type: 'number' },
                Saldo: { type: 'number' },
                Estado: { type: 'boolean' }
            }
        },
        Transaccion: {
            properties: {
                ID: { type: 'number' },
                Monto: { type: 'number' },
                Tipo: { type: 'string' }
            }
        },
        Dispositivo: {
            properties: {
                ID: { type: 'number' },
                Tipo: { type: 'string' },
                UsoFrecuente: { type: 'boolean' }
            }
        },
        Establecimiento: {
            properties: {
                ID: { type: 'number' },
                Nombre: { type: 'string' },
                NivelRiesgo: { type: 'number' }
            }
        }
    };

    const handleBulkPropertyChange = (field, value) => {
        setBulkProperties(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleBulkSubmit = async () => {
        try {
            let conditions_string = '';
            if (Object.keys(conditions).length > 0) {
                conditions_string = 'WHERE ' + Object.entries(conditions)
                    .filter(([_, value]) => value !== '')
                    .map(([key, value]) => {
                        const propType = nodeTypes[nodeType].properties[key].type;
                        if (propType === 'number') {
                            return `n.${key} = ${parseInt(value)}`;
                        } else if (propType === 'boolean') {
                            return `n.${key} = ${value.toLowerCase() === 'true'}`;
                        } else {
                            return `n.${key} = '${value}'`;
                        }
                    })
                    .join(' AND ');
            }

            const query = `
                MATCH (n:${nodeType}) 
                ${conditions_string}
                SET n.${bulkProperties.newPropName} = '${bulkProperties.newPropValue}'
                RETURN count(n) as affected
            `;

            console.log('Query:', query);
            const result = await executeQuery(query);
            const affectedNodes = result.records[0].get('affected').low;
            setSuccess(`Propiedad agregada a ${affectedNodes} nodo(s)`);
            setBulkProperties({});
            setConditions({});
        } catch (err) {
            setError('Error al agregar propiedades: ' + err.message);
        }
    };

    return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h5" gutterBottom>
                Agregar Propiedades a Múltiples Nodos
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Tipo de Nodo</InputLabel>
                        <Select
                            value={nodeType}
                            onChange={(e) => setNodeType(e.target.value)}
                        >
                            {Object.keys(nodeTypes).map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {nodeType && (
                    <>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                Condiciones (opcional)
                            </Typography>
                            {Object.entries(nodeTypes[nodeType].properties).map(([propName, propConfig]) => (
                                <TextField
                                    key={`condition-${propName}`}
                                    fullWidth
                                    label={`Filtrar por ${propName}`}
                                    value={conditions[propName] || ''}
                                    onChange={(e) => setConditions(prev => ({
                                        ...prev,
                                        [propName]: e.target.value
                                    }))}
                                    style={{ marginTop: '10px' }}
                                />
                            ))}
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                Nuevas Propiedades
                            </Typography>
                            <TextField
                                fullWidth
                                label="Nombre de la Nueva Propiedad"
                                value={bulkProperties.newPropName || ''}
                                onChange={(e) => handleBulkPropertyChange('newPropName', e.target.value)}
                                style={{ marginTop: '10px' }}
                            />
                            <TextField
                                fullWidth
                                label="Valor de la Nueva Propiedad"
                                value={bulkProperties.newPropValue || ''}
                                onChange={(e) => handleBulkPropertyChange('newPropValue', e.target.value)}
                                style={{ marginTop: '10px' }}
                            />
                        </Grid>
                    </>
                )}

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleBulkSubmit}
                        disabled={!nodeType || !bulkProperties.newPropName || !bulkProperties.newPropValue}
                    >
                        Agregar Propiedades
                    </Button>
                </Grid>
            </Grid>

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

export default BulkProperties; 