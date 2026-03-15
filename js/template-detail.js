/* ================================================================
   DOGOVOR-PRO — Template Detail
   Load template variations, demo preview, buy links
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const templateId = params.get('id');

  if (!templateId) {
    window.location.href = '/templates.html';
    return;
  }

  const contentEl = document.getElementById('templateContent');
  const breadcrumbsEl = document.getElementById('breadcrumbs');
  const titleEl = document.getElementById('templateTitle');

  try {
    const res = await fetch(`/api/templates/${templateId}`);
    if (!res.ok) throw new Error('Not found');
    const template = await res.json();

    /* Update page title and breadcrumbs */
    document.title = `${template.title} — DOGOVOR-PRO`;
    titleEl.textContent = template.title;
    breadcrumbsEl.innerHTML = `
      <a href="/">Главная</a><span>/</span>
      <a href="/templates.html">Шаблоны</a><span>/</span>
      <a href="/category/${template.categoryId}">${template.categoryName || 'Категория'}</a><span>/</span>
      <span>${template.title}</span>
    `;

    /* Build content */
    let demoHTML = '';
    if (template.demoContent || template.demoFile) {
      demoHTML = `
        <div class="template-demo">
          <h4>Демо-версия документа</h4>
          ${template.demoContent
            ? template.demoContent.split('\n').map(line => `<p>${line}</p>`).join('')
            : '<p style="text-align:center; color: var(--c-gray-500);">Превью документа загружается...</p>'
          }
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px dashed var(--c-gray-300);">
            <p style="color: var(--c-gray-500); font-size: 0.8rem; text-indent: 0;">Это демо-версия. Полная версия доступна после покупки.</p>
          </div>
        </div>
      `;
    } else {
      demoHTML = `
        <div class="template-demo" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--c-gray-300)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p style="color: var(--c-gray-500); margin-top: 16px; text-indent: 0;">Демо-версия будет доступна после добавления</p>
        </div>
      `;
    }

    let variationsHTML = '';
    if (template.variations && template.variations.length) {
      variationsHTML = `
        <div class="variations-list">
          ${template.variations.map(v => `
            <div class="variation-card">
              <div class="variation-card-header">
                <h3>${v.name}</h3>
                <span class="price">${formatPrice(v.price || 0)} ₸</span>
              </div>
              <p>${v.description || 'Готовый шаблон в формате DOCX'}</p>
              <a href="/checkout.html?tid=${templateId}&vid=${v.id}&name=${encodeURIComponent(template.title + ' — ' + v.name)}&price=${v.price || 0}" class="btn btn-primary">
                Купить
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      variationsHTML = '<div class="empty-state"><h3>Вариации пока не добавлены</h3><p>Скоро здесь появятся доступные версии этого документа</p></div>';
    }

    contentEl.innerHTML = `
      ${demoHTML}
      <div class="template-info">
        <span class="category-badge">${template.categoryName || ''}</span>
        <p class="description">${template.description || ''}</p>
        <h3 style="margin-bottom: 16px;">Доступные вариации</h3>
        ${variationsHTML}
      </div>
    `;

  } catch (err) {
    contentEl.innerHTML = '<div class="empty-state"><h3>Шаблон не найден</h3><p>Возможно, он был удалён или перемещён</p><a href="/templates.html" class="btn btn-primary" style="margin-top: 16px;">Вернуться к каталогу</a></div>';
  }

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
});
