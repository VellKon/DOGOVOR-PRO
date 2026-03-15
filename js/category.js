/* ================================================================
   DOGOVOR-PRO — Category Page
   Load templates with pagination (no page reload) + FAQ
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* Извлекаем slug из пути: /category/trudovoy-dogovor → trudovoy-dogovor */
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const categorySlug = pathParts[1] || null;

  if (!categorySlug) {
    window.location.href = '/templates.html';
    return;
  }

  let currentPage = 1;
  const limit = 6;

  /* ── Load category info ─────────────────────── */
  loadCategoryInfo();
  loadTemplates(currentPage);
  loadFAQ();

  async function loadCategoryInfo() {
    try {
      const res = await fetch('/api/categories');
      const categories = await res.json();
      const cat = categories.find(c => c.id === categorySlug);

      if (cat) {
        document.getElementById('categoryName').textContent = cat.name;
        document.getElementById('categoryTitle').innerHTML = `${cat.name}`;
        document.getElementById('categoryDesc').textContent = cat.description || '';
        document.title = `${cat.name} — DOGOVOR-PRO`;
      }
    } catch (err) {
      console.error('Error loading category:', err);
    }
  }

  /* ── Load templates with pagination ─────────── */
  async function loadTemplates(page) {
    const listEl = document.getElementById('templatesList');
    const paginationEl = document.getElementById('pagination');

    listEl.innerHTML = '<div class="loading"><div class="spinner"></div> Загрузка шаблонов...</div>';

    try {
      const res = await fetch(`/api/templates?category=${categorySlug}&page=${page}&limit=${limit}`);
      const data = await res.json();

      if (!data.templates.length) {
        listEl.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3>Шаблоны пока не добавлены</h3>
            <p>В этой категории скоро появятся документы. Следите за обновлениями!</p>
          </div>`;
        paginationEl.style.display = 'none';
        return;
      }

      listEl.innerHTML = data.templates.map(t => {
        const minPrice = t.variations && t.variations.length
          ? Math.min(...t.variations.map(v => v.price || 0))
          : null;

        return `
          <a href="/template.html?id=${t.id}" class="template-card">
            <h3>${t.title}</h3>
            <div class="template-card-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Обновлено: ${formatDate(t.updatedAt)}
            </div>
            <p>${t.description || ''}</p>
            <div class="template-card-footer">
              ${minPrice ? `<span class="template-card-price">от ${formatPrice(minPrice)} ₸</span>` : '<span></span>'}
              <span class="template-card-link">Подробнее →</span>
            </div>
          </a>
        `;
      }).join('');

      /* Pagination */
      renderPagination(data.pagination, paginationEl);

    } catch (err) {
      listEl.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><h3>Ошибка загрузки</h3><p>Попробуйте обновить страницу</p></div>';
    }
  }

  function renderPagination(pagination, container) {
    if (pagination.totalPages <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    let html = '';

    /* Prev */
    html += `<button class="pagination-btn" data-page="${pagination.currentPage - 1}" ${pagination.currentPage <= 1 ? 'disabled' : ''}>&laquo;</button>`;

    /* Page numbers */
    for (let i = 1; i <= pagination.totalPages; i++) {
      if (
        i === 1 ||
        i === pagination.totalPages ||
        Math.abs(i - pagination.currentPage) <= 1
      ) {
        html += `<button class="pagination-btn ${i === pagination.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (
        Math.abs(i - pagination.currentPage) === 2
      ) {
        html += '<span style="color: var(--c-gray-500);">...</span>';
      }
    }

    /* Next */
    html += `<button class="pagination-btn" data-page="${pagination.currentPage + 1}" ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}>&raquo;</button>`;

    container.innerHTML = html;

    /* Bind click events — NO page reload */
    container.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        currentPage = page;
        loadTemplates(page);
        /* Scroll to top of templates list */
        document.getElementById('templatesList').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── Load FAQ ───────────────────────────────── */
  async function loadFAQ() {
    try {
      const res = await fetch(`/api/faq?category=${categorySlug}`);
      const faqs = await res.json();

      if (!faqs.length) return;

      const faqSection = document.getElementById('faqSection');
      const faqList = document.getElementById('faqList');
      faqSection.style.display = 'block';

      faqList.innerHTML = faqs.map(faq => `
        <div class="faq-item">
          <button class="faq-question">
            <span>${faq.question}</span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer">
            <div class="faq-answer-inner">${faq.answer}</div>
          </div>
        </div>
      `).join('');

      /* Accordion toggle */
      faqList.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq-item');
          const wasActive = item.classList.contains('active');
          faqList.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
          if (!wasActive) item.classList.add('active');
        });
      });
    } catch (err) {
      console.error('Error loading FAQ:', err);
    }
  }

  /* ── Helpers ────────────────────────────────── */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
});
