document.addEventListener('DOMContentLoaded', () => {
  // Menú móvil
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Manejo del formulario de contacto / citas
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = contactForm.querySelector('button[type="submit"]');
      const msgEl = document.getElementById('formMessage');
      const formData = {
        nombre: document.getElementById('name').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('phone').value,
        categoria: document.getElementById('reason').value,
        mensaje: document.getElementById('mensaje').value
      };

      btn.disabled = true;
      btn.innerText = 'Enviando...';
      msgEl.style.display = 'none';

      try {
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:3000/api'
          : (window.PSICOLAU_API_URL || 'https://api.psicolau.com/api');

        const response = await fetch(`${API_BASE}/contacto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          msgEl.innerText = data.message || 'Mensaje enviado con éxito.';
          msgEl.style.backgroundColor = '#d4edda';
          msgEl.style.color = '#155724';
          contactForm.reset();
        } else {
          throw new Error(data.message || 'Ocurrió un error al enviar.');
        }
      } catch (error) {
        msgEl.innerText = error.message;
        msgEl.style.backgroundColor = '#f8d7da';
        msgEl.style.color = '#721c24';
      } finally {
        msgEl.style.display = 'block';
        btn.disabled = false;
        btn.innerText = 'Enviar mensaje';
      }
    });
  }

  // Marcar enlace activo según la URL
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const menuItems = document.querySelectorAll('.nav-links a');
  menuItems.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPath) {
      link.classList.add('active');
    }
  });
  // Lógica del acordeón para Preguntas Frecuentes
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length > 0) {
    faqItems.forEach(item => {
      const questionBtn = item.querySelector('.faq-question');
      questionBtn.addEventListener('click', () => {
        item.classList.toggle('active');
        
        const answer = item.querySelector('.faq-answer');
        if (item.classList.contains('active')) {
          answer.style.maxHeight = answer.scrollHeight + "px";
        } else {
          answer.style.maxHeight = null;
        }
      });
    });
  }
});
