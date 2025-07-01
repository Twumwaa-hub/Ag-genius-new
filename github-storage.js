// GitHub Storage for Profile Images
// This uses GitHub repositories as free cloud storage for profile images

class GitHubImageStorage {
  constructor() {
    // GitHub configuration - users will set these up
    this.githubConfig = {
      username: '', // GitHub username
      repository: 'ag-genius-profiles', // Repository name
      token: '', // Personal access token
      branch: 'main' // Default branch
    };
    
    this.maxFileSize = 3 * 1024 * 1024; // 3MB limit
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    this.compressionQuality = 0.8;
    this.maxWidth = 500;
    this.maxHeight = 500;
  }

  // Initialize GitHub storage with user config
  async initializeGitHub(config) {
    this.githubConfig = { ...this.githubConfig, ...config };
    
    // Save config to localStorage for persistence
    localStorage.setItem('githubStorageConfig', JSON.stringify(this.githubConfig));
    
    // Test connection
    return await this.testGitHubConnection();
  }

  // Load GitHub config from localStorage
  loadGitHubConfig() {
    const savedConfig = localStorage.getItem('githubStorageConfig');
    if (savedConfig) {
      this.githubConfig = { ...this.githubConfig, ...JSON.parse(savedConfig) };
    }
    return this.githubConfig;
  }

  // Test GitHub API connection
  async testGitHubConnection() {
    try {
      if (!this.githubConfig.token || !this.githubConfig.username || !this.githubConfig.repository) {
        throw new Error('GitHub configuration incomplete');
      }

      const response = await fetch(`https://api.github.com/repos/${this.githubConfig.username}/${this.githubConfig.repository}`, {
        headers: {
          'Authorization': `token ${this.githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found. Please create the repository first.');
        } else if (response.status === 401) {
          throw new Error('Invalid GitHub token. Please check your personal access token.');
        } else {
          throw new Error(`GitHub API error: ${response.status}`);
        }
      }

      console.log('GitHub connection successful!');
      return true;
    } catch (error) {
      console.error('GitHub connection failed:', error);
      throw error;
    }
  }

  // Upload profile image to GitHub
  async uploadProfileImage(file, userId) {
    try {
      // Load config
      this.loadGitHubConfig();
      
      // Validate file
      this.validateFile(file);
      
      // Compress image
      const compressedBlob = await this.compressImage(file);
      const base64Data = await this.blobToBase64(compressedBlob);
      
      // Remove data URL prefix to get pure base64
      const base64Content = base64Data.split(',')[1];
      
      // Generate filename
      const timestamp = Date.now();
      const fileExtension = 'jpg'; // Always save as JPEG after compression
      const fileName = `profiles/${userId}_${timestamp}.${fileExtension}`;
      
      // Check if file already exists (for updating)
      const existingFile = await this.getExistingFile(fileName);
      
      // Prepare GitHub API request
      const apiUrl = `https://api.github.com/repos/${this.githubConfig.username}/${this.githubConfig.repository}/contents/${fileName}`;
      
      const requestBody = {
        message: `Update profile image for user ${userId}`,
        content: base64Content,
        branch: this.githubConfig.branch
      };
      
      // If file exists, include SHA for update
      if (existingFile) {
        requestBody.sha = existingFile.sha;
      }
      
      // Upload to GitHub
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub upload failed: ${errorData.message || response.status}`);
      }
      
      const result = await response.json();
      
      // Get the download URL for the image
      const imageUrl = result.content.download_url;
      
      // Store reference in localStorage
      await this.storeImageReference(userId, {
        url: imageUrl,
        fileName: fileName,
        uploadDate: new Date().toISOString(),
        sha: result.content.sha
      });
      
      console.log('Image uploaded to GitHub successfully:', imageUrl);
      return imageUrl;
      
    } catch (error) {
      console.error('GitHub upload error:', error);
      throw error;
    }
  }

  // Get existing file info from GitHub
  async getExistingFile(fileName) {
    try {
      const apiUrl = `https://api.github.com/repos/${this.githubConfig.username}/${this.githubConfig.repository}/contents/${fileName}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${this.githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      } else if (response.status === 404) {
        return null; // File doesn't exist
      } else {
        throw new Error(`Failed to check existing file: ${response.status}`);
      }
    } catch (error) {
      console.error('Error checking existing file:', error);
      return null;
    }
  }

  // Store image reference in localStorage
  async storeImageReference(userId, imageData) {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      // Store GitHub image info
      userProfile.githubImage = imageData;
      userProfile.profileImageUrl = imageData.url;
      userProfile.imageStoredIn = 'github';
      userProfile.imageUpdatedAt = imageData.uploadDate;
      
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      // Update userName for widget display
      if (userProfile.firstName && userProfile.lastName) {
        localStorage.setItem('userName', `${userProfile.firstName} ${userProfile.lastName}`);
      }
      
      console.log('Image reference stored locally');
    } catch (error) {
      console.error('Failed to store image reference:', error);
      throw error;
    }
  }

  // Get stored image URL
  getStoredImageUrl(userId) {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      return userProfile.profileImageUrl || null;
    } catch (error) {
      console.error('Failed to retrieve stored image URL:', error);
      return null;
    }
  }

