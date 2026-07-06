/* ============================================================
   WOLF PACK — Main JavaScript (Firebase Edition)
   Premium Clothing Brand E-commerce
   ============================================================ */

(function() {
  'use strict';

  /* --------------------------------------------------------
     CONFIG
     -------------------------------------------------------- */
  const CONFIG = {
    whatsappNumber: '918523921392',
    whatsappBase: 'https://wa.me/',
    instagramUrl: 'https://www.instagram.com/wolfpack_in?igsh=aDlwMmc4NzNrcTc1',
    scrollThreshold: 60,
    revealThreshold: 0.15,
  };

  /* --------------------------------------------------------
     FIREBASE CONFIG
     -------------------------------------------------------- */
  const firebaseConfig = {
    apiKey: "AIzaSyCwlXMIMX1WNzYGYCLjEBSvG93NGvgx7eo",
    authDomain: "wolfpack1995.firebaseapp.com",
    projectId: "wolfpack1995",
    storageBucket: "wolfpack1995.firebasestorage.app",
    messagingSenderId: "257601244012",
    appId: "1:257601244012:web:d3a1974e95c1adf5210149",
    measurementId: "G-CG43R46FX5"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  let PRODUCTS = [];
  let BANNERS = [];

  /* --------------------------------------------------------
     DOM READY
     -------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    // Show loader initially
    
    // Fetch data concurrently
    await Promise.all([
      fetchProducts(),
      fetchOffer(),
      fetchBanners()
    ]);

    renderBanners();
    renderProducts();
    renderShowcase();
    setupLoader();
    setupNavbar();
    setupFlowText();
    setupScrollReveal();
    setupCinematicReveal();
    setupBannerSlider();
    setupParallax();
    setupFilters();
    setupProductDetail();
  });

  /* --------------------------------------------------------
     FETCH FROM FIRESTORE
     -------------------------------------------------------- */
  async function fetchProducts() {
    const MOCK_PRODUCTS = [
      { name: 'Shadow Oversized Tee', price: '₹1,499', category: 'oversized', tag: 'bestseller', image: 'assets/images/product-shadow-tee.png', order: 1 },
      { name: 'Apex Muscle Tank', price: '₹999', category: 'gym', tag: 'new', image: 'assets/images/product-muscle-tank.png', order: 2 },
      { name: 'Stealth Joggers', price: '₹1,899', category: 'everyday', tag: 'bestseller', image: 'assets/images/product-joggers.png', order: 3 },
      { name: 'Phantom Hoodie', price: '₹2,499', category: 'oversized', tag: 'limited', image: 'assets/images/product-hoodie.png', order: 4 },
      { name: 'Iron Compression Tee', price: '₹1,299', category: 'gym', tag: 'new', image: 'assets/images/product-compression.png', order: 5 },
      { name: 'Tactical Cargo Pants', price: '₹2,199', category: 'everyday', tag: 'limited', image: 'assets/images/product-cargo.png', order: 6 },
    ];

    try {
      const snapshot = await db.collection('products').orderBy('order', 'asc').get();
      PRODUCTS = [];
      snapshot.forEach(doc => {
        PRODUCTS.push({ id: doc.id, ...doc.data() });
      });
      // Use mock data if Firestore collection is empty
      if (PRODUCTS.length === 0) {
        PRODUCTS = MOCK_PRODUCTS;
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      PRODUCTS = MOCK_PRODUCTS;
    }
  }

  async function fetchOffer() {
    try {
      const doc = await db.collection('offers').doc('active').get();
      if (doc.exists) {
        const data = doc.data();
        if (data.enabled && data.text) {
          const banner = document.getElementById('offer-banner');
          banner.textContent = data.text;
          banner.style.display = 'block';
          
          document.documentElement.style.setProperty('--offer-height', banner.offsetHeight + 'px');
        } else {
          document.getElementById('offer-banner').style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Error fetching offer:', err);
    }
  }

  async function fetchBanners() {
    const MOCK_BANNERS = [
      { id: 'mock1', imageUrl: 'assets/images/offer1.jpeg', order: 1, isActive: true },
      { id: 'mock2', imageUrl: 'assets/images/offer2.jpeg', order: 2, isActive: true }
    ];
    
    try {
      const snapshot = await db.collection('banners')
        .where('isActive', '==', true)
        .orderBy('order', 'asc')
        .get();
        
      BANNERS = [];
      snapshot.forEach(doc => {
        BANNERS.push({ id: doc.id, ...doc.data() });
      });
      
      if (BANNERS.length === 0) {
        BANNERS = MOCK_BANNERS;
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      BANNERS = MOCK_BANNERS;
    }
  }

  /* --------------------------------------------------------
     LOADING SCREEN
     -------------------------------------------------------- */
  function setupLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    // Trigger hero animations after loader
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.add('loaded');
    }, 800);
  }

  /* --------------------------------------------------------
     NAVBAR
     -------------------------------------------------------- */
  function setupNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastScrollY = 0;
    let ticking = false;

    function onScroll() {
      lastScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(() => {
          if (lastScrollY > CONFIG.scrollThreshold) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });

          // Close mobile menu if open
          const mobileMenu = document.getElementById('mobile-menu');
          const navToggle = document.getElementById('nav-toggle');
          if (mobileMenu && mobileMenu.classList.contains('open')) {
            mobileMenu.classList.remove('open');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';
          }
        }
      });
    });
  }

  /* --------------------------------------------------------
     FLOW TEXT ANIMATION
     -------------------------------------------------------- */
  function setupFlowText() {
    const flowText = document.getElementById('flow-text');
    if (!flowText) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Increase letter spacing slightly as user scrolls down
          const scrollY = window.scrollY;
          const maxScroll = window.innerHeight;
          if (scrollY < maxScroll) {
            const progress = scrollY / maxScroll;
            const newSpacing = (progress * 0.4).toFixed(3);
            flowText.style.letterSpacing = `${newSpacing}em`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------
     RENDER HTML
     -------------------------------------------------------- */
  function renderBanners() {
    const section = document.getElementById('banner-section');
    const track = document.getElementById('banner-track');
    const dotsContainer = document.getElementById('banner-dots');
    
    if (BANNERS.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    track.innerHTML = BANNERS.map(b => {
      return `
        <div class="banner-slide">
          <img src="${b.imageUrl}" alt="Wolf Pack Offer">
        </div>
      `;
    }).join('');
    
    if (BANNERS.length > 1) {
      dotsContainer.innerHTML = BANNERS.map((_, i) => {
        return `<div class="banner-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`;
      }).join('');
    } else {
      dotsContainer.innerHTML = '';
    }
  }

  /* --------------------------------------------------------
     RENDER PRODUCTS (Featured Collection)
     -------------------------------------------------------- */
  function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = PRODUCTS.map((product, idx) => {
      const waLink = buildWhatsAppLink(product.name);
      const tagHTML = product.tag
        ? `<span class="product-tag ${product.tag}">${product.tag === 'bestseller' ? 'BESTSELLER' : product.tag === 'limited' ? 'LIMITED' : 'NEW'}</span>`
        : '';

      // Support old 'image' field and new 'imageUrl' field
      const imgSrc = product.imageUrl || product.image || 'logo-final.png';

      return `
        <div class="product-card" data-category="${product.category}" data-product-index="${idx}">
          <div class="product-image">
            ${tagHTML}
            <img src="${imgSrc}" alt="${product.name}" loading="lazy" onerror="this.src='logo-final.png'" />
          </div>
          <div class="product-info">
            <h4 class="product-name">${product.name}</h4>
            <span class="product-category">${getCategoryLabel(product.category)}</span>
            <div class="product-bottom">
              <span class="product-price">${product.price}</span>
              <a href="${waLink}" target="_blank" rel="noopener" class="product-buy" aria-label="Buy ${product.name} via WhatsApp" onclick="event.stopPropagation()">
                BUY NOW
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.11-1.14l-.29-.174-3.01.79.81-2.96-.19-.3A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* --------------------------------------------------------
     RENDER SHOWCASE (Masonry Grid)
     -------------------------------------------------------- */
  function renderShowcase() {
    const grid = document.getElementById('masonry-grid');
    if (!grid) return;

    const showcaseItems = PRODUCTS.map(product => {
      const waLink = buildWhatsAppLink(product.name);
      const imgSrc = product.imageUrl || product.image || 'logo-final.png';
      
      return `
        <a href="${waLink}" target="_blank" rel="noopener" class="masonry-item reveal-scale" data-category="${product.category}">
          <img src="${imgSrc}" alt="${product.name}" loading="lazy" onerror="this.src='logo-final.png'" />
          <div class="masonry-overlay">
            <h4>${product.name}</h4>
            <span>${product.price}</span>
          </div>
        </a>
      `;
    });

    grid.innerHTML = showcaseItems.join('');
  }

  /* --------------------------------------------------------
     CATEGORY FILTER (Showcase)
     -------------------------------------------------------- */
  function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        const items = document.querySelectorAll('.masonry-item');

        items.forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
            requestAnimationFrame(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            });
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.9)';
            setTimeout(() => { item.style.display = 'none'; }, 400);
          }
        });
      });
    });
  }

  /* --------------------------------------------------------
     SCROLL REVEAL
     -------------------------------------------------------- */
  function setupScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: CONFIG.revealThreshold,
      rootMargin: '0px 0px -50px 0px',
    });

    revealElements.forEach(el => observer.observe(el));
  }

  /* --------------------------------------------------------
     PARALLAX
     -------------------------------------------------------- */
  function setupParallax() {
    const lifestyleBg = document.querySelector('.lifestyle-bg img');
    if (!lifestyleBg) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const section = lifestyleBg.closest('.lifestyle');
          const rect = section.getBoundingClientRect();
          const windowH = window.innerHeight;

          if (rect.top < windowH && rect.bottom > 0) {
            const progress = (windowH - rect.top) / (windowH + rect.height);
            const offset = (progress - 0.5) * 60;
            lifestyleBg.style.transform = `translateY(${offset}px) scale(1.1)`;
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------
     CINEMATIC PRODUCT REVEAL
     -------------------------------------------------------- */
  function setupCinematicReveal() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.product-card');
    if (!cards.length) return;

    // Stagger delays (ms)
    const STAGGER = 120;
    // Delay before bronze sweep fires after reveal starts (ms)
    const SWEEP_DELAY = 800;

    let hasRevealed = false;

    if (!('IntersectionObserver' in window)) {
      // Fallback: just show them
      cards.forEach(card => {
        card.classList.add('card-revealed');
      });
      setupProductHoverTilt(cards);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasRevealed) {
          hasRevealed = true;
          observer.unobserve(entry.target);

          cards.forEach((card, index) => {
            const delay = index * STAGGER;

            setTimeout(() => {
              // Step 1: Enable reveal transition
              card.classList.add('card-revealing');

              // Step 2: Trigger the reveal (next frame so transition applies)
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  card.classList.add('card-revealed');
                });
              });

              // Step 3: Bronze lighting sweep after entrance completes
              setTimeout(() => {
                card.classList.add('card-sweep');
              }, SWEEP_DELAY);

            }, delay);
          });

          // Setup hover tilt after all cards finish
          setTimeout(() => {
            setupProductHoverTilt(cards);
          }, cards.length * STAGGER + 1500);
        }
      });
    }, {
      threshold: 0,
      rootMargin: '0px 0px -100px 0px',
    });

    observer.observe(grid);
  }

  /* --------------------------------------------------------
     BANNER SLIDER LOGIC
     -------------------------------------------------------- */
  function setupBannerSlider() {
    const track = document.getElementById('banner-track');
    const dots = document.querySelectorAll('.banner-dot');
    if (BANNERS.length <= 1 || !track) return;

    let currentIndex = 0;
    let autoSlideInterval;
    const SLIDE_DURATION = 5000;

    function goToSlide(index) {
      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      dots.forEach(d => d.classList.remove('active'));
      if(dots[currentIndex]) {
        dots[currentIndex].classList.add('active');
      }
    }

    function nextSlide() {
      let nextIndex = (currentIndex + 1) % BANNERS.length;
      goToSlide(nextIndex);
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideInterval = setInterval(nextSlide, SLIDE_DURATION);
    }

    function stopAutoSlide() {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
    }

    // Dot clicks
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.dataset.index));
        startAutoSlide(); // reset timer
      });
    });
    
    // Pause on hover (optional, but good for UX)
    const section = document.getElementById('banner-section');
    section.addEventListener('mouseenter', stopAutoSlide);
    section.addEventListener('mouseleave', startAutoSlide);

    startAutoSlide();
  }

  /* --------------------------------------------------------
     PRODUCT HOVER TILT + PARALLAX
     -------------------------------------------------------- */
  function setupProductHoverTilt(cards) {
    cards.forEach(card => {
      const img = card.querySelector('.product-image img');

      card.addEventListener('mousemove', (e) => {
        if (!card.classList.contains('card-revealed')) return;

        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;  // 0 → 1
        const y = (e.clientY - rect.top) / rect.height;   // 0 → 1

        // Tilt: max ±5 degrees
        const tiltX = (y - 0.5) * -5;
        const tiltY = (x - 0.5) * 5;

        // Image parallax offset
        const parallaxX = (x - 0.5) * -8;
        const parallaxY = (y - 0.5) * -8;

        card.style.transform = `translateY(-10px) scale(1.03) perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        if (img) {
          img.style.transform = `scale(1.04) translate(${parallaxX}px, ${parallaxY}px)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        if (img) {
          img.style.transform = '';
        }
      });
    });
  }

  /* --------------------------------------------------------
     PRODUCT DETAIL MODAL
     -------------------------------------------------------- */
  function setupProductDetail() {
    const overlay = document.getElementById('product-detail-overlay');
    const modal = document.getElementById('product-detail-modal');
    const closeBtn = document.getElementById('pd-close');
    const track = document.getElementById('pd-gallery-track');
    const dotsContainer = document.getElementById('pd-dots');
    const arrowLeft = document.getElementById('pd-arrow-left');
    const arrowRight = document.getElementById('pd-arrow-right');
    const swipeHint = document.getElementById('pd-swipe-hint');

    if (!overlay) return;

    let currentSlide = 0;
    let totalSlides = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let isDragging = false;
    let dragOffset = 0;
    let keyHandler = null;

    // --- Open product detail ---
    function openProductDetail(productIndex) {
      const product = PRODUCTS[productIndex];
      if (!product) return;

      // Collect all images: gallery array (from Firestore) or single image
      const images = [];
      if (product.gallery && Array.isArray(product.gallery) && product.gallery.length > 0) {
        product.gallery.forEach(url => images.push(url));
      }
      // Always include main image if not already in gallery
      const mainImg = product.imageUrl || product.image || 'logo-final.png';
      if (!images.includes(mainImg)) {
        images.unshift(mainImg);
      }

      totalSlides = images.length;
      currentSlide = 0;

      // Render gallery slides
      track.innerHTML = images.map(src => `
        <div class="pd-gallery-slide">
          <img src="${src}" alt="${product.name}" onerror="this.src='logo-final.png'" />
        </div>
      `).join('');

      // Render dots
      if (totalSlides > 1) {
        dotsContainer.innerHTML = images.map((_, i) =>
          `<button class="pd-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Image ${i + 1}"></button>`
        ).join('');
        dotsContainer.style.display = 'flex';
        arrowLeft.style.display = 'flex';
        arrowRight.style.display = 'flex';
      } else {
        dotsContainer.innerHTML = '';
        dotsContainer.style.display = 'none';
        arrowLeft.style.display = 'none';
        arrowRight.style.display = 'none';
      }

      // Hide swipe hint after first swipe or if single image
      if (totalSlides <= 1 && swipeHint) {
        swipeHint.style.display = 'none';
      }

      // Populate product info
      const tagEl = document.getElementById('pd-tag');
      const nameEl = document.getElementById('pd-name');
      const categoryEl = document.getElementById('pd-category');
      const priceEl = document.getElementById('pd-price');
      const descEl = document.getElementById('pd-description');
      const buyBtn = document.getElementById('pd-buy-btn');

      // Tag
      if (product.tag) {
        tagEl.textContent = product.tag === 'bestseller' ? 'BESTSELLER' : product.tag === 'limited' ? 'LIMITED' : 'NEW';
        tagEl.className = `pd-tag ${product.tag}`;
      } else {
        tagEl.textContent = '';
        tagEl.className = 'pd-tag';
      }

      nameEl.textContent = product.name;
      categoryEl.textContent = getCategoryLabel(product.category);
      priceEl.textContent = product.price;

      // Description: use Firestore description or generate one
      if (product.description) {
        descEl.textContent = product.description;
      } else {
        descEl.textContent = `Premium quality ${getCategoryLabel(product.category).toLowerCase()} from Wolf Pack. Engineered for men who demand more — heavyweight fabric, precision fit, and a design that commands respect.`;
      }

      // WhatsApp buy link
      buyBtn.href = buildWhatsAppLink(product.name);

      // Reset gallery position
      goToSlide(0, false);

      // Show overlay
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Keyboard navigation
      keyHandler = (e) => {
        if (e.key === 'Escape') closeProductDetail();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
      };
      document.addEventListener('keydown', keyHandler);
    }

    // --- Close ---
    function closeProductDetail() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (keyHandler) {
        document.removeEventListener('keydown', keyHandler);
        keyHandler = null;
      }
    }

    // --- Slide Navigation ---
    function goToSlide(index, animate) {
      if (animate === undefined) animate = true;
      currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
      track.style.transition = animate ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      updateDots();
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    }

    function prevSlide() {
      if (currentSlide > 0) goToSlide(currentSlide - 1);
    }

    function updateDots() {
      const dots = dotsContainer.querySelectorAll('.pd-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });
    }

    // --- Arrow clicks ---
    arrowLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      prevSlide();
    });
    arrowRight.addEventListener('click', (e) => {
      e.stopPropagation();
      nextSlide();
    });

    // --- Dot clicks ---
    dotsContainer.addEventListener('click', (e) => {
      const dot = e.target.closest('.pd-dot');
      if (dot) {
        goToSlide(parseInt(dot.dataset.slide));
      }
    });

    // --- Touch / Swipe support ---
    const gallery = document.querySelector('.pd-gallery');

    gallery.addEventListener('touchstart', (e) => {
      if (totalSlides <= 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
      track.style.transition = 'none';
    }, { passive: true });

    gallery.addEventListener('touchmove', (e) => {
      if (!isDragging || totalSlides <= 1) return;
      touchCurrentX = e.touches[0].clientX;
      const diffX = touchCurrentX - touchStartX;
      const diffY = e.touches[0].clientY - touchStartY;

      // Only horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        dragOffset = diffX;
        const galleryWidth = gallery.offsetWidth;
        const percentOffset = (dragOffset / galleryWidth) * 100;
        track.style.transform = `translateX(calc(-${currentSlide * 100}% + ${percentOffset}%))`;
      }
    }, { passive: true });

    gallery.addEventListener('touchend', () => {
      if (!isDragging || totalSlides <= 1) return;
      isDragging = false;
      const threshold = gallery.offsetWidth * 0.2;

      if (dragOffset < -threshold && currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
      } else if (dragOffset > threshold && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      } else {
        goToSlide(currentSlide); // snap back
      }

      dragOffset = 0;

      // Hide swipe hint after first swipe
      if (swipeHint) swipeHint.style.display = 'none';
    });

    // --- Mouse drag support (desktop) ---
    gallery.addEventListener('mousedown', (e) => {
      if (totalSlides <= 1) return;
      e.preventDefault();
      touchStartX = e.clientX;
      isDragging = true;
      track.style.transition = 'none';
    });

    gallery.addEventListener('mousemove', (e) => {
      if (!isDragging || totalSlides <= 1) return;
      touchCurrentX = e.clientX;
      dragOffset = touchCurrentX - touchStartX;
      const galleryWidth = gallery.offsetWidth;
      const percentOffset = (dragOffset / galleryWidth) * 100;
      track.style.transform = `translateX(calc(-${currentSlide * 100}% + ${percentOffset}%))`;
    });

    gallery.addEventListener('mouseup', () => {
      if (!isDragging || totalSlides <= 1) return;
      isDragging = false;
      const threshold = gallery.offsetWidth * 0.2;

      if (dragOffset < -threshold && currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
      } else if (dragOffset > threshold && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      } else {
        goToSlide(currentSlide);
      }
      dragOffset = 0;
    });

    gallery.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        goToSlide(currentSlide);
        dragOffset = 0;
      }
    });

    // --- Close handlers ---
    closeBtn.addEventListener('click', closeProductDetail);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeProductDetail();
    });

    // --- Attach click listeners to product cards ---
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card[data-product-index]');
      if (card) {
        const idx = parseInt(card.dataset.productIndex);
        if (!isNaN(idx)) {
          openProductDetail(idx);
        }
      }
    });
  }

  /* --------------------------------------------------------
     HELPERS
     -------------------------------------------------------- */
  function buildWhatsAppLink(productName) {
    const message = encodeURIComponent(`Hi Wolf Pack, I want to order ${productName}.`);
    return `${CONFIG.whatsappBase}${CONFIG.whatsappNumber}?text=${message}`;
  }

  function getCategoryLabel(cat) {
    const labels = {
      oversized: 'Oversized Tees',
      gym: 'Gym Wear',
      everyday: 'Everyday Premium',
      limited: 'Limited Drops',
    };
    return labels[cat] || cat;
  }

})();
