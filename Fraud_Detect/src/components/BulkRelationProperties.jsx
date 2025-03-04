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

function BulkRelationProperties({ executeQuery }) {
    const [relationType, setRelationType] = useState('');
    const [conditions, setConditions] = useState({});
    const [newProperties, setNewProperties] = useState([{ name: '', value: '' }]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const relationTypes = {
        POSEE: {
            properties: {
                ID: { type: 'number' },
                FechaInicio: { type: 'date' },
                Estado: { type: 'boolean' }
            }
        },
        REALIZA: {
            properties: {
                ID: { type: 'number' },
                Fecha: { type: 'datetime' },
                Monto: { type: 'number' },
                Fraudulenta: { type: 'boolean' }
            }
        },
        USA: {
            properties: {
                ID: { type: 'number' },
                FrecuenciaUso: { type: 'number' },
                UltimoUso: { type: 'date' }
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
                        const propType = relationTypes[relationType].properties[key]?.type;
                        if (propType === 'number') {
                            return `r.${key} = ${parseInt(value)}`;
                        } else if (propType === 'boolean') {
                            return `r.${key} = ${value.toLowerCase() === 'true'}`;
                        } else if (propType === 'date' || propType === 'datetime') {
                            return `r.${key} = date('${value}')`;
                        } else {
                            return `r.${key} = '${value}'`;
                        }
                    })
                    .join(' AND ');
            }

            // Construir la parte SET de la consulta para múltiples propiedades
            const setClause = newProperties
                .filter(prop => prop.name && prop.value)
                .map(prop => `r.${prop.name} = '${prop.value}'`)
                .join(', ');

            const query = `
                MATCH ()-[r:${relationType}]->() 
                ${conditions_string}
                SET ${setClause}
                RETURN count(r) as affected
            `;

            console.log('Query:', query);
            const result = await executeQuery(query);
            const affectedRelations = result.records[0].get('affected').low;
            setSuccess(`Propiedades agregadas a ${affectedRelations} relación(es)`);
            setNewProperties([{ name: '', value: '' }]);
            setConditions({});
        } catch (err) {
            setError('Error al agregar propiedades: ' + err.message);
        }
    };

    return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h5" gutterBottom>
                Agregar Propiedades a Múltiples Relaciones
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Tipo de Relación</InputLabel>
                        <Select
                            value={relationType}
                            onChange={(e) => setRelationType(e.target.value)}
                        >
                            {Object.keys(relationTypes).map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {relationType && (
                    <>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                Condiciones de Búsqueda (opcional)
                            </Typography>
                            {Object.entries(relationTypes[relationType].properties).map(([propName, propConfig]) => (
                                <TextField
                                    key={`condition-${propName}`}
                                    fullWidth
                                    label={`Filtrar por ${propName}`}
                                    type={propConfig.type === 'date' || propConfig.type === 'datetime' ? 'date' : 'text'}
                                    value={conditions[propName] || ''}
                                    onChange={(e) => setConditions(prev => ({
                                        ...prev,
                                        [propName]: e.target.value
                                    }))}
                                    style={{ marginTop: '10px' }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
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
                        disabled={!relationType || !newProperties.some(prop => prop.name && prop.value)}
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

export default BulkRelationProperties; 