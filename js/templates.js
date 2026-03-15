/* ================================================================
   DOGOVOR-PRO — Templates Catalog
   Load categories from API and render cards
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/categories');
    const categories = await res.json();

    if (!categories.length) {
      grid.innerHTML = '<div class="empty-state"><h3>Категории пока не добавлены</h3><p>Скоро здесь появятся шаблоны документов</p></div>';
      return;
    }

    grid.innerHTML = categories.map(cat => `
      <a href="/category/${cat.id}" class="category-card reveal visible">
        <div class="category-card-icon">
          <img src="/svg/${cat.icon || 'document'}.svg" alt="${cat.name}">
        </div>
        <h3>${cat.name}</h3>
        <p>${cat.description || ''}</p>
      </a>
    `).join('');

  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><h3>Ошибка загрузки</h3><p>Попробуйте обновить страницу</p></div>';
  }
});
