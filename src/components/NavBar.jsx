import { useLocation, useNavigate } from 'react-router-dom'

const styles = {
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
    position: 'relative',
    zIndex: 100,
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
}

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={styles.navbar}>
      <button
        style={styles.tab(location.pathname === '/default')}
        onClick={() => navigate('/default')}
      >
        默认主题
      </button>
      <button
        style={styles.tab(location.pathname === '/dark')}
        onClick={() => navigate('/dark')}
      >
        暗黑主题
      </button>
    </nav>
  )
}
