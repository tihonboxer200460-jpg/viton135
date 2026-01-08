/* ========================================
   VITON13 Professional - Main JavaScript
   Language Detection + Site Functionality
   ======================================== */

class VITON13 {
    constructor() {
        this.translations = null;
        this.currentLang = 'ru';
        this.supportedLangs = ['ru', 'en'];
    }

    async init() {
        await this.loadTranslations();
        this.detectLanguage();
        this.applyTranslations();
        this.setupLanguageSwitcher();
        this.setupNavigation();
        this.setupAnimations();
        this.setupForms();
        this.setupModals();
        this.setupAccordions();
    }

    async loadTranslations() {
        try {
            const response = await fetch('js/translations.json');
            this.translations = await response.json();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    detectLanguage() {
        // 1. Check localStorage
        const savedLang = localStorage.getItem('viton13-lang');
        if (savedLang && this.supportedLangs.includes(savedLang)) {
            this.currentLang = savedLang;
            return;
        }

        // 2. Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.split('-')[0].toLowerCase() === 'ru') {
            this.currentLang = 'ru';
            return;
        }

        // 3. Check timezone for Russian regions
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const russianTimezones = [
            'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Europe/Volgograd',
            'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Krasnoyarsk',
            'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok', 'Asia/Magadan',
            'Asia/Kamchatka', 'Europe/Minsk', 'Asia/Almaty', 'Asia/Bishkek',
            'Asia/Tashkent', 'Europe/Kiev', 'Europe/Chisinau'
        ];
        
        if (russianTimezones.some(tz => timezone.includes(tz.split('/')[1]) || timezone === tz)) {
            this.currentLang = 'ru';
            return;
        }

        // 4. Default to English
        this.currentLang = 'en';
    }

    applyTranslations() {
        if (!this.translations) return;
        const t = this.translations[this.currentLang];

        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = this.getNestedValue(t, key);
            if (value) el.textContent = value;
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const value = this.getNestedValue(t, key);
            if (value) el.placeholder = value;
        });

        // Update HTML lang
        document.documentElement.lang = this.currentLang;

        // Update language switcher
        const langSwitch = document.getElementById('langSwitch');
        if (langSwitch) langSwitch.textContent = t.langSwitch;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : null, obj);
    }

    setupLanguageSwitcher() {
        const langSwitch = document.getElementById('langSwitch');
        if (langSwitch) {
            langSwitch.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentLang = this.currentLang === 'ru' ? 'en' : 'ru';
                localStorage.setItem('viton13-lang', this.currentLang);
                this.applyTranslations();
            });
        }
    }

    setupNavigation() {
        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenuBtn.classList.toggle('active');
                if (navMenu) navMenu.classList.toggle('active');
                if (mobileMenu) mobileMenu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        }

        // Close mobile menu on link click
        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu) mobileMenu.classList.remove('active');
                if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        // Navbar scroll effect
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
            });
        }

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.length > 1) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });

        // Dropdown menus (desktop)
        document.querySelectorAll('.nav-item.dropdown').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.querySelector('.dropdown-menu')?.classList.add('show');
            });
            item.addEventListener('mouseleave', () => {
                item.querySelector('.dropdown-menu')?.classList.remove('show');
            });
        });
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.animate-on-scroll, .eco-card, .news-card, .service-card').forEach(el => {
            el.classList.add('will-animate');
            observer.observe(el);
        });

        // Card flip animations
        document.querySelectorAll('.flip-card').forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });
        });
    }

    setupForms() {
        // Character counter for textareas
        document.querySelectorAll('textarea[data-count]').forEach(textarea => {
            const counter = document.getElementById(textarea.dataset.count);
            if (counter) {
                textarea.addEventListener('input', () => {
                    counter.textContent = textarea.value.length;
                });
            }
        });

        // Form validation
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                // Add your form submission logic here
                console.log('Form submitted');
            });
        });

        // Multi-step forms
        this.setupMultiStepForms();
    }

    setupMultiStepForms() {
        const forms = document.querySelectorAll('.multi-step-form');
        forms.forEach(form => {
            const steps = form.querySelectorAll('.form-step');
            const nextBtns = form.querySelectorAll('.btn-next');
            const prevBtns = form.querySelectorAll('.btn-prev');
            let currentStep = 0;

            const showStep = (index) => {
                steps.forEach((step, i) => {
                    step.classList.toggle('active', i === index);
                });
            };

            nextBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (currentStep < steps.length - 1) {
                        currentStep++;
                        showStep(currentStep);
                    }
                });
            });

            prevBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (currentStep > 0) {
                        currentStep--;
                        showStep(currentStep);
                    }
                });
            });
        });
    }

    setupModals() {
        // Modal open/close
        document.querySelectorAll('[data-modal]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.dataset.modal;
                const modal = document.getElementById(modalId);
                if (modal) modal.classList.add('active');
            });
        });

        document.querySelectorAll('.modal-close, .modal-overlay').forEach(closer => {
            closer.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            });
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }

    setupAccordions() {
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                const isOpen = item.classList.contains('open');
                
                // Close all others
                document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
                
                // Toggle current
                if (!isOpen) item.classList.add('open');
            });
        });

        // Mobile dropdown accordions
        document.querySelectorAll('.mobile-menu .has-submenu > a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                link.parentElement.classList.toggle('open');
            });
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new VITON13();
    app.init();
    window.viton13 = app;
});

// Page-specific initializations
document.addEventListener('DOMContentLoaded', () => {
    // Calculator (Designer page)
    const calcForm = document.querySelector('.calculator-form');
    if (calcForm) {
        initCalculator();
    }
});

function initCalculator() {
    const steps = document.querySelectorAll('.calc-step');
    let currentStep = 0;

    const nextBtns = document.querySelectorAll('.calc-next');
    const prevBtns = document.querySelectorAll('.calc-prev');

    const showStep = (index) => {
        steps.forEach((step, i) => {
            step.style.display = i === index ? 'block' : 'none';
        });
        updateProgress(index);
    };

    const updateProgress = (index) => {
        const progress = document.querySelector('.calc-progress');
        if (progress) {
            progress.textContent = `${index + 1} / ${steps.length}`;
        }
    };

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    showStep(0);
}
