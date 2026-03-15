/* ================================================================
   DOGOVOR-PRO — Checkout
   Mock payment form
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const templateId = params.get('tid');
  const variationId = params.get('vid');
  const name = params.get('name');
  const price = params.get('price');

  const productName = document.getElementById('productName');
  const productPrice = document.getElementById('productPrice');
  const productVariation = document.getElementById('productVariation');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutSuccess = document.getElementById('checkoutSuccess');

  if (name) productName.textContent = decodeURIComponent(name);
  if (price) productPrice.textContent = formatPrice(price) + ' ₸';

  if (!templateId || !variationId) {
    productName.textContent = 'Товар не найден';
    productPrice.textContent = '';
    checkoutForm.style.display = 'none';
    return;
  }

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formName = checkoutForm.querySelector('[name="name"]').value.trim();
    const formEmail = checkoutForm.querySelector('[name="email"]').value.trim();
    const formPhone = checkoutForm.querySelector('[name="phone"]').value.trim();

    if (!formName || !formEmail) {
      alert('Пожалуйста, заполните имя и email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      alert('Пожалуйста, введите корректный email');
      return;
    }

    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Обработка...';

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          variationId,
          name: formName,
          email: formEmail,
          phone: formPhone
        })
      });

      const data = await res.json();

      if (data.success) {
        checkoutForm.style.display = 'none';
        document.querySelector('.checkout-product').style.display = 'none';
        document.querySelector('.checkout-box h2').style.display = 'none';
        checkoutSuccess.classList.add('show');
      } else {
        alert(data.error || 'Ошибка оформления. Попробуйте позже.');
      }
    } catch (err) {
      alert('Ошибка сети. Попробуйте позже.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Оплатить';
    }
  });

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
});
