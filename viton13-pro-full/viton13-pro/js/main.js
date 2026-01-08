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
        try {
            await this.loadTranslations();

            if (!this.translations) {
                console.error('[VITON13] Critical: No translations available after load');
                this.translations = this.getFallbackTranslations();
            }

            this.detectLanguage();
            this.applyTranslations();
            this.setupLanguageSwitcher();
            this.setupNavigation();
            this.setupAnimations();
            this.setupForms();
            this.setupModals();
            this.setupAccordions();

            console.log('[VITON13] Application initialized successfully');
        } catch (error) {
            console.error('[VITON13] Critical initialization error:', error.message);
            this.handleInitError(error);
        }
    }

    handleInitError(error) {
        // Display user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'viton13-init-error';
        errorContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#e74c3c;color:#fff;padding:15px;text-align:center;z-index:10000;font-family:sans-serif;';
        errorContainer.innerHTML = `
            <strong>Application Error:</strong> Some features may not work correctly.
            <button onclick="location.reload()" style="margin-left:10px;padding:5px 15px;cursor:pointer;">Reload Page</button>
        `;
        document.body?.prepend(errorContainer);
    }

    async loadTranslations() {
        const FETCH_TIMEOUT = 10000; // 10 seconds timeout
        const MAX_RETRIES = 2;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

                const response = await fetch('js/translations.json', {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                // Validate translation structure
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid translations format: expected object');
                }

                // Ensure required languages exist
                if (!data.ru || !data.en) {
                    throw new Error('Invalid translations: missing required language (ru/en)');
                }

                this.translations = data;
                return; // Success

            } catch (error) {
                const isLastAttempt = attempt === MAX_RETRIES;
                const errorType = error.name === 'AbortError' ? 'Timeout' : 'Network/Parse';

                console.error(
                    `[VITON13] Translation load failed (${errorType}, attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
                    error.message
                );

                if (isLastAttempt) {
                    console.warn('[VITON13] Using fallback translations');
                    this.translations = this.getFallbackTranslations();
                } else {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }
    }

    getFallbackTranslations() {
        return {
            ru: {
                langSwitch: 'EN',
                nav: { home: 'Главная', about: 'О нас', services: 'Услуги', contact: 'Контакты' },
                errors: { loadFailed: 'Не удалось загрузить данные' }
            },
            en: {
                langSwitch: 'RU',
                nav: { home: 'Home', about: 'About', services: 'Services', contact: 'Contact' },
                errors: { loadFailed: 'Failed to load data' }
            }
        };
    }

    detectLanguage() {
        // 1. Check localStorage (with error handling)
        try {
            if (this.isLocalStorageAvailable()) {
                const savedLang = localStorage.getItem('viton13-lang');
                if (savedLang && this.supportedLangs.includes(savedLang)) {
                    this.currentLang = savedLang;
                    return;
                }
            }
        } catch (error) {
            console.warn('[VITON13] localStorage access failed:', error.message);
        }

        // 2. Check browser language
        try {
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang && browserLang.split('-')[0].toLowerCase() === 'ru') {
                this.currentLang = 'ru';
                return;
            }
        } catch (error) {
            console.warn('[VITON13] Browser language detection failed:', error.message);
        }

        // 3. Check timezone for Russian regions
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const russianTimezones = [
                'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Europe/Volgograd',
                'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Krasnoyarsk',
                'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok', 'Asia/Magadan',
                'Asia/Kamchatka', 'Europe/Minsk', 'Asia/Almaty', 'Asia/Bishkek',
                'Asia/Tashkent', 'Europe/Kiev', 'Europe/Chisinau'
            ];

            if (timezone && russianTimezones.some(tz => timezone.includes(tz.split('/')[1]) || timezone === tz)) {
                this.currentLang = 'ru';
                return;
            }
        } catch (error) {
            console.warn('[VITON13] Timezone detection failed:', error.message);
        }

        // 4. Default to English
        this.currentLang = 'en';
    }

    isLocalStorageAvailable() {
        try {
            const testKey = '__viton13_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    applyTranslations() {
        if (!this.translations) {
            console.warn('[VITON13] Cannot apply translations: translations not loaded');
            return;
        }

        const t = this.translations[this.currentLang];
        if (!t) {
            console.warn(`[VITON13] Translation for language '${this.currentLang}' not found, falling back to 'en'`);
            this.currentLang = 'en';
            const fallback = this.translations['en'];
            if (!fallback) {
                console.error('[VITON13] No fallback translation available');
                return;
            }
        }

        const translations = this.translations[this.currentLang];

        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            try {
                const key = el.getAttribute('data-i18n');
                if (!key) return;
                const value = this.getNestedValue(translations, key);
                if (value !== null) {
                    el.textContent = value;
                } else {
                    console.debug(`[VITON13] Missing translation key: ${key}`);
                }
            } catch (error) {
                console.warn('[VITON13] Error applying translation:', error.message);
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            try {
                const key = el.getAttribute('data-i18n-placeholder');
                if (!key) return;
                const value = this.getNestedValue(translations, key);
                if (value !== null) {
                    el.placeholder = value;
                }
            } catch (error) {
                console.warn('[VITON13] Error applying placeholder translation:', error.message);
            }
        });

        // Update HTML lang
        try {
            document.documentElement.lang = this.currentLang;
        } catch (error) {
            console.warn('[VITON13] Could not set document language:', error.message);
        }

        // Update language switcher
        const langSwitch = document.getElementById('langSwitch');
        if (langSwitch && translations.langSwitch) {
            langSwitch.textContent = translations.langSwitch;
        }
    }

    getNestedValue(obj, path) {
        // Validate parameters
        if (obj === null || obj === undefined) {
            return null;
        }
        if (typeof path !== 'string' || path.trim() === '') {
            console.warn('[VITON13] getNestedValue: invalid path provided');
            return null;
        }

        try {
            return path.split('.').reduce((current, key) => {
                if (current === null || current === undefined) return null;
                return current[key] !== undefined ? current[key] : null;
            }, obj);
        } catch (error) {
            console.warn(`[VITON13] Error getting nested value for path '${path}':`, error.message);
            return null;
        }
    }

    setupLanguageSwitcher() {
        const langSwitch = document.getElementById('langSwitch');
        if (!langSwitch) {
            console.debug('[VITON13] Language switcher element not found');
            return;
        }

        langSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                this.currentLang = this.currentLang === 'ru' ? 'en' : 'ru';

                // Save to localStorage with error handling
                if (this.isLocalStorageAvailable()) {
                    try {
                        localStorage.setItem('viton13-lang', this.currentLang);
                    } catch (storageError) {
                        if (storageError.name === 'QuotaExceededError') {
                            console.warn('[VITON13] localStorage quota exceeded, language preference not saved');
                        } else {
                            console.warn('[VITON13] Could not save language preference:', storageError.message);
                        }
                    }
                }

                this.applyTranslations();
            } catch (error) {
                console.error('[VITON13] Error switching language:', error.message);
            }
        });
    }

    setupNavigation() {
        try {
            // Mobile menu toggle
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const navMenu = document.querySelector('.nav-menu');
            const mobileMenu = document.querySelector('.mobile-menu');

            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', () => {
                    try {
                        mobileMenuBtn.classList.toggle('active');
                        if (navMenu) navMenu.classList.toggle('active');
                        if (mobileMenu) mobileMenu.classList.toggle('active');
                        document.body?.classList.toggle('menu-open');
                    } catch (error) {
                        console.error('[VITON13] Error toggling mobile menu:', error.message);
                    }
                });
            }

            // Close mobile menu on link click
            document.querySelectorAll('.mobile-menu a').forEach(link => {
                link.addEventListener('click', () => {
                    try {
                        if (mobileMenu) mobileMenu.classList.remove('active');
                        if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
                        document.body?.classList.remove('menu-open');
                    } catch (error) {
                        console.error('[VITON13] Error closing mobile menu:', error.message);
                    }
                });
            });

            // Navbar scroll effect
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                window.addEventListener('scroll', () => {
                    try {
                        navbar.classList.toggle('scrolled', window.scrollY > 50);
                    } catch (error) {
                        console.error('[VITON13] Error handling scroll:', error.message);
                    }
                });
            }

            // Smooth scroll with error handling
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    try {
                        const href = this.getAttribute('href');
                        if (href !== '#' && href.length > 1) {
                            e.preventDefault();
                            // Validate selector to prevent errors with invalid IDs
                            if (!/^#[\w-]+$/.test(href)) {
                                console.warn(`[VITON13] Invalid anchor href: ${href}`);
                                return;
                            }
                            const target = document.querySelector(href);
                            if (target) {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                                console.debug(`[VITON13] Scroll target not found: ${href}`);
                            }
                        }
                    } catch (error) {
                        console.error('[VITON13] Error handling smooth scroll:', error.message);
                    }
                });
            });

            // Dropdown menus (desktop)
            document.querySelectorAll('.nav-item.dropdown').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    try {
                        item.querySelector('.dropdown-menu')?.classList.add('show');
                    } catch (error) {
                        console.error('[VITON13] Error showing dropdown:', error.message);
                    }
                });
                item.addEventListener('mouseleave', () => {
                    try {
                        item.querySelector('.dropdown-menu')?.classList.remove('show');
                    } catch (error) {
                        console.error('[VITON13] Error hiding dropdown:', error.message);
                    }
                });
            });
        } catch (error) {
            console.error('[VITON13] Failed to setup navigation:', error.message);
        }
    }

    setupAnimations() {
        try {
            // Check if IntersectionObserver is supported
            if (!('IntersectionObserver' in window)) {
                console.warn('[VITON13] IntersectionObserver not supported, animations disabled');
                return;
            }

            // Intersection Observer for scroll animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    try {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                        }
                    } catch (error) {
                        console.error('[VITON13] Error in animation observer:', error.message);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

            document.querySelectorAll('.animate-on-scroll, .eco-card, .news-card, .service-card').forEach(el => {
                try {
                    el.classList.add('will-animate');
                    observer.observe(el);
                } catch (error) {
                    console.error('[VITON13] Error observing element:', error.message);
                }
            });

            // Card flip animations
            document.querySelectorAll('.flip-card').forEach(card => {
                card.addEventListener('click', () => {
                    try {
                        card.classList.toggle('flipped');
                    } catch (error) {
                        console.error('[VITON13] Error flipping card:', error.message);
                    }
                });
            });
        } catch (error) {
            console.error('[VITON13] Failed to setup animations:', error.message);
        }
    }

    setupForms() {
        try {
            // Character counter for textareas
            document.querySelectorAll('textarea[data-count]').forEach(textarea => {
                try {
                    const counterId = textarea.dataset.count;
                    if (!counterId) {
                        console.warn('[VITON13] Textarea has data-count but no value');
                        return;
                    }
                    const counter = document.getElementById(counterId);
                    if (counter) {
                        textarea.addEventListener('input', () => {
                            try {
                                counter.textContent = textarea.value.length;
                            } catch (error) {
                                console.error('[VITON13] Error updating character count:', error.message);
                            }
                        });
                    } else {
                        console.debug(`[VITON13] Character counter element not found: ${counterId}`);
                    }
                } catch (error) {
                    console.error('[VITON13] Error setting up textarea counter:', error.message);
                }
            });

            // Form validation
            document.querySelectorAll('form').forEach(form => {
                form.addEventListener('submit', (e) => {
                    try {
                        e.preventDefault();

                        // Basic form validation
                        const isValid = this.validateForm(form);
                        if (!isValid) {
                            console.log('[VITON13] Form validation failed');
                            return;
                        }

                        console.log('[VITON13] Form submitted successfully');
                    } catch (error) {
                        console.error('[VITON13] Error handling form submission:', error.message);
                    }
                });
            });

            // Multi-step forms
            this.setupMultiStepForms();
        } catch (error) {
            console.error('[VITON13] Failed to setup forms:', error.message);
        }
    }

    validateForm(form) {
        if (!form) {
            console.error('[VITON13] validateForm: no form element provided');
            return false;
        }

        let isValid = true;
        const errors = [];

        // Validate required fields
        form.querySelectorAll('[required]').forEach(field => {
            try {
                const value = field.value?.trim();
                if (!value) {
                    isValid = false;
                    errors.push(`Field '${field.name || field.id || 'unknown'}' is required`);
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            } catch (error) {
                console.error('[VITON13] Error validating field:', error.message);
            }
        });

        // Validate email fields
        form.querySelectorAll('input[type="email"]').forEach(field => {
            try {
                const value = field.value?.trim();
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    isValid = false;
                    errors.push(`Invalid email format: ${field.name || field.id || 'unknown'}`);
                    field.classList.add('error');
                }
            } catch (error) {
                console.error('[VITON13] Error validating email:', error.message);
            }
        });

        // Validate phone fields
        form.querySelectorAll('input[type="tel"]').forEach(field => {
            try {
                const value = field.value?.trim();
                if (value && !/^[\d\s\-+()]+$/.test(value)) {
                    isValid = false;
                    errors.push(`Invalid phone format: ${field.name || field.id || 'unknown'}`);
                    field.classList.add('error');
                }
            } catch (error) {
                console.error('[VITON13] Error validating phone:', error.message);
            }
        });

        if (!isValid) {
            console.warn('[VITON13] Form validation errors:', errors);
        }

        return isValid;
    }

    setupMultiStepForms() {
        try {
            const forms = document.querySelectorAll('.multi-step-form');
            forms.forEach(form => {
                try {
                    const steps = form.querySelectorAll('.form-step');
                    const nextBtns = form.querySelectorAll('.btn-next');
                    const prevBtns = form.querySelectorAll('.btn-prev');
                    let currentStep = 0;

                    if (steps.length === 0) {
                        console.debug('[VITON13] Multi-step form has no steps');
                        return;
                    }

                    const showStep = (index) => {
                        try {
                            if (index < 0 || index >= steps.length) {
                                console.warn(`[VITON13] Invalid step index: ${index}`);
                                return;
                            }
                            steps.forEach((step, i) => {
                                step.classList.toggle('active', i === index);
                            });
                        } catch (error) {
                            console.error('[VITON13] Error showing step:', error.message);
                        }
                    };

                    nextBtns.forEach(btn => {
                        btn.addEventListener('click', () => {
                            try {
                                if (currentStep < steps.length - 1) {
                                    currentStep++;
                                    showStep(currentStep);
                                }
                            } catch (error) {
                                console.error('[VITON13] Error navigating to next step:', error.message);
                            }
                        });
                    });

                    prevBtns.forEach(btn => {
                        btn.addEventListener('click', () => {
                            try {
                                if (currentStep > 0) {
                                    currentStep--;
                                    showStep(currentStep);
                                }
                            } catch (error) {
                                console.error('[VITON13] Error navigating to previous step:', error.message);
                            }
                        });
                    });
                } catch (error) {
                    console.error('[VITON13] Error setting up multi-step form:', error.message);
                }
            });
        } catch (error) {
            console.error('[VITON13] Failed to setup multi-step forms:', error.message);
        }
    }

    setupModals() {
        try {
            // Modal open/close
            document.querySelectorAll('[data-modal]').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    try {
                        e.preventDefault();
                        const modalId = trigger.dataset.modal;
                        if (!modalId) {
                            console.warn('[VITON13] Modal trigger has no data-modal attribute value');
                            return;
                        }
                        const modal = document.getElementById(modalId);
                        if (modal) {
                            modal.classList.add('active');
                        } else {
                            console.warn(`[VITON13] Modal not found: ${modalId}`);
                        }
                    } catch (error) {
                        console.error('[VITON13] Error opening modal:', error.message);
                    }
                });
            });

            document.querySelectorAll('.modal-close, .modal-overlay').forEach(closer => {
                closer.addEventListener('click', () => {
                    try {
                        document.querySelectorAll('.modal').forEach(modal => {
                            modal.classList.remove('active');
                        });
                    } catch (error) {
                        console.error('[VITON13] Error closing modals:', error.message);
                    }
                });
            });

            // Close on Escape
            document.addEventListener('keydown', (e) => {
                try {
                    if (e.key === 'Escape') {
                        document.querySelectorAll('.modal').forEach(modal => {
                            modal.classList.remove('active');
                        });
                    }
                } catch (error) {
                    console.error('[VITON13] Error handling Escape key:', error.message);
                }
            });
        } catch (error) {
            console.error('[VITON13] Failed to setup modals:', error.message);
        }
    }

    setupAccordions() {
        try {
            document.querySelectorAll('.accordion-header').forEach(header => {
                header.addEventListener('click', () => {
                    try {
                        const item = header.parentElement;
                        if (!item) {
                            console.warn('[VITON13] Accordion header has no parent element');
                            return;
                        }
                        const isOpen = item.classList.contains('open');

                        // Close all others
                        document.querySelectorAll('.accordion-item').forEach(i => {
                            try {
                                i.classList.remove('open');
                            } catch (err) {
                                console.error('[VITON13] Error closing accordion item:', err.message);
                            }
                        });

                        // Toggle current
                        if (!isOpen) item.classList.add('open');
                    } catch (error) {
                        console.error('[VITON13] Error toggling accordion:', error.message);
                    }
                });
            });

            // Mobile dropdown accordions
            document.querySelectorAll('.mobile-menu .has-submenu > a').forEach(link => {
                link.addEventListener('click', (e) => {
                    try {
                        e.preventDefault();
                        const parent = link.parentElement;
                        if (parent) {
                            parent.classList.toggle('open');
                        } else {
                            console.warn('[VITON13] Submenu link has no parent element');
                        }
                    } catch (error) {
                        console.error('[VITON13] Error toggling submenu:', error.message);
                    }
                });
            });
        } catch (error) {
            console.error('[VITON13] Failed to setup accordions:', error.message);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new VITON13();
        app.init().catch(error => {
            console.error('[VITON13] Async initialization error:', error.message);
        });
        window.viton13 = app;
    } catch (error) {
        console.error('[VITON13] Critical error during app initialization:', error.message);
        // Display user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#e74c3c;color:#fff;padding:15px;text-align:center;z-index:10000;font-family:sans-serif;';
        errorDiv.innerHTML = `
            <strong>Application Error:</strong> Failed to initialize. Please refresh the page.
            <button onclick="location.reload()" style="margin-left:10px;padding:5px 15px;cursor:pointer;">Reload</button>
        `;
        document.body?.prepend(errorDiv);
    }
});

// Page-specific initializations
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Calculator (Designer page)
        const calcForm = document.querySelector('.calculator-form');
        if (calcForm) {
            initCalculator();
        }
    } catch (error) {
        console.error('[VITON13] Error in page-specific initialization:', error.message);
    }
});

function initCalculator() {
    try {
        const steps = document.querySelectorAll('.calc-step');
        let currentStep = 0;

        if (steps.length === 0) {
            console.warn('[VITON13] Calculator: No steps found');
            return;
        }

        const nextBtns = document.querySelectorAll('.calc-next');
        const prevBtns = document.querySelectorAll('.calc-prev');

        const showStep = (index) => {
            try {
                if (index < 0 || index >= steps.length) {
                    console.warn(`[VITON13] Calculator: Invalid step index ${index}`);
                    return;
                }
                steps.forEach((step, i) => {
                    step.style.display = i === index ? 'block' : 'none';
                });
                updateProgress(index);
            } catch (error) {
                console.error('[VITON13] Calculator: Error showing step:', error.message);
            }
        };

        const updateProgress = (index) => {
            try {
                const progress = document.querySelector('.calc-progress');
                if (progress) {
                    progress.textContent = `${index + 1} / ${steps.length}`;
                }
            } catch (error) {
                console.error('[VITON13] Calculator: Error updating progress:', error.message);
            }
        };

        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                try {
                    if (currentStep < steps.length - 1) {
                        currentStep++;
                        showStep(currentStep);
                    }
                } catch (error) {
                    console.error('[VITON13] Calculator: Error navigating next:', error.message);
                }
            });
        });

        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                try {
                    if (currentStep > 0) {
                        currentStep--;
                        showStep(currentStep);
                    }
                } catch (error) {
                    console.error('[VITON13] Calculator: Error navigating previous:', error.message);
                }
            });
        });

        showStep(0);
        console.log('[VITON13] Calculator initialized successfully');
    } catch (error) {
        console.error('[VITON13] Failed to initialize calculator:', error.message);
    }
}