  // Delete image from GitHub
  async deleteProfileImage(userId) {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      if (userProfile.githubImage && userProfile.githubImage.fileName) {
        this.loadGitHubConfig();
        
        const apiUrl = `https://api.github.com/repos/${this.githubConfig.username}/${this.githubConfig.repository}/contents/${userProfile.githubImage.fileName}`;
        
        const response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${this.githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Delete profile image for user ${userId}`,
            sha: userProfile.githubImage.sha,
            branch: this.githubConfig.branch
          })
        });
        
        if (!response.ok) {
          console.warn('Failed to delete image from GitHub:', response.status);
        }
      }
      
      // Remove from localStorage
      delete userProfile.githubImage;
      delete userProfile.profileImageUrl;
      delete userProfile.imageStoredIn;
      delete userProfile.imageUpdatedAt;
      
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      console.log('Profile image deleted');
      return true;
      
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  }

  // Validate uploaded file
  validateFile(file) {
    if (!file) {
      throw new Error('No file selected');
    }
    
    if (file.size > this.maxFileSize) {
      throw new Error('Image must be smaller than 3MB. Please choose a smaller image.');
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are supported');
    }
  }

  // Compress image for GitHub storage
  async compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = this.calculateDimensions(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          this.compressionQuality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate optimal dimensions
  calculateDimensions(originalWidth, originalHeight) {
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > this.maxWidth || height > this.maxHeight) {
      const ratio = Math.min(this.maxWidth / width, this.maxHeight / height);
      width *= ratio;
      height *= ratio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Convert blob to base64
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to convert image to base64'));
      reader.readAsDataURL(blob);
    });
  }

  // Update image display
  updateImageDisplay(imageUrl) {
    const displays = [
      '#profileImageDisplay',
      '#navProfileAvatar', 
      '#dropdownAvatar'
    ];
    
    displays.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Profile Image">`;
      }
    });

    // Update profile widget if available
    if (window.updateProfileWidget) {
      window.updateProfileWidget();
    }
  }

  // Get storage info
  getStorageInfo() {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const githubConfig = this.loadGitHubConfig();
      
      return {
        storageType: 'GitHub Repository',
        repository: githubConfig.username ? `${githubConfig.username}/${githubConfig.repository}` : 'Not configured',
        hasImage: !!userProfile.profileImageUrl,
        imageUrl: userProfile.profileImageUrl || 'None',
        lastUpdated: userProfile.imageUpdatedAt || 'Never',
        configured: !!(githubConfig.username && githubConfig.token && githubConfig.repository)
      };
    } catch (error) {
      return { error: 'Unable to get storage info' };
    }
  }
}

// Initialize GitHub storage
const githubImageStorage = new GitHubImageStorage();

// Global functions for easy use
window.setupGitHubStorage = async function(config) {
  try {
    await githubImageStorage.initializeGitHub(config);
    showToast('GitHub storage configured successfully!', 'success');
    return true;
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
};

window.uploadToGitHub = async function(file, userId) {
  try {
    showToast('Uploading to GitHub...', 'success');
    const imageUrl = await githubImageStorage.uploadProfileImage(file, userId);
    githubImageStorage.updateImageDisplay(imageUrl);
    showToast('Profile image uploaded to GitHub successfully!', 'success');
    return imageUrl;
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
};

window.deleteFromGitHub = function(userId) {
  if (confirm('Are you sure you want to remove your profile image from GitHub?')) {
    try {
      githubImageStorage.deleteProfileImage(userId);
      githubImageStorage.updateImageDisplay('👤');
      showToast('Profile image removed from GitHub', 'success');
    } catch (error) {
      showToast('Failed to remove image from GitHub', 'error');
    }
  }
};

window.getGitHubStorageInfo = function() {
  return githubImageStorage.getStorageInfo();
};

window.loadGitHubImage = function(userId) {
  const imageUrl = githubImageStorage.getStoredImageUrl(userId);
  if (imageUrl) {
    githubImageStorage.updateImageDisplay(imageUrl);
    return imageUrl;
  }
  return null;
};

// Export for use in other files
export { GitHubImageStorage, githubImageStorage }; 