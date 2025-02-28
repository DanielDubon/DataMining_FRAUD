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
    Tab
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
    const [sourceNode, setSourceNode] = useState(null);
    const [targetNode, setTargetNode] = useState(null);
    const [relationType, setRelationType] = useState('');
    const [properties, setProperties] = useState({});
    const [sourceSearch, setSourceSearch] = useState('');
    const [targetSearch, setTargetSearch] = useState('');
    const [sourceOptions, setSourceOptions] = useState([]);
    const [targetOptions, setTargetOptions] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Nuevo estado para la creación masiva de propiedades
    const [bulkRelationType, setBulkRelationType] = useState('');
    const [bulkProperties, setBulkProperties] = useState({});
    const [bulkConditions, setBulkConditions] = useState({});

    const relationTypes = {
        POSEE: {
            sourceLabel: 'Persona',
            targetLabel: 'Cuenta',
            properties: {
                FechaInicio: { type: 'date', required: true },
                Estado: { type: 'boolean', required: true }
            }
        },
        REALIZA: {
            sourceLabel: 'Cuenta',
            targetLabel: 'Transaccion',
            properties: {
                Fecha: { type: 'datetime', required: true },
                Monto: { type: 'number', required: true },
                Fraudulenta: { type: 'boolean', required: true }
            }
        },
        USA: {
            sourceLabel: 'Persona',
            targetLabel: 'Dispositivo',
            properties: {
                FrecuenciaUso: { type: 'number', required: true },
                UltimoUso: { type: 'date', required: true }
            }
        },
        // ... Agregar más tipos de relaciones según necesites
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

    const searchNodes = async (searchText, nodeLabel) => {
        if (!searchText || searchText.length < 2) return [];

        try {
            const query = `
                MATCH (n:${nodeLabel})
                WHERE toLower(n.Nombre) CONTAINS toLower('${searchText}') 
                   OR toString(n.DPI) CONTAINS '${searchText}'
                   OR toString(n.ID) CONTAINS '${searchText}'
                RETURN n.ID as ID, n.Nombre as Nombre, n.DPI as DPI
                LIMIT 10
            `;
            console.log('Search query:', query); // Para debugging

            const result = await executeQuery(query);
            const nodes = result.records.map(record => ({
                id: record.get('ID'),
                nombre: record.get('Nombre'),
                dpi: record.get('DPI'),
                label: record.get('DPI') ?
                    `${record.get('Nombre')} (${record.get('DPI')})` :
                    `${record.get('Nombre')} (ID: ${record.get('ID')})`
            }));

            console.log('Nodos encontrados:', nodes); // Para debugging
            return nodes;
        } catch (err) {
            console.error('Error en la búsqueda:', err);
            return [];
        }
    };

    const handleRelationTypeChange = (event) => {
        setRelationType(event.target.value);
        setSourceNode(null);
        setTargetNode(null);
        setSourceOptions([]);
        setTargetOptions([]);
        setSourceSearch('');
        setTargetSearch('');
    };

    const handleSourceSearch = async (searchText) => {
        if (!relationType) return;
        console.log('Buscando source:', searchText, relationTypes[relationType].sourceLabel);
        const nodes = await searchNodes(searchText, relationTypes[relationType].sourceLabel);
        console.log('Source options:', nodes);
        setSourceOptions(nodes);
    };

    const handleTargetSearch = async (searchText) => {
        if (!relationType) return;
        console.log('Buscando target:', searchText, relationTypes[relationType].targetLabel);
        const nodes = await searchNodes(searchText, relationTypes[relationType].targetLabel);
        console.log('Target options:', nodes);
        setTargetOptions(nodes);
    };

    const handlePropertyChange = (propName, value) => {
        setProperties(prev => ({
            ...prev,
            [propName]: value
        }));
    };

    const handleSubmit = async () => {
        if (!sourceNode || !targetNode || !relationType) {
            setError('Por favor, selecciona todos los campos requeridos');
            return;
        }

        try {
            // Obtener el siguiente ID para la relación
            const nextId = await getNextId(relationType);

            // Preparar las propiedades incluyendo el ID automático
            const allProperties = {
                ID: nextId,
                ...properties
            };

            const propertiesString = Object.entries(allProperties)
                .map(([key, value]) => {
                    if (typeof value === 'string') return `${key}: '${value}'`;
                    if (typeof value === 'boolean') return `${key}: ${value}`;
                    if (value instanceof Date) return `${key}: datetime('${value.toISOString()}')`;
                    return `${key}: ${value}`;
                })
                .join(', ');

            // Modificamos la consulta para mostrar el DPI o ID según corresponda
            const query = `
                MATCH (a:${relationTypes[relationType].sourceLabel})
                WHERE a.DPI = '${sourceNode.dpi}' OR toString(a.ID) = '${sourceNode.id}'
                MATCH (b:${relationTypes[relationType].targetLabel})
                WHERE toString(b.ID) = '${targetNode.id}'
                CREATE (a)-[r:${relationType} {${propertiesString}}]->(b)
                RETURN r
            `;

            console.log('Query de creación:', query); // Para debugging

            const result = await executeQuery(query);
            console.log('Resultado de la creación:', result); // Para debugging

            if (result.records.length > 0) {
                setSuccess('Relación creada exitosamente');
                setError('');

                // Limpiar el formulario
                setSourceNode(null);
                setTargetNode(null);
                setRelationType('');
                setProperties({});
                setSourceSearch('');
                setTargetSearch('');
            } else {
                setError('No se pudo crear la relación. Verifica los nodos seleccionados.');
            }
        } catch (err) {
            console.error('Error al crear la relación:', err);
            setError(err.message);
            setSuccess('');
        }
    };

    const handleBulkPropertyChange = (propName, value) => {
        setBulkProperties(prev => ({
            ...prev,
            [propName]: value
        }));
    };

    const handleBulkSubmit = async () => {
        try {
            // Construir la cláusula WHERE para las condiciones
            const whereConditions = Object.entries(bulkConditions)
                .filter(([_, value]) => value !== '')
                .map(([key, value]) => {
                    if (typeof value === 'string') return `r.${key} = '${value}'`;
                    return `r.${key} = ${value}`;
                })
                .join(' AND ');

            // Corregimos la construcción del SET para usar el nombre de propiedad dinámico
            const propertyName = bulkProperties.newPropName;
            const propertyValue = bulkProperties.newPropValue;
            const setClause = `r.${propertyName} = ${isNaN(propertyValue) ? `'${propertyValue}'` : propertyValue}`;

            const query = `
                MATCH ()-[r:${bulkRelationType}]->()
                ${whereConditions ? `WHERE ${whereConditions}` : ''}
                SET ${setClause}
                RETURN count(r) as updatedCount
            `;

            console.log('Query de actualización masiva:', query);

            const result = await executeQuery(query);
            const updatedCount = result.records[0].get('updatedCount').low;

            setSuccess(`Se agregó la propiedad "${propertyName}" a ${updatedCount} relaciones exitosamente`);
            setError('');

            // Limpiar el formulario
            setBulkProperties({});
            setBulkConditions({});
        } catch (err) {
            console.error('Error al agregar propiedades:', err);
            setError(err.message);
            setSuccess('');
        }
    };

    return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Crear Relación" />
                <Tab label="Agregar Propiedades Masivas" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
                <Typography variant="h5" gutterBottom>
                    Crear Nueva Relación
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Relación</InputLabel>
                            <Select
                                value={relationType}
                                onChange={handleRelationTypeChange}
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
                                <Autocomplete
                                    value={sourceNode}
                                    onChange={(event, newValue) => {
                                        console.log('Source selected:', newValue);
                                        setSourceNode(newValue);
                                    }}
                                    inputValue={sourceSearch}
                                    onInputChange={(event, newInputValue) => {
                                        console.log('Source search input:', newInputValue);
                                        setSourceSearch(newInputValue);
                                        handleSourceSearch(newInputValue);
                                    }}
                                    options={sourceOptions}
                                    getOptionLabel={(option) => option?.label || ''}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    filterOptions={(x) => x} // Deshabilitar el filtrado interno
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={`Buscar ${relationTypes[relationType].sourceLabel}`}
                                            fullWidth
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Autocomplete
                                    value={targetNode}
                                    onChange={(event, newValue) => {
                                        console.log('Target selected:', newValue);
                                        setTargetNode(newValue);
                                    }}
                                    inputValue={targetSearch}
                                    onInputChange={(event, newInputValue) => {
                                        console.log('Target search input:', newInputValue);
                                        setTargetSearch(newInputValue);
                                        handleTargetSearch(newInputValue);
                                    }}
                                    options={targetOptions}
                                    getOptionLabel={(option) => option?.label || ''}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    filterOptions={(x) => x} // Deshabilitar el filtrado interno
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={`Buscar ${relationTypes[relationType].targetLabel}`}
                                            fullWidth
                                        />
                                    )}
                                />
                            </Grid>

                            {Object.entries(relationTypes[relationType].properties).map(([propName, propConfig]) => (
                                <Grid item xs={12} md={6} key={propName}>
                                    {propConfig.type === 'boolean' ? (
                                        <FormControl fullWidth>
                                            <InputLabel>{propName}</InputLabel>
                                            <Select
                                                value={properties[propName] || ''}
                                                onChange={(e) => handlePropertyChange(propName, e.target.value)}
                                                required={propConfig.required}
                                            >
                                                <MenuItem value={true}>Sí</MenuItem>
                                                <MenuItem value={false}>No</MenuItem>
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            label={propName}
                                            type={propConfig.type === 'datetime' ? 'datetime-local' : propConfig.type}
                                            value={properties[propName] || ''}
                                            onChange={(e) => handlePropertyChange(propName, e.target.value)}
                                            required={propConfig.required}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    )}
                                </Grid>
                            ))}
                        </>
                    )}

                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={!relationType || !sourceNode || !targetNode ||
                                Object.entries(relationTypes[relationType].properties)
                                    .some(([key, config]) => config.required && !properties[key])}
                        >
                            Crear Relación
                        </Button>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                    Agregar Propiedades a Múltiples Relaciones
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Relación</InputLabel>
                            <Select
                                value={bulkRelationType}
                                onChange={(e) => setBulkRelationType(e.target.value)}
                            >
                                {Object.keys(relationTypes).map(type => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {bulkRelationType && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1">
                                    Condiciones (opcional)
                                </Typography>
                                {Object.entries(relationTypes[bulkRelationType].properties).map(([propName, propConfig]) => (
                                    <TextField
                                        key={`condition-${propName}`}
                                        fullWidth
                                        label={`Filtrar por ${propName}`}
                                        value={bulkConditions[propName] || ''}
                                        onChange={(e) => setBulkConditions(prev => ({
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
                            disabled={!bulkRelationType || !bulkProperties.newPropName || !bulkProperties.newPropValue}
                        >
                            Agregar Propiedades
                        </Button>
                    </Grid>
                </Grid>
            </TabPanel>

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