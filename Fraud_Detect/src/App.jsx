import React from 'react'
import DatabaseManager from './components/DatabaseManager'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Create from './components/Create'
import Update from './components/Update'
import Delete from './components/Delete'
import driver from './config/neo4jConfig'
import { 
  Container, 
  Tab, 
  Tabs, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography,
  Paper
} from '@mui/material'
import CreateRelation from './components/CreateRelation'

function TabPanel(props) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function App() {
  const [value, setValue] = React.useState(0)
  const [createTabValue, setCreateTabValue] = React.useState(0)
  const [readTabValue, setReadTabValue] = React.useState(0)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleCreateTabChange = (event, newValue) => {
    setCreateTabValue(newValue)
  }

  const handleReadTabChange = (event, newValue) => {
    setReadTabValue(newValue)
  }

  const executeQuery = async (query) => {
    const session = driver.session()
    try {
      const result = await session.run(query)
      return result
    } catch (error) {
      throw error
    } finally {
      await session.close()
    }
  }

  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Leer" />
          <Tab label="Crear" />
          <Tab label="Actualizar" />
          <Tab label="Eliminar" />
        </Tabs>

        <TabPanel value={value} index={0}>
          <Box>
            <Tabs value={readTabValue} onChange={handleReadTabChange}>
              <Tab label="Operaciones de Lectura" />
              <Tab label="Consultar Nodo" />
              <Tab label="Consultas Agregadas" />
              <Tab label="Consultas Filtradas" />
            </Tabs>
            <TabPanel value={readTabValue} index={0}>
              <DatabaseManager executeQuery={executeQuery} showOnlyQueries={true} />
            </TabPanel>
            <TabPanel value={readTabValue} index={1}>
              <DatabaseManager executeQuery={executeQuery} showOnlyConsulta={true} />
            </TabPanel>
            <TabPanel value={readTabValue} index={2}>
              <DatabaseManager executeQuery={executeQuery} showOnlyAggregates={true} />
            </TabPanel>
            <TabPanel value={readTabValue} index={3}>
              <DatabaseManager executeQuery={executeQuery} showOnlyFilters={true} />
            </TabPanel>
          </Box>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Box>
            <Tabs value={createTabValue} onChange={handleCreateTabChange}>
              <Tab label="Crear Nodos" />
              <Tab label="Crear Relaciones" />
            </Tabs>
            <TabPanel value={createTabValue} index={0}>
              <Create executeQuery={executeQuery} />
            </TabPanel>
            <TabPanel value={createTabValue} index={1}>
              <CreateRelation executeQuery={executeQuery} />
            </TabPanel>
          </Box>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Update executeQuery={executeQuery} />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <Delete executeQuery={executeQuery} />
        </TabPanel>
      </Container>
    </ThemeProvider>
  )
}

export default App