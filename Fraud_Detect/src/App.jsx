import React from 'react'
import DatabaseManager from './components/DatabaseManager'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Create from './components/Create'
import driver from './config/neo4jConfig'
import { Container, Tab, Tabs, Box } from '@mui/material'

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

  const handleChange = (event, newValue) => {
    setValue(newValue)
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
          <Tab label="Ver Datos" />
          <Tab label="Crear" />
        </Tabs>

        <TabPanel value={value} index={0}>
          <DatabaseManager executeQuery={executeQuery} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Create executeQuery={executeQuery} />
        </TabPanel>
      </Container>
    </ThemeProvider>
  )
}

export default App