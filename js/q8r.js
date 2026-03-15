/* ================================================================
   q8r — Panel Logic (obscured naming)
   Auth, CRUD Templates/Categories/FAQ/Users, Settings
   ================================================================ */

(function () {
  const API_AUTH = '/api/g4t';
  const API_MGMT = '/api/m9p4';
  let token = sessionStorage.getItem('_t') || '';
  let categories = [];

  /* ── Init ────────────────────────────────────── */
  if (token) {
    showDashboard();
  }

  /* ── Login ───────────────────────────────────── */
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    errorEl.classList.remove('show');

    try {
      const res = await fetch(`${API_AUTH}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Ошибка авторизации';
        errorEl.classList.add('show');
        return;
      }

      token = data.token;
      sessionStorage.setItem('_t', token);
      document.getElementById('currentUser').textContent = data.username;
      showDashboard();
    } catch (err) {
      errorEl.textContent = 'Ошибка сети';
      errorEl.classList.add('show');
    }
  });

  /* ── Logout ──────────────────────────────────── */
  document.getElementById('logoutBtn').addEventListener('click', () => {
    token = '';
    sessionStorage.removeItem('_t');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').classList.remove('active');
  });

  /* ── Show Dashboard ─────────────────────────── */
  function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    loadAll();
  }

  async function loadAll() {
    await loadCategories();
    loadTemplates();
    loadFaq();
    loadUsers();
    loadSettings();
  }

  /* ── Tab Switching ──────────────────────────── */
  document.querySelectorAll('.sidebar-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-nav button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  /* ── API Helper ─────────────────────────────── */
  async function api(path, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    };
    if (body && !(body instanceof FormData)) opts.body = JSON.stringify(body);
    if (body instanceof FormData) {
      delete opts.headers['Content-Type'];
      opts.headers = { 'Authorization': `Bearer ${token}` };
      opts.body = body;
    }
    const res = await fetch(`${API_MGMT}${path}`, opts);
    if (res.status === 401) {
      token = '';
      sessionStorage.removeItem('_t');
      location.reload();
      return;
    }
    return res.json();
  }

  /* ── Notify ─────────────────────────────────── */
  function notify(msg, type = 'success') {
    const el = document.getElementById('notification');
    el.textContent = msg;
    el.className = `notification ${type} show`;
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* ── Modal ──────────────────────────────────── */
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');

  function openModal(html) {
    modalContent.innerHTML = html;
    modalOverlay.classList.add('show');
  }
  function closeModal() {
    modalOverlay.classList.remove('show');
  }
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* ────────────────────────────────────────────────
     CATEGORIES
     ──────────────────────────────────────────────── */
  async function loadCategories() {
    const data = await api('/categories');
    categories = data || [];
    renderCategoriesTable();
  }

  function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = categories.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.id}</td>
        <td>${c.description || '—'}</td>
        <td>${c.order}</td>
        <td>
          <button class="btn-edit" onclick="window._editCategory('${c.id}')">Изменить</button>
          <button class="btn-del" onclick="window._delCategory('${c.id}')">Удалить</button>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    openModal(`
      <h2>Добавить категорию</h2>
      <form id="catForm">
        <div class="form-group"><label>Название</label><input id="catName" required></div>
        <div class="form-group"><label>Описание</label><textarea id="catDesc"></textarea></div>
        <div class="form-group"><label>Иконка (имя SVG файла)</label><input id="catIcon" value="document"></div>
        <div class="form-group"><label>Порядок</label><input type="number" id="catOrder" value="${categories.length + 1}"></div>
        <div class="modal-actions"><button type="submit" class="btn-save">Добавить</button><button type="button" class="btn-cancel" onclick="window._closeModal()">Отмена</button></div>
      </form>
    `);
    document.getElementById('catForm').onsubmit = async (e) => {
      e.preventDefault();
      await api('/categories', 'POST', { name: document.getElementById('catName').value, description: document.getElementById('catDesc').value, icon: document.getElementById('catIcon').value, order: parseInt(document.getElementById('catOrder').value) });
      closeModal();
      notify('Категория добавлена');
      loadCategories();
    };
  });

  window._editCategory = (id) => {
    const c = categories.find(x => x.id === id);
    if (!c) return;
    openModal(`
      <h2>Редактировать категорию</h2>
      <form id="catForm">
        <div class="form-group"><label>Название</label><input id="catName" value="${c.name}" required></div>
        <div class="form-group"><label>Описание</label><textarea id="catDesc">${c.description || ''}</textarea></div>
        <div class="form-group"><label>Иконка</label><input id="catIcon" value="${c.icon || 'document'}"></div>
        <div class="form-group"><label>Порядок</label><input type="number" id="catOrder" value="${c.order}"></div>
        <div class="modal-actions"><button type="submit" class="btn-save">Сохранить</button><button type="button" class="btn-cancel" onclick="window._closeModal()">Отмена</button></div>
      </form>
    `);
    document.getElementById('catForm').onsubmit = async (e) => {
      e.preventDefault();
      await api(`/categories/${id}`, 'PUT', { name: document.getElementById('catName').value, description: document.getElementById('catDesc').value, icon: document.getElementById('catIcon').value, order: parseInt(document.getElementById('catOrder').value) });
      closeModal();
      notify('Категория обновлена');
      loadCategories();
    };
  };

  window._delCategory = async (id) => {
    if (!confirm('Удалить категорию?')) return;
    await api(`/categories/${id}`, 'DELETE');
    notify('Категория удалена');
    loadCategories();
  };

  /* ────────────────────────────────────────────────
     TEMPLATES
     ──────────────────────────────────────────────── */
  let templates = [];

  async function loadTemplates() {
    templates = await api('/templates') || [];
    renderTemplatesTable();
  }

  function renderTemplatesTable() {
    const tbody = document.getElementById('templatesTableBody');
    tbody.innerHTML = templates.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return `
        <tr>
          <td>${t.title}</td>
          <td>${cat ? cat.name : t.categoryId}</td>
          <td>${t.variations ? t.variations.length : 0}</td>
          <td>${t.updatedAt || '—'}</td>
          <td>
            <button class="btn-edit" onclick="window._editTemplate('${t.id}')">Изменить</button>
            <button class="btn-del" onclick="window._delTemplate('${t.id}')">Удалить</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getCategoryOptions(selected) {
    return categories.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.name}</option>`).join('');
  }

  function templateFormHTML(t = {}) {
    const variations = t.variations || [{ name: '', price: '', description: '' }];
    return `
      <h2>${t.id ? 'Редактировать' : 'Добавить'} шаблон</h2>
      <form id="tplForm">
        <div class="form-group"><label>Название</label><input id="tplTitle" value="${t.title || ''}" required></div>
        <div class="form-group"><label>Категория</label><select id="tplCategory">${getCategoryOptions(t.categoryId)}</select></div>
        <div class="form-group"><label>Описание</label><textarea id="tplDesc">${t.description || ''}</textarea></div>
        <div class="form-group"><label>Демо-контент (текстовый превью)</label><textarea id="tplDemo" rows="5">${t.demoContent || ''}</textarea></div>
        <h3 style="margin:16px 0 12px; font-size:1rem;">Вариации</h3>
        <div id="variationsContainer">
          ${variations.map((v, i) => `
            <div style="background: var(--p-bg); padding: 16px; border-radius: 8px; margin-bottom: 12px;" data-var-idx="${i}">
              <div class="form-group"><label>Название вариации</label><input class="var-name" value="${v.name || ''}"></div>
              <div class="form-group"><label>Цена (₸)</label><input type="number" class="var-price" value="${v.price || ''}"></div>
              <div class="form-group"><label>Описание</label><input class="var-desc" value="${v.description || ''}"></div>
              <div class="form-group"><label>Имя файла (DOCX)</label><input class="var-file" value="${v.fileName || ''}"></div>
              ${v.id ? `<input type="hidden" class="var-id" value="${v.id}">` : ''}
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn-add" id="addVariationBtn" style="font-size:0.85rem;">+ Вариация</button>
        <div class="modal-actions"><button type="submit" class="btn-save">Сохранить</button><button type="button" class="btn-cancel" onclick="window._closeModal()">Отмена</button></div>
      </form>
    `;
  }

  function bindTemplateForm(existingId) {
    document.getElementById('addVariationBtn').addEventListener('click', () => {
      const container = document.getElementById('variationsContainer');
      const idx = container.children.length;
      const div = document.createElement('div');
      div.style = 'background: var(--p-bg); padding: 16px; border-radius: 8px; margin-bottom: 12px;';
      div.dataset.varIdx = idx;
      div.innerHTML = `
        <div class="form-group"><label>Название вариации</label><input class="var-name"></div>
        <div class="form-group"><label>Цена (₸)</label><input type="number" class="var-price"></div>
        <div class="form-group"><label>Описание</label><input class="var-desc"></div>
        <div class="form-group"><label>Имя файла (DOCX)</label><input class="var-file"></div>
      `;
      container.appendChild(div);
    });

    document.getElementById('tplForm').onsubmit = async (e) => {
      e.preventDefault();
      const variations = [];
      document.querySelectorAll('#variationsContainer > div').forEach(div => {
        const name = div.querySelector('.var-name').value;
        const price = parseInt(div.querySelector('.var-price').value) || 0;
        const description = div.querySelector('.var-desc').value;
        const fileName = div.querySelector('.var-file').value;
        const idInput = div.querySelector('.var-id');
        const v = { name, price, description, fileName };
        if (idInput) v.id = idInput.value;
        if (name) variations.push(v);
      });

      const body = {
        title: document.getElementById('tplTitle').value,
        categoryId: document.getElementById('tplCategory').value,
        description: document.getElementById('tplDesc').value,
        demoContent: document.getElementById('tplDemo').value,
        variations: JSON.stringify(variations)
      };

      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => formData.append(k, v));

      if (existingId) {
        await api(`/templates/${existingId}`, 'PUT', formData);
        notify('Шаблон обновлён');
      } else {
        await api('/templates', 'POST', formData);
        notify('Шаблон добавлен');
      }
      closeModal();
      loadTemplates();
    };
  }

  document.getElementById('addTemplateBtn').addEventListener('click', () => {
    openModal(templateFormHTML());
    bindTemplateForm(null);
  });

  window._editTemplate = (id) => {
    const t = templates.find(x => x.id === id);
    if (!t) return;
    openModal(templateFormHTML(t));
    bindTemplateForm(id);
  };

  window._delTemplate = async (id) => {
    if (!confirm('Удалить шаблон?')) return;
    await api(`/templates/${id}`, 'DELETE');
    notify('Шаблон удалён');
    loadTemplates();
  };

  /* ────────────────────────────────────────────────
     FAQ
     ──────────────────────────────────────────────── */
  let faqs = [];

  async function loadFaq() {
    faqs = await api('/faq') || [];
    renderFaqTable();
  }

  function renderFaqTable() {
    const tbody = document.getElementById('faqTableBody');
    tbody.innerHTML = faqs.map(f => {
      const cat = categories.find(c => c.id === f.categoryId);
      return `
        <tr>
          <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.question}</td>
          <td>${cat ? cat.name : f.categoryId}</td>
          <td>${f.order}</td>
          <td>
            <button class="btn-edit" onclick="window._editFaq('${f.id}')">Изменить</button>
            <button class="btn-del" onclick="window._delFaq('${f.id}')">Удалить</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('addFaqBtn').addEventListener('click', () => {
    openModal(`
      <h2>Добавить вопрос</h2>
      <form id="faqForm">
        <div class="form-group"><label>Категория</label><select id="faqCategory">${getCategoryOptions('')}</select></div>
        <div class="form-group"><label>Вопрос</label><textarea id="faqQuestion" required></textarea></div>
        <div class="form-group"><label>Ответ</label><textarea id="faqAnswer" required></textarea></div>
        <div class="form-group"><label>Порядок</label><input type="number" id="faqOrder" value="1"></div>
        <div class="modal-actions"><button type="submit" class="btn-save">Добавить</button><button type="button" class="btn-cancel" onclick="window._closeModal()">Отмена</button></div>
      </form>
    `);
    document.getElementById('faqForm').onsubmit = async (e) => {
      e.preventDefault();
      await api('/faq', 'POST', { categoryId: document.getElementById('faqCategory').value, question: document.getElementById('faqQuestion').value, answer: document.getElementById('faqAnswer').value, order: parseInt(document.getElementById('faqOrder').value) });
      closeModal();
      notify('Вопрос добавлен');
      loadFaq();
    };
  });

  window._editFaq = (id) => {
    const f = faqs.find(x => x.id === id);
    if (!f) return;
    openModal(`
      <h2>Редактировать вопрос</h2>
      <form id="faqForm">
        <div class="form-group"><label>Категория</label><select id="faqCategory">${getCategoryOptions(f.categoryId)}</select></div>
        <div class="form-group"><label>Вопрос</label><textarea id="faqQuestion">${f.question}</textarea></div>
        <div class="form-group"><label>Ответ</label><textarea id="faqAnswer">${f.answer}</textarea></div>
        <div class="form-group"><label>Порядок</label><input type="number" id="faqOrder" value="${f.order}"></div>
        <div class="modal-actions"><button type="submit" class="btn-save">Сохранить</button><button type="button" class="btn-cancel" onclick="window._closeModal()">Отмена</button></div>
      </form>
    `);
    document.getElementById('faqForm').onsubmit = async (e) => {
      e.preventDefault();
      await api(`/faq/${id}`, 'PUT', { categoryId: document.getElementById('faqCategory').value, question: document.getElementById('faqQuestion').value, answer: document.getElementById('faqAnswer').value, order: parseInt(document.getElementById('faqOrder').value) });
      closeModal();
      notify('Вопрос обновлён');
      loadFaq();
    };
  };

  window._delFaq = async (id) => {
    if (!confirm('Удалить вопрос?')) return;
    await api(`/faq/${id}`, 'DELETE');
    notify('Вопрос удалён');
    loadFaq();
  };

  /* ────────────────────────────────────────────────
     USERS
     ──────────────────────────────────────────────── */
  async function loadUsers() {
    const users = await api('/users') || [];
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.username}</td>
        <td>${u.role}</td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
        <td><button class="btn-del" onclick="window._delUser('${u.id}')">Удалить</button></td>
      </tr>
    `).join('');
  }

  document.getElementById('addUserBtn').addEventListener('click', () => {
    openModal(`
      <h2>Добавить пользователя</h2>
      <form id="userForm">
        <div class="form-group"><label>Логин</label><input id="userLogin" required></div>
        <div class="form-group"><label>Пароль</label><input type="password" id="userPass" required></div>
        <div class="modal-actions"><button type="submit" class="btn-save">Добавить</button><button type="button" class="btn-cancel" onclick="window._closeModal()">Отмена</button></div>
      </form>
    `);
    document.getElementById('userForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = await api('/users', 'POST', { username: document.getElementById('userLogin').value, password: document.getElementById('userPass').value });
      if (data && data.error) { notify(data.error, 'error'); return; }
      closeModal();
      notify('Пользователь добавлен');
      loadUsers();
    };
  });

  window._delUser = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    const data = await api(`/users/${id}`, 'DELETE');
    if (data && data.error) { notify(data.error, 'error'); return; }
    notify('Пользователь удалён');
    loadUsers();
  };

  /* ────────────────────────────────────────────────
     SETTINGS
     ──────────────────────────────────────────────── */
  async function loadSettings() {
    const settings = await api('/settings') || {};
    document.getElementById('settWhatsapp').value = settings.whatsapp || '';
    document.getElementById('settEmail').value = settings.email || '';
    document.getElementById('settCompany').value = settings.companyName || '';
  }

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await api('/settings', 'PUT', {
      whatsapp: document.getElementById('settWhatsapp').value,
      email: document.getElementById('settEmail').value,
      companyName: document.getElementById('settCompany').value
    });
    notify('Настройки сохранены');
  });

  /* ── Global helpers ─────────────────────────── */
  window._closeModal = closeModal;

})();
