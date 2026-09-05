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
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || !window.location.hostname)
          ? 'http://localhost:3001/api'
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

  // Marcar enlace activo según la URL (soporta rutas canónicas limpias y extensiones .html)
  let currentPath = window.location.pathname.split('/').pop().replace(/\.html$/, '');
  if (!currentPath || currentPath === 'index') currentPath = '';
  const menuItems = document.querySelectorAll('.nav-links a');
  menuItems.forEach(link => {
    let linkHref = (link.getAttribute('href') || '').replace(/\.html$/, '').replace(/^\//, '');
    if (linkHref === 'index') linkHref = '';
    if (linkHref === currentPath) {
      link.classList.add('active');
    }
  });
  // Lógica del acordeón para Preguntas Frecuentes con Accesibilidad ARIA
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length > 0) {
    faqItems.forEach((item, index) => {
      const questionBtn = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const answerId = `faq-answer-${index + 1}`;
      
      if (answer && !answer.id) {
        answer.id = answerId;
      }
      
      if (questionBtn) {
        questionBtn.setAttribute('aria-expanded', 'false');
        questionBtn.setAttribute('aria-controls', answerId);

        questionBtn.addEventListener('click', () => {
          const isActive = item.classList.toggle('active');
          questionBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
          
          if (isActive) {
            answer.style.maxHeight = answer.scrollHeight + "px";
          } else {
            answer.style.maxHeight = null;
          }
        });
      }
    });
  }

  // Fachadas de video ligeras (Click-to-Play con youtube-nocookie)
  const videoFacades = document.querySelectorAll('.video-facade');
  videoFacades.forEach(facade => {
    const playVideo = () => {
      const videoId = facade.getAttribute('data-video-id');
      const title = facade.getAttribute('data-video-title') || 'Video de testimonio';
      if (!videoId) return;

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;

      facade.innerHTML = '';
      facade.appendChild(iframe);
      facade.style.cursor = 'default';
      facade.classList.add('video-playing');
    };

    facade.addEventListener('click', playVideo);
    facade.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playVideo();
      }
    });
  });

  // Respaldo de imagen de perfil (fallback seguro sin inline onerror)
  const profileImg = document.querySelector('.profile-img');
  if (profileImg) {
    profileImg.addEventListener('error', () => {
      profileImg.src = 'assets/logo-nav.webp';
      profileImg.style.boxShadow = 'none';
    });
  }
});



