export default function ThemeSwitcher({ theme, setTheme }) {
  return (
    <div className="theme-switcher glass-card">
      <div className="row">
        <label>Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  );
}
