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
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    },
    typography: {
      h3: {
        fontWeight: 600,
        color: '#ffffff',
        fontSize: {
          xs: '1.8rem',    // para móviles
          sm: '2.3rem',    // para tablets
          md: '2.8rem',    // para desktops
          lg: '3.2rem',    // para pantallas grandes
        },
      },
      h6: {
        fontWeight: 500,
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh'
      }}>
        {/* Header fijo */}
        <Box sx={{ 
          position: 'fixed',
          width: '100%',
          top: 0,
          zIndex: 1100,
          backgroundColor: theme.palette.background.default
        }}>
          {/* Banner Principal */}
          <AppBar position="static" sx={{ 
            backgroundColor: theme.palette.primary.main,
            boxShadow: 3,
          }}>
            <Toolbar sx={{ 
              height: { xs: '80px', md: '120px' },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                  fontWeight: 'bold',
                  fontSize: { 
                    xs: '1.8rem',
                    sm: '2.3rem',
                    md: '2.8rem' 
                  }
                }}
              >
                FRAUD DETECTOR
              </Typography>
            </Toolbar>
          </AppBar>

          {/* Barra de Navegación Principal */}
          <Paper elevation={3} sx={{ backgroundColor: 'white' }}>
            <Container maxWidth="xl">
              <Tabs 
                value={value} 
                onChange={handleChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                    fontWeight: 500,
                    py: { xs: 1, md: 2 }
                  }
                }}
              >
                <Tab label="Leer" />
                <Tab label="Crear" />
                <Tab label="Actualizar" />
                <Tab label="Eliminar" />
              </Tabs>
            </Container>
          </Paper>
        </Box>

        {/* Espaciador para el header fijo */}
        <Box sx={{ height: { xs: '140px', md: '180px' } }} />

        {/* Contenido Principal con Menú Lateral */}
        <Container 
          maxWidth="xl" 
          sx={{ 
            flexGrow: 1,
            mt: 0,
            mb: 0,
            px: { xs: 2, sm: 3, md: 4 }
          }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Menú Lateral para LEER */}
            {value === 0 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  width: '250px',
                  flexShrink: 0,
                  position: 'fixed',
                  top: '180px',
                  height: 'auto',
                  overflowY: 'auto'
                }}
              >
                <Tabs
                  value={readTabValue}
                  onChange={handleReadTabChange}
                  orientation="vertical"
                  variant="scrollable"
                  sx={{
                    '& .MuiTab-root': {
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      py: 2
                    }
                  }}
                >
                  <Tab label="Operaciones de Lectura" />
                  <Tab label="Consultar Nodo" />
                  <Tab label="Consultas Agregadas" />
                  <Tab label="Consultas Filtradas" />
                </Tabs>
              </Paper>
            )}

            {/* Menú Lateral para CREAR */}
            {value === 1 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  width: '250px',
                  flexShrink: 0,
                  position: 'fixed',
                  top: '180px',
                  height: 'auto',
                  overflowY: 'auto'
                }}
              >
                <Tabs
                  value={createTabValue}
                  onChange={handleCreateTabChange}
                  orientation="vertical"
                  variant="scrollable"
                  sx={{
                    '& .MuiTab-root': {
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      py: 2
                    }
                  }}
                >
                  <Tab label="Crear Nodos" />
                  <Tab label="Crear Relaciones" />
                </Tabs>
              </Paper>
            )}

            {/* Contenido - Agregamos margen izquierdo para compensar el menú fijo */}
            <Box sx={{ 
              flexGrow: 1,
              ml: '270px',
              mt: -5
            }}>
              <TabPanel value={value} index={0} sx={{ p: 0 }}>
                <TabPanel value={readTabValue} index={0} sx={{ 
                  p: 0,
                  pl: 3,
                }}>
                  <DatabaseManager 
                    executeQuery={executeQuery} 
                    showOnlyQueries={true} 
                    sx={{
                      '& .MuiPaper-root': {
                        p: 3,
                        textAlign: 'left'
                      }
                    }}
                  />
                </TabPanel>
                <TabPanel value={readTabValue} index={1} sx={{ 
                  p: 0,
                  pl: 3,
                }}>
                  <DatabaseManager 
                    executeQuery={executeQuery} 
                    showOnlyConsulta={true} 
                    sx={{
                      '& .MuiPaper-root': {
                        p: 3,
                        textAlign: 'left'
                      }
                    }}
                  />
                </TabPanel>
                <TabPanel value={readTabValue} index={2} sx={{ 
                  p: 0,
                  pl: 3,
                }}>
                  <DatabaseManager 
                    executeQuery={executeQuery} 
                    showOnlyAggregates={true} 
                    sx={{
                      '& .MuiPaper-root': {
                        p: 3,
                        textAlign: 'left'
                      }
                    }}
                  />
                </TabPanel>
                <TabPanel value={readTabValue} index={3} sx={{ 
                  p: 0,
                  pl: 3,
                }}>
                  <DatabaseManager 
                    executeQuery={executeQuery} 
                    showOnlyFilters={true} 
                    sx={{
                      '& .MuiPaper-root': {
                        p: 3,
                        textAlign: 'left'
                      }
                    }}
                  />
                </TabPanel>
              </TabPanel>

              <TabPanel value={value} index={1} sx={{ p: 0 }}>
                <TabPanel value={createTabValue} index={0} sx={{ 
                  p: 0,
                  mt: 0
                }}>
                  <Create 
                    executeQuery={executeQuery}
                    sx={{
                      '& .MuiPaper-root': {
                        p: 2,
                        mt: 0,
                        textAlign: 'left'
                      }
                    }}
                  />
                </TabPanel>
                <TabPanel value={createTabValue} index={1} sx={{ 
                  p: 0,
                  mt: 0
                }}>
                  <CreateRelation 
                    executeQuery={executeQuery}
                    sx={{
                      '& .MuiPaper-root': {
                        p: 2,
                        mt: 0,
                        textAlign: 'left'
                      }
                    }}
                  />
                </TabPanel>
              </TabPanel>

              <TabPanel value={value} index={2} sx={{ 
                p: 0,
                pl: 3,
              }}>
                <Update 
                  executeQuery={executeQuery}
                  sx={{
                    '& .MuiPaper-root': {
                      p: 3,
                      textAlign: 'left'
                    }
                  }}
                />
              </TabPanel>

              <TabPanel value={value} index={3} sx={{ 
                p: 0,
                pl: 3,
              }}>
                <Delete 
                  executeQuery={executeQuery}
                  sx={{
                    '& .MuiPaper-root': {
                      p: 3,
                      textAlign: 'left'
                    }
                  }}
                />
              </TabPanel>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App