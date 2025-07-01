// Welcome banner for new visitors
// This shows a friendly message encouraging exploration before account creation

function createWelcomeBanner() {
  // Only show banner if user is not authenticated and hasn't dismissed it
  const isAuthenticated = auth.isAuthenticated();
  const bannerDismissed = localStorage.getItem('welcomeBannerDismissed') === 'true';
  
  if (isAuthenticated || bannerDismissed) {
    return;
  }

  // Create banner element
  const banner = document.createElement('div');
  banner.className = 'welcome-banner';
  banner.innerHTML = `
    <div class="welcome-banner-content">
      <div class="welcome-text">
        <h3>🌾 Welcome to AgGenius!</h3>
        <p>Explore our agricultural consultancy services, expert advice, and resources. Take a look around - you can create an account anytime to unlock additional features!</p>
      </div>
      <div class="welcome-actions">
        <button class="btn-welcome-explore" onclick="dismissWelcomeBanner()">
          Continue Exploring
        </button>
        <button class="btn-welcome-signup" onclick="goToSignup()">
          Create Account
        </button>
        <button class="btn-welcome-close" onclick="dismissWelcomeBanner()" aria-label="Close">
          ×
        </button>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .welcome-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: white;
      padding: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    }
    
    .welcome-banner.show {
      transform: translateY(0);
    }
    
    .welcome-banner-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    
    .welcome-text h3 {
      margin: 0 0 5px 0;
      font-size: 1.2em;
      font-weight: 600;
    }
    
    .welcome-text p {
      margin: 0;
      font-size: 0.9em;
      opacity: 0.95;
      line-height: 1.4;
    }
    
    .welcome-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-shrink: 0;
    }
    
    .btn-welcome-explore,
    .btn-welcome-signup {
      padding: 8px 16px;
      border: 2px solid white;
      background: transparent;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .btn-welcome-explore:hover {
      background: rgba(255,255,255,0.2);
    }
    
    .btn-welcome-signup {
      background: white;
      color: #4CAF50;
    }
    
    .btn-welcome-signup:hover {
      background: #f5f5f5;
    }
    
    .btn-welcome-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.5em;
      cursor: pointer;
      padding: 5px;
      line-height: 1;
      opacity: 0.8;
    }
    
    .btn-welcome-close:hover {
      opacity: 1;
    }
    
    @media (max-width: 768px) {
      .welcome-banner-content {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }
      
      .welcome-actions {
        width: 100%;
        justify-content: center;
      }
      
      .btn-welcome-close {
        position: absolute;
        top: 10px;
        right: 15px;
      }
    }
  `;

  // Add to page
  document.head.appendChild(style);
  document.body.appendChild(banner);
  
  // Adjust body padding to account for banner
  document.body.style.paddingTop = '80px';
  
  // Show banner with animation
  setTimeout(() => {
    banner.classList.add('show');
  }, 500);
}

function dismissWelcomeBanner() {
  const banner = document.querySelector('.welcome-banner');
  if (banner) {
    banner.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      banner.remove();
      document.body.style.paddingTop = '0';
    }, 300);
  }
  
  // Remember that user dismissed the banner
  localStorage.setItem('welcomeBannerDismissed', 'true');
}

function goToSignup() {
  window.location.href = 'register.html';
}

// Initialize banner when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to ensure auth state is checked first
  setTimeout(createWelcomeBanner, 1000);
});

export { createWelcomeBanner, dismissWelcomeBanner, goToSignup }; 