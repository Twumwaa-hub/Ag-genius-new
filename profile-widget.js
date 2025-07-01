// Profile Widget - A reusable component for displaying user profile info in navbar
// This creates a dropdown profile menu similar to modern web applications

function createProfileWidget() {
  const isAuthenticated = auth.isAuthenticated();
  if (!isAuthenticated) return;

  // Find profile links and enhance them
  document.querySelectorAll('.profile-link').forEach(profileLink => {
    // Don't modify if already enhanced
    if (profileLink.querySelector('.profile-dropdown')) return;

    // Create profile widget container
    const widget = document.createElement('div');
    widget.className = 'profile-widget';
    widget.innerHTML = `
      <div class="profile-trigger">
        <div class="profile-avatar" id="navProfileAvatar">👤</div>
        <span class="profile-name" id="navProfileName">Profile</span>
        <span class="dropdown-arrow">▼</span>
      </div>
      <div class="profile-dropdown" id="profileDropdown">
        <div class="dropdown-header">
          <div class="dropdown-avatar" id="dropdownAvatar">👤</div>
          <div class="dropdown-user-info">
            <div class="dropdown-name" id="dropdownName">User Name</div>
            <div class="dropdown-email" id="dropdownEmail">user@email.com</div>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        <a href="profile.html" class="dropdown-item">
          <span class="dropdown-icon">⚙️</span>
          <span>Edit Profile</span>
        </a>
        <a href="Comments.html" class="dropdown-item">
          <span class="dropdown-icon">💬</span>
          <span>My Comments</span>
        </a>
        <div class="dropdown-divider"></div>
        <a href="#" class="dropdown-item" onclick="auth.logout()">
          <span class="dropdown-icon">🚪</span>
          <span>Logout</span>
        </a>
      </div>
    `;

    // Add styles
    if (!document.getElementById('profileWidgetStyles')) {
      const style = document.createElement('style');
      style.id = 'profileWidgetStyles';
      style.textContent = `
        .profile-widget {
          position: relative;
          display: inline-block;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.1);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .profile-trigger:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.3);
        }

        .profile-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 2px solid rgba(255,255,255,0.3);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .profile-name {
          font-weight: 500;
          font-size: 14px;
        }

        .dropdown-arrow {
          font-size: 10px;
          transition: transform 0.3s ease;
        }

        .profile-widget.active .dropdown-arrow {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          min-width: 250px;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          margin-top: 5px;
        }

        .profile-widget.active .profile-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
          border-radius: 8px 8px 0 0;
        }

        .dropdown-user-info {
          flex: 1;
        }

        .dropdown-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 2px solid rgba(255,255,255,0.3);
        }

        .dropdown-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .dropdown-name {
          font-weight: 600;
          font-size: 16px;
          color: white;
        }

        .dropdown-email {
          font-size: 13px;
          opacity: 0.9;
          color: rgba(255, 255, 255, 0.9);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: #333 !important;
          text-decoration: none;
          transition: all 0.3s ease;
          font-weight: 500;
          border-radius: 6px;
          margin: 2px 8px;
        }

        .dropdown-item:hover {
          background: #4CAF50;
          color: white !important;
          text-decoration: none;
          transform: translateX(3px);
        }

        .dropdown-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .dropdown-divider {
          height: 1px;
          background: #e0e0e0;
          margin: 5px 0;
        }

        @media (max-width: 768px) {
          .profile-dropdown {
            right: -10px;
            left: -10px;
            min-width: auto;
          }
          
          .profile-name {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Replace the original profile link content
    profileLink.innerHTML = '';
    profileLink.appendChild(widget);
    profileLink.style.display = 'block';

    // Add click functionality
    const trigger = widget.querySelector('.profile-trigger');
    const dropdown = widget.querySelector('.profile-dropdown');
    
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Close other dropdowns
      document.querySelectorAll('.profile-widget.active').forEach(w => {
        if (w !== widget) w.classList.remove('active');
      });
      
      // Toggle this dropdown
      widget.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!widget.contains(e.target)) {
        widget.classList.remove('active');
      }
    });

    // Populate with user data
    updateProfileWidget();
  });
}

function updateProfileWidget() {
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  
  // Update navigation profile name
  document.querySelectorAll('#navProfileName').forEach(elem => {
    elem.textContent = userName || userEmail?.split('@')[0] || 'Profile';
  });
  
  // Update dropdown info
  document.querySelectorAll('#dropdownName').forEach(elem => {
    elem.textContent = userName || userEmail?.split('@')[0] || 'User Name';
  });
  
  document.querySelectorAll('#dropdownEmail').forEach(elem => {
    elem.textContent = userEmail || 'user@email.com';
  });
  
  // Update avatar images
  if (userProfile.profileImage) {
    document.querySelectorAll('#navProfileAvatar, #dropdownAvatar').forEach(avatar => {
      avatar.innerHTML = `<img src="${userProfile.profileImage}" alt="Profile">`;
    });
  } else {
    // Use initials if available
    const initials = getInitials(userName || userEmail);
    document.querySelectorAll('#navProfileAvatar, #dropdownAvatar').forEach(avatar => {
      avatar.textContent = initials;
    });
  }
}

function getInitials(name) {
  if (!name) return '👤';
  
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts[0]) {
    return parts[0][0].toUpperCase();
  }
  return '👤';
}

// Initialize profile widgets when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Delay to ensure auth state is checked
  setTimeout(() => {
    if (auth.isAuthenticated()) {
      createProfileWidget();
    }
  }, 1000);
});

// Update widgets when auth state changes
window.addEventListener('authStateChanged', function() {
  if (auth.isAuthenticated()) {
    createProfileWidget();
  }
});

// Make functions globally available
window.createProfileWidget = createProfileWidget;
window.updateProfileWidget = updateProfileWidget; 