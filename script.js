document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initLightbox();
    initLinkPrefetch();
    initParallax();
    initSmartNav();
});

/* --- 1. GALERIA (GENEROWANIE) --- */
function loadGallery(config) {
    const galleryContainer = document.getElementById(config.containerId || 'moja-galeria');
    if (!galleryContainer) return;

    const folder = config.folder;
    const count = config.count;
    const extension = config.extension || '.jpg';
    const prefix = config.prefix || 'foto'; 

    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'masonry-item fade-in-section'; 

        const img = document.createElement('img');
        const fileName = `${prefix} (${i})${extension}`;
        img.src = `${folder}${fileName}`;
        img.alt = `Zdjęcie nr ${i}`;
        img.dataset.index = i; 
        
        // Lazy loading dla wydajności
        img.loading = 'lazy'; 
        
        img.onclick = () => openLightbox(folder, prefix, i, count, extension);

        img.onerror = function() { 
            console.warn('Nie znaleziono pliku:', this.src); 
            div.style.display = 'none'; 
        };

        const watermark = document.createElement('img');
        watermark.src = 'photos/watermark.svg';
        watermark.className = 'watermark';
        watermark.alt = '';

        div.appendChild(img);
        div.appendChild(watermark);
        galleryContainer.appendChild(div);
    }
    
    // Odświeżamy cache obrazów po wygenerowaniu galerii
    refreshParallaxCache();
    // Upewniamy się, że pętla chodzi
    initParallax();
}

/* --- 2. LIGHTBOX (PEŁNY EKRAN) --- */
let currentImageIndex = 1;
let currentConfig = {};

function initLightbox() {
    if (!document.getElementById('lightbox')) {
        const lightboxHTML = `
            <div id="lightbox" class="lightbox">
                <span class="close">&times;</span>
                <div class="lightbox-content">
                    <img id="lightbox-img" src="" alt="">
                    <a class="prev" onclick="changeSlide(-1)">&#10094;</a>
                    <a class="next" onclick="changeSlide(1)">&#10095;</a>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        document.querySelector('.close').onclick = closeLightbox;
        document.getElementById('lightbox').onclick = (e) => {
            if(e.target.id === 'lightbox') closeLightbox();
        };

        document.addEventListener('keydown', (e) => {
            if (document.getElementById('lightbox').style.display === 'flex') {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') changeSlide(-1);
                if (e.key === 'ArrowRight') changeSlide(1);
            }
        });
    }
}

function openLightbox(folder, prefix, index, total, extension) {
    const lightbox = document.getElementById('lightbox');
    
    currentConfig = { folder, prefix, total, extension };
    currentImageIndex = index;

    updateLightboxImage();
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function changeSlide(n) {
    currentImageIndex += n;
    if (currentImageIndex > currentConfig.total) currentImageIndex = 1;
    if (currentImageIndex < 1) currentImageIndex = currentConfig.total;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = document.getElementById('lightbox-img');
    const { folder, prefix, extension } = currentConfig;
    img.src = `${folder}${prefix} (${currentImageIndex})${extension}`;
}

/* --- 3. ANIMACJE SCROLLOWANIA (FADE IN) --- */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-section').forEach((el) => {
        observer.observe(el);
    });
}

/* --- 4. NAWIGACJA (SMART NAV & PREFETCH) --- */
function initSmartNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 50) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
        lastScrollY = currentScrollY;
    });
}

function initLinkPrefetch() {
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const url = this.getAttribute('href');
            if (!url || url.startsWith('http') || url.startsWith('#')) return;
            if (document.head.querySelector(`link[href="${url}"]`)) return;

            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = url;
            document.head.appendChild(prefetchLink);
        });
    });
}

/* --- 5. EFEKT PARALLAX (ZOPTYMALIZOWANY) --- */
let parallaxRunning = false;
let cachedParallaxImages = []; // Cache dla obrazów

function initParallax() {
    // Pierwsze pobranie obrazów (dla statycznych elementów, jeśli są)
    refreshParallaxCache();

    if (parallaxRunning) return;
    parallaxRunning = true;

    function updateParallax() {
        // Używamy cache zamiast querySelectorAll w pętli
        cachedParallaxImages.forEach(img => {
            const rect = img.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Sprawdzamy czy obrazek jest w ogóle widoczny w oknie (+ mały margines)
            if (rect.top < windowHeight && rect.bottom > 0) {
                const center = (rect.top + rect.height / 2) - (windowHeight / 2);
                const speed = 0.1; 
                const yPos = center * speed;
                
                // Używamy translate3d dla akceleracji sprzętowej GPU
                img.style.transform = `scale(1.2) translate3d(0, ${yPos}px, 0)`;
            }
        });
        
        requestAnimationFrame(updateParallax);
    }
    
    requestAnimationFrame(updateParallax);
}

// Funkcja pomocnicza do odświeżania listy obrazów (np. po załadowaniu galerii)
function refreshParallaxCache() {
    cachedParallaxImages = document.querySelectorAll('.masonry-item img');
}


