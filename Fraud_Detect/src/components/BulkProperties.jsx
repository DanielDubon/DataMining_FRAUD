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
    Alert,
    IconButton,
    Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function BulkProperties({ executeQuery }) {
    const [nodeType, setNodeType] = useState('');
    const [conditions, setConditions] = useState({});
    const [newProperties, setNewProperties] = useState([{ name: '', value: '' }]);
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

    const addNewPropertyField = () => {
        setNewProperties([...newProperties, { name: '', value: '' }]);
    };

    const removePropertyField = (index) => {
        const updatedProperties = newProperties.filter((_, i) => i !== index);
        setNewProperties(updatedProperties);
    };

    const handlePropertyChange = (index, field, value) => {
        const updatedProperties = newProperties.map((prop, i) => {
            if (i === index) {
                return { ...prop, [field]: value };
            }
            return prop;
        });
        setNewProperties(updatedProperties);
    };

    const handleBulkSubmit = async () => {
        try {
            let conditions_string = '';
            if (Object.keys(conditions).length > 0) {
                conditions_string = 'WHERE ' + Object.entries(conditions)
                    .filter(([_, value]) => value !== '')
                    .map(([key, value]) => {
                        const propType = nodeTypes[nodeType].properties[key]?.type;
                        if (propType === 'number') {
                            return `n.${key} = ${parseInt(value)}`;
                        } else {
                            return `n.${key} = '${value}'`;
                        }
                    })
                    .join(' AND ');
            }

            // Construir la parte SET de la consulta para múltiples propiedades
            const setClause = newProperties
                .filter(prop => prop.name && prop.value) // Solo incluir propiedades con nombre y valor
                .map(prop => `n.${prop.name} = '${prop.value}'`)
                .join(', ');

            const query = `
                MATCH (n:${nodeType}) 
                ${conditions_string}
                SET ${setClause}
                RETURN count(n) as affected
            `;

            console.log('Query:', query);
            const result = await executeQuery(query);
            const affectedNodes = result.records[0].get('affected').low;
            setSuccess(`Propiedades agregadas a ${affectedNodes} nodo(s)`);
            setNewProperties([{ name: '', value: '' }]);
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
                                Condiciones de Búsqueda (opcional)
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
                            {newProperties.map((prop, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <TextField
                                        label="Nombre de la Propiedad"
                                        value={prop.name}
                                        onChange={(e) => handlePropertyChange(index, 'name', e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        label="Valor de la Propiedad"
                                        value={prop.value}
                                        onChange={(e) => handlePropertyChange(index, 'value', e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                    {newProperties.length > 1 && (
                                        <IconButton 
                                            onClick={() => removePropertyField(index)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                            <Button
                                startIcon={<AddIcon />}
                                onClick={addNewPropertyField}
                                variant="outlined"
                                sx={{ mt: 1 }}
                            >
                                Agregar Otra Propiedad
                            </Button>
                        </Grid>
                    </>
                )}

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleBulkSubmit}
                        disabled={!nodeType || !newProperties.some(prop => prop.name && prop.value)}
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