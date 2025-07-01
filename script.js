document.addEventListener("DOMContentLoaded", function () {
  // Initialize session tracking
  auth.initializeSessionTracking();

  // Create menu toggle button if it doesn't exist
  setupMobileMenu();

  // Handle route protection
  handleRouteProtection();

  // Setup all logout links and buttons
  setupLogoutButtons();
});

// Set up mobile menu toggle functionality
function setupMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");

  // Make sure we have a menu toggle button and sidebar
  if (!menuToggle || !sidebar) {
    console.error("Menu toggle button or sidebar not found");
    return;
  }

  // Remove any existing click event listeners
  const clonedMenuToggle = menuToggle.cloneNode(true);
  menuToggle.parentNode.replaceChild(clonedMenuToggle, menuToggle);

  // Add our click event listener
  clonedMenuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("active");
    this.classList.toggle("active");
    console.log(
      "Menu toggle clicked, sidebar active:",
      sidebar.classList.contains("active")
    );
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (
      sidebar &&
      !sidebar.contains(e.target) &&
      clonedMenuToggle &&
      !clonedMenuToggle.contains(e.target) &&
      sidebar.classList.contains("active")
    ) {
      sidebar.classList.remove("active");
      clonedMenuToggle.classList.remove("active");
      console.log("Clicked outside, closing sidebar");
    }
  });

  // Log debug information
  console.log("Mobile menu setup complete.");

  // Make sure the menu is visible on mobile
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  console.log("Viewport width:", viewportWidth);

  // Force proper display of menu toggle on small screens
  if (viewportWidth <= 768) {
    clonedMenuToggle.style.display = "block";
    sidebar.style.transition = "transform 0.3s ease";
    console.log("Mobile view detected, ensuring menu toggle is visible");
  }
}

// Handle route protection based on authentication status
function handleRouteProtection() {
  // Public pages - accessible to everyone
  const publicPages = [
    "index.html",
    "about.html",
    "services.html",
    "gallery.html",
    "blog.html",
    "contact.html"
  ];

  // Protected pages - require authentication (like user profile, settings, etc.)
  const protectedPages = [
    "Comments.html",
    "profile.html",
    // Add future user-specific pages here
    // "settings.html",
    // "dashboard.html"
  ];

  const authPages = ["login.html", "register.html"];

  // Get current page, default to index.html if on the root path
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  console.log("Current page:", currentPage);

  // Always refresh the token from localStorage first
  auth.refreshToken();

  const isAuthenticated = auth.isAuthenticated();
  console.log(
    "Authentication status:",
    isAuthenticated ? "Logged in" : "Not logged in"
  );

  // PROTECTED ROUTES: Only redirect to login if accessing truly protected pages
  if (!isAuthenticated && protectedPages.includes(currentPage)) {
    console.log("Access denied: Authentication required for this page, redirecting to login");
    showToast("Please login to access this page", "error");
    setTimeout(() => {
      window.location.replace("login.html");
    }, 1500);
    return;
  }

  // AUTH PAGES: If authenticated and trying to access auth pages (login/register)
  if (isAuthenticated && authPages.includes(currentPage)) {
    console.log("Already authenticated, redirecting to home");
    window.location.replace("index.html");
    return;
  }

  // Update navigation based on authentication status
  updateNavigationForAuthStatus(isAuthenticated);
}

// Update navigation based on authentication status
function updateNavigationForAuthStatus(isAuthenticated) {
  // Handle logout links for authenticated users
  if (isAuthenticated) {
    setupLogoutButtons();
    
    // Hide login/register links and show logout + profile
    document.querySelectorAll('.auth-login-link').forEach(link => {
      link.style.display = 'none';
    });
    document.querySelectorAll('.auth-register-link').forEach(link => {
      link.style.display = 'none';
    });
    document.querySelectorAll('#logout-link').forEach(link => {
      link.style.display = 'block';
      link.textContent = 'LOGOUT';
    });
    
    // Show profile links for authenticated users
    document.querySelectorAll('.profile-link').forEach(link => {
      link.style.display = 'block';
    });
    
    // Update profile display name if available
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    if (userName || userEmail) {
      document.querySelectorAll('.user-name-display').forEach(elem => {
        elem.textContent = userName || userEmail.split('@')[0];
      });
    }
  } else {
    // Show login/register links and hide logout + profile
    document.querySelectorAll('.auth-login-link').forEach(link => {
      link.style.display = 'block';
    });
    document.querySelectorAll('.auth-register-link').forEach(link => {
      link.style.display = 'block';
    });
    document.querySelectorAll('#logout-link').forEach(link => {
      link.textContent = 'LOGIN';
      link.href = 'login.html';
      link.onclick = null; // Remove logout handler
    });
    
    // Hide profile links for non-authenticated users
    document.querySelectorAll('.profile-link').forEach(link => {
      link.style.display = 'none';
    });
  }
}

