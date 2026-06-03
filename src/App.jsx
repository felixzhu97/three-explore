import { useState } from 'react'
import Globe from './components/Globe.jsx'
import GlobeDarkTheme from './components/GlobeDarkTheme.jsx'

const styles = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'transparent',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    gap: '8px',
  },
  tab: (active) => ({
    padding: '8px 20px',
    borderRadius: '980px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    background: active ? '#1d1d1f' : 'transparent',
    color: active ? '#ffffff' : '#1d1d1f',
  }),
  globeContainer: {
    flex: 1,
    position: 'relative',
  },
}

function App() {
  const [theme, setTheme] = useState('default')

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <button
          style={styles.tab(theme === 'default')}
          onClick={() => setTheme('default')}
        >
          默认主题
        </button>
        <button
          style={styles.tab(theme === 'dark')}
          onClick={() => setTheme('dark')}
        >
          暗黑主题
        </button>
      </nav>
      <div style={styles.globeContainer}>
        {theme === 'default' ? <Globe /> : <GlobeDarkTheme />}
      </div>
    </div>
  )
}

export default App
