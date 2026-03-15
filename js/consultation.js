/* ================================================================
   DOGOVOR-PRO — Consultation Form
   WhatsApp / Email toggle + form submission
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('consultForm');
  if (!form) return;

  const toggleBtns = form.querySelectorAll('.contact-toggle-btn');
  const contactField = document.getElementById('contactField');
  const contactLabel = document.getElementById('contactLabel');
  const contactInput = document.getElementById('contactInput');
  const formSuccess = document.getElementById('formSuccess');

  let currentMethod = 'whatsapp';

  /* ── Toggle WhatsApp / Email ────────────────── */
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMethod = btn.dataset.method;

      if (currentMethod === 'email') {
        contactLabel.textContent = 'Электронная почта';
        contactInput.type = 'email';
        contactInput.placeholder = 'example@email.com';
        contactInput.name = 'contact';
      } else {
        contactLabel.textContent = 'Номер WhatsApp';
        contactInput.type = 'tel';
        contactInput.placeholder = '+7 (___) ___-__-__';
        contactInput.name = 'contact';
      }
    });
  });

  /* ── Form submission ────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]').value.trim();
    const contact = contactInput.value.trim();
    const message = form.querySelector('[name="message"]') ? form.querySelector('[name="message"]').value.trim() : '';

    if (!name || !contact) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    /* Валидация email */
    if (currentMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      alert('Пожалуйста, введите корректный email адрес');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contactMethod: currentMethod,
          contactValue: contact,
          message
        })
      });

      const data = await res.json();

      if (data.success) {
        form.style.display = 'none';
        formSuccess.classList.add('show');
      } else {
        alert(data.error || 'Ошибка отправки. Попробуйте позже.');
      }
    } catch (err) {
      alert('Ошибка сети. Попробуйте позже.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
});
