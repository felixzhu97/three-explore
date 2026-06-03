import Globe from '../components/Globe.jsx'

const styles = {
  container: {
    flex: 1,
    position: 'relative',
  },
}

export default function DefaultThemePage() {
  return (
    <div style={styles.container}>
      <Globe />
    </div>
  )
}
