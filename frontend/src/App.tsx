import { useState } from 'react';

const swatches = [
  { name: 'page', className: 'bg-page' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-muted', className: 'bg-surface-muted' },
  { name: 'field', className: 'bg-field' },
  { name: 'selected', className: 'bg-selected' },
  { name: 'border', className: 'bg-border' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'success', className: 'bg-success' },
  { name: 'star', className: 'bg-star' },
];

const statuses = [
  { name: 'Новый', dotClassName: 'bg-status-new' },
  { name: 'Подтверждён', dotClassName: 'bg-status-active' },
  { name: 'В пути', dotClassName: 'border-2 border-status-active' },
  { name: 'Доставлен', dotClassName: 'bg-status-delivered' },
  { name: 'Отменён', dotClassName: 'bg-status-cancelled' },
];

function App() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? 'light');

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 lg:px-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-heading-md font-bold lg:text-heading-lg">SwiftDrop</h1>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md bg-primary px-4 py-2.5 text-body text-on-primary hover:bg-primary-hover active:bg-primary-pressed"
        >
          Тема: {theme === 'dark' ? 'тёмная' : 'светлая'}
        </button>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-sm font-semibold">Цвета</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {swatches.map((swatch) => (
            <div
              key={swatch.name}
              className="rounded-lg border border-border bg-surface p-4 shadow-md"
            >
              <div className={`h-12 rounded-sm border border-border ${swatch.className}`} />
              <p className="mt-2 text-small text-fg-secondary">{swatch.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-sm font-semibold">Статусы</h2>
        <ul className="flex flex-col gap-2">
          {statuses.map((status) => (
            <li key={status.name} className="flex items-center gap-2 text-small">
              <span className={`size-2.5 rounded-full ${status.dotClassName}`} />
              {status.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-heading-sm font-semibold">Текст</h2>
        <p className="text-heading-lg font-bold">Заголовок страницы 32</p>
        <p className="text-heading-md font-semibold">Подзаголовок 24</p>
        <p className="text-heading-sm font-semibold">Заголовок карточки 18</p>
        <p className="text-body">Основной текст 16, обычный</p>
        <p className="text-small text-fg-secondary">Вспомогательный текст 14</p>
        <p className="text-caption text-fg-muted">Мелкий текст 12</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-sm font-semibold">Радиусы и тени</h2>
        <div className="flex flex-wrap gap-4">
          <div className="size-20 rounded-sm border border-border bg-surface shadow-sm" />
          <div className="size-20 rounded-md border border-border bg-surface shadow-md" />
          <div className="size-20 rounded-lg border border-border bg-surface shadow-lg" />
          <div className="size-20 rounded-xl border border-border bg-surface shadow-lg" />
        </div>
      </section>
    </main>
  );
}

export default App;
