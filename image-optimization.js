// Image Optimization and Lazy Loading System
// Provides comprehensive image loading optimization for better performance

class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.backgroundImages = [];
    this.loadingPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.createIntersectionObserver();
    this.handleRegularImages();
    this.handleBackgroundImages();
    this.addErrorHandling();
    this.addProgressIndicator();
  }

  createIntersectionObserver() {
    // Check if Intersection Observer is supported
    if (!window.IntersectionObserver) {
      this.fallbackLoading();
      return;
    }

    const config = {
      root: null,
      rootMargin: '50px 0px', // Start loading 50px before image comes into view
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, config);
  }

  handleRegularImages() {
    // Handle images with loading="lazy" attribute
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    lazyImages.forEach(img => {
      // Add loading class for styling
      img.classList.add('lazy-loading');
      
      // Store original src and replace with placeholder if needed
      if (!img.dataset.src && img.src && img.src !== this.loadingPlaceholder) {
        img.dataset.src = img.src;
        img.src = this.loadingPlaceholder;
      }

      // Observe the image
      if (this.observer) {
        this.observer.observe(img);
      }
    });
  }

  handleBackgroundImages() {
    // Find elements with background images that should be lazy loaded
    const bgElements = document.querySelectorAll('.lazy-bg, .about-header, .homepage-header, .services-header, .gallery-header, .contact-header, .blog-header');
    
    bgElements.forEach(element => {
      const bgImage = window.getComputedStyle(element).backgroundImage;
      
      if (bgImage && bgImage !== 'none' && !bgImage.includes('data:')) {
        // Extract URL from CSS background-image
        const urlMatch = bgImage.match(/url\(['"]?([^'"]*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          element.dataset.bgSrc = urlMatch[1];
          element.style.backgroundImage = 'none';
          element.classList.add('lazy-bg-loading');
          
          if (this.observer) {
            this.observer.observe(element);
          }
        }
      }
    });
  }

  loadImage(element) {
    if (element.tagName === 'IMG') {
      this.loadRegularImage(element);
    } else if (element.dataset.bgSrc) {
      this.loadBackgroundImage(element);
    }
  }

  loadRegularImage(img) {
    const src = img.dataset.src || img.src;
    
    if (!src || src === this.loadingPlaceholder) return;

    // Create a new image to preload
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      // Image loaded successfully
      img.src = src;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // Add fade-in animation
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        img.style.opacity = '1';
      }, 10);
    };

    imageLoader.onerror = () => {
      // Handle error
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      img.alt = img.alt ? `${img.alt} (Failed to load)` : 'Image failed to load';
      console.warn('Failed to load image:', src);
    };

    imageLoader.src = src;
  }

  loadBackgroundImage(element) {
    const src = element.dataset.bgSrc;
    
    if (!src) return;

    // Create a new image to preload
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      // Image loaded successfully
      element.style.backgroundImage = `url('${src}')`;
      element.classList.remove('lazy-bg-loading');
      element.classList.add('lazy-bg-loaded');
      
      // Add fade-in animation
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        element.style.opacity = '1';
      }, 10);
    };

    imageLoader.onerror = () => {
      // Handle error
      element.classList.remove('lazy-bg-loading');
      element.classList.add('lazy-bg-error');
      console.warn('Failed to load background image:', src);
    };

    imageLoader.src = src;
  }

  fallbackLoading() {
    // For browsers that don't support Intersection Observer
    console.log('Using fallback image loading...');
    
    // Load all images immediately
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });

    // Load all background images immediately
    const bgElements = document.querySelectorAll('[data-bg-src]');
    bgElements.forEach(element => {
      if (element.dataset.bgSrc) {
        element.style.backgroundImage = `url('${element.dataset.bgSrc}')`;
      }
    });
  }

  addErrorHandling() {
    // Global error handler for images
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        e.target.classList.add('image-error');
        console.warn('Image failed to load:', e.target.src);
      }
    }, true);
  }

  addProgressIndicator() {
    // Add loading progress indicator
    let totalImages = 0;
    let loadedImages = 0;

    const updateProgress = () => {
      const progress = totalImages > 0 ? (loadedImages / totalImages) * 100 : 100;
      
      // Dispatch custom event for progress tracking
      document.dispatchEvent(new CustomEvent('imageLoadProgress', {
        detail: { loaded: loadedImages, total: totalImages, progress }
      }));

      if (loadedImages >= totalImages && totalImages > 0) {
        document.dispatchEvent(new CustomEvent('allImagesLoaded'));
      }
    };

    // Count total images
    const countImages = () => {
      totalImages = document.querySelectorAll('img[loading="lazy"], [data-bg-src]').length;
      updateProgress();
    };

    // Track loaded images
    document.addEventListener('load', (e) => {
      if (e.target.tagName === 'IMG' && e.target.hasAttribute('loading')) {
        loadedImages++;
        updateProgress();
      }
    }, true);

    // Count images on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', countImages);
    } else {
      countImages();
    }
  }

  // Public method to manually trigger image loading
  loadAllImages() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const bgElements = document.querySelectorAll('[data-bg-src]');
    
    [...lazyImages, ...bgElements].forEach(element => {
      this.loadImage(element);
    });
  }

  // Public method to add new images to be observed
  observeNewImages(selector) {
    if (!this.observer) return;
    
    const newImages = document.querySelectorAll(selector);
    newImages.forEach(img => {
      if (img.tagName === 'IMG' && img.hasAttribute('loading')) {
        img.classList.add('lazy-loading');
        this.observer.observe(img);
      }
    });
  }
}

// CSS for loading states
const imageOptimizationCSS = `
  /* Image loading states */
  .lazy-loading {
    filter: blur(2px);
    transition: filter 0.3s ease;
  }

  .lazy-loaded {
    filter: none;
  }

  .lazy-error {
    border: 2px dashed #ff6b6b;
    background-color: #fff5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c53030;
    font-size: 14px;
    min-height: 100px;
  }

  .lazy-bg-loading {
    background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    animation: bgSlide 2s linear infinite;
  }

  .lazy-bg-loaded {
    animation: none;
  }

  .lazy-bg-error {
    background: repeating-linear-gradient(
      45deg,
      #ff6b6b,
      #ff6b6b 10px,
      #fff5f5 10px,
      #fff5f5 20px
    );
  }

  @keyframes bgSlide {
    0% { background-position: 0 0, 0 10px, 10px -10px, -10px 0px; }
    100% { background-position: 20px 20px, 20px 30px, 30px 10px, 10px 20px; }
  }

  /* Responsive image improvements */
  img[loading="lazy"] {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Image optimization for different screen sizes */
  @media (max-width: 640px) {
    img[loading="lazy"] {
      image-rendering: optimizeSpeed;
    }
  }

  @media (min-width: 641px) {
    img[loading="lazy"] {
      image-rendering: optimizeQuality;
    }
  }
`;

// Add CSS to head
const addOptimizationStyles = () => {
  const style = document.createElement('style');
  style.textContent = imageOptimizationCSS;
  document.head.appendChild(style);
};

// Initialize image optimizer
let imageOptimizer;

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addOptimizationStyles();
    imageOptimizer = new ImageOptimizer();
  });
} else {
  addOptimizationStyles();
  imageOptimizer = new ImageOptimizer();
}

// Make available globally
window.ImageOptimizer = ImageOptimizer;
window.imageOptimizer = imageOptimizer;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageOptimizer;
} 