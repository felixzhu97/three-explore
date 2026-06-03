import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import DefaultThemePage from './pages/DefaultThemePage.jsx'
import DarkThemePage from './pages/DarkThemePage.jsx'

const styles = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'transparent',
  },
}

function App() {
  return (
    <BrowserRouter>
      <div style={styles.app}>
        <NavBar />
        <Routes>
          <Route path="/default" element={<DefaultThemePage />} />
          <Route path="/dark" element={<DarkThemePage />} />
          <Route path="/" element={<DefaultThemePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
