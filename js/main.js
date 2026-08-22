document.addEventListener('DOMContentLoaded', () => {
  // Menú móvil
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Validación básica del formulario de contacto
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      const email = document.getElementById('email').value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        e.preventDefault();
        alert('Por favor, ingresa un correo electrónico válido.');
      }
      // Formspree se encargará del resto si pasa esta validación básica
    });
  }

  // Marcar enlace activo según la URL
  const currentLocation = location.href;
  const menuItems = document.querySelectorAll('.nav-links a');
  const menuLength = menuItems.length;
  for (let i = 0; i < menuLength; i++) {
    if (menuItems[i].href === currentLocation) {
      menuItems[i].className = "active";
    }
  }
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
