// Enhanced Local Image Storage for AgGenius
// This provides efficient local storage without requiring paid cloud services

class LocalImageStorage {
  constructor() {
    this.maxFileSize = 2 * 1024 * 1024; // 2MB limit for better performance
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    this.compressionQuality = 0.7; // 70% quality for good size/quality balance
    this.maxWidth = 400; // Max width for profile images
    this.maxHeight = 400; // Max height for profile images
  }

  // Main function to handle image upload and storage
  async handleImageUpload(file, userId) {
    try {
      // Validate file
      this.validateFile(file);
      
      // Compress image for better storage efficiency
      const compressedFile = await this.compressImage(file);
      
      // Convert to optimized base64
      const optimizedBase64 = await this.fileToBase64(compressedFile);
      
      // Store in localStorage with cleanup of old images
      await this.storeImageLocally(userId, optimizedBase64);
      
      // Update UI
      this.updateImageDisplay(optimizedBase64);
      
      return optimizedBase64;
      
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  // Validate uploaded file
  validateFile(file) {
    if (!file) {
      throw new Error('No file selected');
    }
    
    if (file.size > this.maxFileSize) {
      throw new Error('Image must be smaller than 2MB. Please choose a smaller image or compress it.');
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are supported');
    }
  }

  // Compress image to reduce storage size
  async compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = this.calculateDimensions(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with compression
        ctx.fillStyle = '#FFFFFF'; // White background for JPEGs
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg', // Convert to JPEG for better compression
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
    
    // Scale down if too large
    if (width > this.maxWidth || height > this.maxHeight) {
      const ratio = Math.min(this.maxWidth / width, this.maxHeight / height);
      width *= ratio;
      height *= ratio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  // Store image in localStorage with cleanup
  async storeImageLocally(userId, base64Image) {
    try {
      // Get current profile data
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      // Clean up old image if exists
      if (userProfile.profileImage) {
        this.cleanupOldImage(userProfile.profileImage);
      }
      
      // Store new image
      userProfile.profileImage = base64Image;
      userProfile.imageUpdatedAt = new Date().toISOString();
      
      // Check localStorage space before saving
      const profileString = JSON.stringify(userProfile);
      if (this.checkStorageSpace(profileString)) {
        localStorage.setItem('userProfile', profileString);
        
        // Update userName for widget display
        if (userProfile.firstName && userProfile.lastName) {
          localStorage.setItem('userName', `${userProfile.firstName} ${userProfile.lastName}`);
        }
        
        console.log('Profile image saved locally');
      } else {
        throw new Error('Not enough storage space. Please clear browser data or use a smaller image.');
      }
      
    } catch (error) {
      console.error('Failed to store image locally:', error);
      throw error;
    }
  }

  // Check if there's enough localStorage space
  checkStorageSpace(data) {
    try {
      const testKey = '_test_storage_space_';
      localStorage.setItem(testKey, data);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        return false;
      }
      throw e;
    }
  }

  // Clean up old image data (placeholder for future cleanup logic)
  cleanupOldImage(oldImageData) {
    // Could implement cleanup logic here
    // For now, just log that we're replacing an image
    console.log('Replacing existing profile image');
  }

  // Update all image displays on the page
  updateImageDisplay(base64Image) {
    const displays = [
      '#profileImageDisplay',
      '#navProfileAvatar', 
      '#dropdownAvatar'
    ];
    
    displays.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.innerHTML = `<img src="${base64Image}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Profile Image">`;
      }
    });

    // Update profile widget if available
    if (window.updateProfileWidget) {
      window.updateProfileWidget();
    }
  }

  // Get stored image for a user
  getStoredImage(userId) {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      return userProfile.profileImage || null;
    } catch (error) {
      console.error('Failed to retrieve stored image:', error);
      return null;
    }
  }

  // Remove stored image
  removeStoredImage(userId) {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      delete userProfile.profileImage;
      delete userProfile.imageUpdatedAt;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      // Reset display to default
      this.updateImageDisplay('👤');
      
      console.log('Profile image removed');
    } catch (error) {
      console.error('Failed to remove image:', error);
      throw error;
    }
  }

  // Get storage usage info
  getStorageInfo() {
    try {
      const userProfile = localStorage.getItem('userProfile') || '{}';
      const profileSize = new Blob([userProfile]).size;
      const totalLocalStorage = JSON.stringify(localStorage).length;
      
      return {
        profileSize: this.formatBytes(profileSize),
        totalUsed: this.formatBytes(totalLocalStorage),
        imageExists: JSON.parse(userProfile).profileImage ? true : false
      };
    } catch (error) {
      return { error: 'Unable to calculate storage usage' };
    }
  }

  // Format bytes to human readable
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Initialize the storage manager
const localImageStorage = new LocalImageStorage();

// Global functions for easy use
window.handleProfileImageUpload = async function(file, userId) {
  try {
    showToast('Uploading image...', 'success');
    const result = await localImageStorage.handleImageUpload(file, userId);
    showToast('Profile image updated successfully!', 'success');
    return result;
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
};

window.removeProfileImage = function(userId) {
  if (confirm('Are you sure you want to remove your profile image?')) {
    try {
      localImageStorage.removeStoredImage(userId);
      showToast('Profile image removed', 'success');
    } catch (error) {
      showToast('Failed to remove image', 'error');
    }
  }
};

window.getStorageInfo = function() {
  return localImageStorage.getStorageInfo();
};

// Export for use in other files
export { LocalImageStorage, localImageStorage }; 