import Globe from '../components/Globe.jsx'

const styles = {
  container: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    background: 'radial-gradient(ellipse 90% 85% at 50% 50%, rgba(210, 120, 255, 0.22) 0%, rgba(180, 80, 240, 0.10) 40%, rgba(255, 255, 255, 0) 80%), #ffffff',
  },
}

export default function DefaultThemePage() {
  return (
    <div style={styles.container}>
      <Globe />
    </div>
  )
}