// Setup all logout links and buttons throughout the application
function setupLogoutButtons() {
  // Handle any logout link or button with id="logout-link" throughout the site
  document.querySelectorAll('[id="logout-link"]').forEach((link) => {
    // Remove any existing click handlers to prevent duplicates
    link.removeEventListener("click", handleLogout);
    link.addEventListener("click", handleLogout);
    link.href = "#"; // Prevent default navigation
  });

  // Handle any element with class="logout-button" throughout the site
  document.querySelectorAll(".logout-button").forEach((button) => {
    // Remove any existing click handlers to prevent duplicates
    button.removeEventListener("click", handleLogout);
    button.addEventListener("click", handleLogout);
  });
}

// Single handler for logout to prevent duplicate executions
function handleLogout(e) {
  if (e) e.preventDefault();
  // Prevent multiple logout executions
  if (!auth.isLoggingOut) {
    auth.logout();
  }
}

// Import Firebase auth
// Import Firebase auth - commented out for now to maintain compatibility
// import { firebaseAuth } from "./firebase-auth.js";

// Enhanced auth object with session management
const auth = {
  token: localStorage.getItem("token"),
  userId: localStorage.getItem("userId"),
  isLoggingOut: false,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes of inactivity warning
  timeoutWarningShown: false,

  refreshToken: function () {
    this.token = localStorage.getItem("token");
    this.userId = localStorage.getItem("userId");
    return this.token;
  },

  isAuthenticated: function () {
    // Check localStorage tokens (Firebase compatible)
    const hasToken = this.token !== null && this.token !== undefined && this.token !== "";
    
    // Check session expiration
    if (hasToken && this.isSessionExpired()) {
      this.handleSessionExpiration();
      return false;
    }
    
    return hasToken;
  },

  isSessionExpired: function() {
    const loginTime = localStorage.getItem('loginTime');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (!loginTime || !lastActivity) return false;
    
    const now = Date.now();
    const timeSinceLogin = now - parseInt(loginTime);
    const timeSinceActivity = now - parseInt(lastActivity);
    
    // Session expires after 24 hours OR 2 hours of inactivity
    return timeSinceLogin > this.sessionTimeout || timeSinceActivity > (2 * 60 * 60 * 1000);
  },

  updateLastActivity: function() {
    if (this.isAuthenticated()) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  },

  handleSessionExpiration: function() {
    // Clear auth data but don't redirect
    this.token = null;
    this.userId = null;
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("lastActivity");
    
    // Show session expired banner instead of redirecting
    this.showSessionExpiredBanner();
    
    // Update navigation to show login state
    updateNavigationForAuthStatus(false);
  },

  showSessionExpiredBanner: function() {
    // Remove existing banner if any
    const existingBanner = document.querySelector('.session-expired-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Create session expired banner
    const banner = document.createElement('div');
    banner.className = 'session-expired-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-message">
          <i class="fas fa-clock"></i>
          <span>Your session has expired. Please <a href="login.html" class="banner-login-link">login</a> to continue accessing your account features.</span>
        </div>
        <button class="banner-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add banner styles
    if (!document.getElementById('sessionBannerStyles')) {
      const style = document.createElement('style');
      style.id = 'sessionBannerStyles';
      style.textContent = `
        .session-expired-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, #ff6b6b, #ee5a52);
          color: white;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          animation: slideDown 0.5s ease-out;
        }

        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .banner-message {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }

        .banner-message i {
          font-size: 1.2rem;
        }

        .banner-login-link {
          color: white;
          text-decoration: underline;
          font-weight: 600;
          transition: opacity 0.3s ease;
        }

        .banner-login-link:hover {
          opacity: 0.8;
        }

        .banner-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 5px;
          border-radius: 3px;
          transition: background 0.3s ease;
        }

        .banner-close:hover {
          background: rgba(255,255,255,0.2);
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }

        /* Adjust body padding when banner is visible */
        body:has(.session-expired-banner) {
          padding-top: 60px;
        }

        @media (max-width: 768px) {
          .banner-content {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          
          .banner-message {
            justify-content: center;
          }

          body:has(.session-expired-banner) {
            padding-top: 80px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Insert banner at the top of the page
    document.body.insertBefore(banner, document.body.firstChild);

    // Auto-hide banner after 10 seconds
    setTimeout(() => {
      if (banner.parentElement) {
        banner.style.animation = 'slideUp 0.5s ease-in forwards';
        setTimeout(() => banner.remove(), 500);
      }
    }, 10000);
  },

  initializeSessionTracking: function() {
    // Track user activity to extend session
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, { passive: true });
    });

    // Check session status every minute
    setInterval(() => {
      if (this.token && this.isSessionExpired()) {
        this.handleSessionExpiration();
      }
    }, 60000); // Check every minute
  },

  // Parse JWT token to get user ID
  parseToken: function (token) {
    if (!token) return null;
    try {
      // Split the token and get the payload part (second part)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      // Decode the base64 string
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing JWT token:", error);
      return null;
    }
  },

  login: async function (email, password) {
    try {
      // Use Firebase Auth directly since we're transitioning away from custom backend
      const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      const { auth } = await import("./config.js");
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store user info for compatibility with existing code
      this.token = user.accessToken || "firebase-auth";
      this.userId = user.uid;
      localStorage.setItem("token", this.token);
      localStorage.setItem("userId", user.uid);
      localStorage.setItem("userEmail", user.email);
      
      // Initialize session tracking
      localStorage.setItem('loginTime', Date.now().toString());
      localStorage.setItem('lastActivity', Date.now().toString());
      
      showToast("Login successful", "success");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          errorMessage = error.message;
      }
      
      showToast(errorMessage, "error");
      throw new Error(errorMessage);
    }
  },

  register: async function (email, password, username) {
    try {
      // Use Firebase Auth directly
      const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const { auth, db } = await import("./config.js");
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, {
        displayName: username
      });

      // Create user profile in Firestore
      await setDoc(doc(db, "userProfiles", user.uid), {
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      showToast("Registration successful", "success");
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters";
          break;
        default:
          errorMessage = error.message;
      }
      
      showToast(errorMessage, "error");
      throw new Error(errorMessage);
    }
  },

  logout: async function () {
    // If already logging out, don't execute again
    if (this.isLoggingOut) return;

    try {
      // Set flag to prevent multiple logout calls
      this.isLoggingOut = true;

      // Use Firebase signOut
      const { signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      const { auth } = await import("./config.js");
      
      await signOut(auth);

      // Clear local storage
      this.token = null;
      this.userId = null;
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("lastActivity");

      showToast("You have been logged out successfully", "success");

      // Manual logout redirects to homepage (better for consultancy business)
      setTimeout(() => {
        window.location.replace("index.html");
      }, 800);
    } catch (error) {
      console.error("Error during logout:", error);
      // Reset logging out flag in case of error
      this.isLoggingOut = false;
      // Force redirect even if there was an error
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("lastActivity");
      window.location.replace("index.html");
    }
  },
};

// Toast notification system
const showToast = (message, type = "success") => {
  const toastContainer =
    document.querySelector(".toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = "slideOutTop 0.3s ease-out forwards";
    setTimeout(() => {
      toastContainer.removeChild(toast);
      if (toastContainer.children.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 300);
  }, 3000);
};

const createToastContainer = () => {
  const container = document.createElement("div");
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
};

// Loading spinner system
const showSpinner = () => {
  if (!document.querySelector(".spinner-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "spinner-overlay";
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
};

const hideSpinner = () => {
  const overlay = document.querySelector(".spinner-overlay");
  if (overlay) {
    document.body.removeChild(overlay);
  }
};

// Button loading state
const setButtonLoading = (button, isLoading) => {
  if (isLoading) {
    button.disabled = true;
    button.classList.add("loading");
  } else {
    button.disabled = false;
    button.classList.remove("loading");
  }
};
