import { useLocation, useNavigate } from 'react-router-dom'

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px',
    height: '44px',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    gap: '28px',
    position: 'relative',
    zIndex: 100,
  },
  tab: (active) => ({
    height: '32px',
    padding: '0 2px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    letterSpacing: '-0.01em',
    transition: 'color 0.15s ease',
    background: 'transparent',
    color: active ? '#1d1d1f' : '#6e6e73',
  }),
}

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={styles.navbar}>
      <button
        style={styles.tab(location.pathname === '/globe-light')}
        onClick={() => navigate('/globe-light')}
        onMouseEnter={(e) => {
          if (location.pathname !== '/globe-light') {
            e.currentTarget.style.color = '#1d1d1f'
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/globe-light') {
            e.currentTarget.style.color = '#6e6e73'
          }
        }}
      >
        Globe Light
      </button>
      <button
        style={styles.tab(location.pathname === '/globe-dark')}
        onClick={() => navigate('/globe-dark')}
        onMouseEnter={(e) => {
          if (location.pathname !== '/globe-dark') {
            e.currentTarget.style.color = '#1d1d1f'
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/globe-dark') {
            e.currentTarget.style.color = '#6e6e73'
          }
        }}
      >
        Globe Dark
      </button>
    </nav>
  )
}
