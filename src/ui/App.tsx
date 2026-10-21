import { COLOR_DEFS, COLORS } from '../content/colors';
import styles from './App.module.css';

/** Dark text on light fills, light text on dark fills. */
function labelColor(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const luminance = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff);
  return luminance > 128 ? '#1C1A17' : '#E8DCC2';
}

// Placeholder shell until the main menu lands in Phase 9.
export function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Fluid Magic</h1>
      <ul className={styles.colors}>
        {COLORS.map((key) => {
          const def = COLOR_DEFS[key];
          return (
            <li key={key} className={styles.color} title={def.essence}>
              <span
                className={styles.pip}
                style={{
                  background: def.palette.primary,
                  borderColor: def.palette.accent,
                  color: labelColor(def.palette.primary),
                }}
              >
                {key}
              </span>
              {def.element}
            </li>
          );
        })}
      </ul>
      <p className={styles.status}>Scaffold. The simulation is under construction.</p>
    </main>
  );
}
