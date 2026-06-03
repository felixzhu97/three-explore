import GlobeDarkTheme from '../components/GlobeDarkTheme.jsx'

const styles = {
  container: {
    flex: 1,
    position: 'relative',
  },
}

export default function DarkThemePage() {
  return (
    <div style={styles.container}>
      <GlobeDarkTheme />
    </div>
  )
}
