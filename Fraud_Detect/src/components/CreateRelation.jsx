import React, { useState, useEffect } from 'react';
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
    Box,
    Autocomplete,
    Tabs,
    Tab,
    FormControlLabel,
    Checkbox
} from '@mui/material';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function CreateRelation({ executeQuery }) {
    const [tabValue, setTabValue] = useState(0);
    const [relationType, setRelationType] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [properties, setProperties] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const relationTypes = {
        POSEE: {
            sourceLabel: 'Persona',
            targetLabel: 'Cuenta',
            sourceIdType: 'DPI',
            properties: {
                FechaInicio: { type: 'date', required: true },
                Estado: { type: 'boolean', required: true }
            }
        },
        REALIZA: {
            sourceLabel: 'Cuenta',
            targetLabel: 'Transacción',
            sourceIdType: 'ID',
            properties: {
                Fecha: { type: 'datetime', required: true },
                Monto: { type: 'number', required: true },
                Fraudulenta: { type: 'boolean', required: true }
            }
        },
        USA: {
            sourceLabel: 'Persona',
            targetLabel: 'Dispositivo',
            sourceIdType: 'DPI',
            properties: {
                FrecuenciaUso: { type: 'number', required: true },
                UltimoUso: { type: 'date', required: true }
            }
        }
    };

    const getNextId = async (relationType) => {
        try {
            const query = `
                MATCH ()-[r:${relationType}]->()
                RETURN COALESCE(MAX(r.ID), 0) + 1 as nextId
            `;
            const result = await executeQuery(query);
            return result.records[0].get('nextId').low;
        } catch (err) {
            console.error('Error al obtener el siguiente ID:', err);
            return 1;
        }
    };

    const handlePropertyChange = (propertyName, value) => {
        setProperties(prev => ({
            ...prev,
            [propertyName]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            const nextId = await getNextId(relationType);
            
            const sourceIdField = relationTypes[relationType].sourceIdType;
            const query = `
                MATCH (a:${relationTypes[relationType].sourceLabel})
                WHERE a.${sourceIdField} = ${parseInt(sourceId)}
                MATCH (b:${relationTypes[relationType].targetLabel})
                WHERE b.ID = ${parseInt(targetId)}
                CREATE (a)-[r:${relationType} {
                    ID: ${nextId},
                    ${Object.entries(properties).map(([key, value]) => {
                        if (typeof value === 'string' && !value.match(/^[0-9]+$/)) {
                            return `${key}: '${value}'`;
                        } else {
                            return `${key}: ${value}`;
                        }
                    }).join(',\n                    ')}
                }]->(b)
                RETURN r`;

            console.log('Query:', query);
            await executeQuery(query);
            setSuccess('Relación creada exitosamente');
            
            setSourceId('');
            setTargetId('');
            setProperties({});
        } catch (err) {
            setError('Error al crear la relación: ' + err.message);
        }
    };

    return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h5" gutterBottom>
                Crear Nueva Relación
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
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={`${relationTypes[relationType].sourceLabel} ID`}
                                value={sourceId}
                                onChange={(e) => setSourceId(e.target.value)}
                                type="number"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={`ID de ${relationTypes[relationType].targetLabel}`}
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                type="number"
                            />
                        </Grid>

                        {Object.entries(relationTypes[relationType].properties).map(([propName, propConfig]) => (
                            <Grid item xs={12} md={6} key={propName}>
                                {propConfig.type === 'date' || propConfig.type === 'datetime' ? (
                                    <TextField
                                        fullWidth
                                        label={propName}
                                        type="date"
                                        value={properties[propName] || ''}
                                        onChange={(e) => handlePropertyChange(propName, e.target.value)}
                                        required={propConfig.required}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                ) : propConfig.type === 'boolean' ? (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={properties[propName] || false}
                                                onChange={(e) => handlePropertyChange(propName, e.target.checked)}
                                            />
                                        }
                                        label={propName}
                                    />
                                ) : (
                                    <TextField
                                        fullWidth
                                        label={propName}
                                        type={propConfig.type}
                                        value={properties[propName] || ''}
                                        onChange={(e) => handlePropertyChange(propName, e.target.value)}
                                        required={propConfig.required}
                                    />
                                )}
                            </Grid>
                        ))}

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={!relationType || !sourceId || !targetId}
                            >
                                Crear Relación
                            </Button>
                        </Grid>
                    </>
                )}
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

export default CreateRelation; 