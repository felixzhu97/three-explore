import GlobeDarkTheme from '../components/GlobeDarkTheme.jsx'

const styles = {
  container: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    background: 'linear-gradient(to top, #0f2027, #203a43, #2c5364)',
    color: 'rgb(49, 98, 127)',
  },
}

export default function DarkThemePage() {
  return (
    <div style={styles.container}>
      <GlobeDarkTheme />
    </div>
  )
}
