// IndexedDB Storage for Profile Images
// This provides better storage for larger files than localStorage

class IndexedDBImageStorage {
  constructor() {
    this.dbName = 'AgGeniusDB';
    this.dbVersion = 1;
    this.storeName = 'profileImages';
    this.db = null;
  }

  // Initialize IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for profile images
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'userId' });
          store.createIndex('uploadDate', 'uploadDate', { unique: false });
        }
      };
    });
  }

  // Store image in IndexedDB
  async storeImage(userId, imageBlob, metadata = {}) {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const imageData = {
        userId: userId,
        imageBlob: imageBlob,
        uploadDate: new Date().toISOString(),
        size: imageBlob.size,
        type: imageBlob.type,
        ...metadata
      };
      
      const request = store.put(imageData);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('Image stored in IndexedDB successfully');
          resolve(imageData);
        };
        
        request.onerror = () => {
          reject(new Error('Failed to store image in IndexedDB'));
        };
      });
      
    } catch (error) {
      console.error('IndexedDB storage error:', error);
      throw error;
    }
  }

  // Retrieve image from IndexedDB
  async getImage(userId) {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(userId);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => {
          reject(new Error('Failed to retrieve image from IndexedDB'));
        };
      });
      
    } catch (error) {
      console.error('IndexedDB retrieval error:', error);
      throw error;
    }
  }

  // Delete image from IndexedDB
  async deleteImage(userId) {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(userId);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('Image deleted from IndexedDB');
          resolve(true);
        };
        
        request.onerror = () => {
          reject(new Error('Failed to delete image from IndexedDB'));
        };
      });
      
    } catch (error) {
      console.error('IndexedDB deletion error:', error);
      throw error;
    }
  }

  // Get all stored images info
  async getAllImages() {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(new Error('Failed to get all images'));
        };
      });
      
    } catch (error) {
      console.error('IndexedDB getAll error:', error);
      throw error;
    }
  }

  // Get storage usage
  async getStorageUsage() {
    try {
      const allImages = await this.getAllImages();
      const totalSize = allImages.reduce((sum, img) => sum + (img.size || 0), 0);
      
      return {
        totalImages: allImages.length,
        totalSize: this.formatBytes(totalSize),
        images: allImages.map(img => ({
          userId: img.userId,
          size: this.formatBytes(img.size),
          uploadDate: img.uploadDate,
          type: img.type
        }))
      };
    } catch (error) {
      return { error: 'Unable to calculate storage usage' };
    }
  }

  // Convert blob to data URL for display
  async blobToDataURL(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // Format bytes
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Hybrid storage manager that uses IndexedDB for images and localStorage for profile data
class HybridProfileStorage {
  constructor() {
    this.imageStorage = new IndexedDBImageStorage();
    this.localImageStorage = new LocalImageStorage(); // Fallback
  }

  async handleImageUpload(file, userId) {
    try {
      // Try IndexedDB first (can handle larger files)
      const compressedBlob = await this.compressImageToBlob(file);
      await this.imageStorage.storeImage(userId, compressedBlob);
      
      // Also store reference in localStorage for quick access
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      userProfile.hasProfileImage = true;
      userProfile.imageStoredIn = 'indexeddb';
      userProfile.imageUpdatedAt = new Date().toISOString();
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      // Update display
      const dataURL = await this.imageStorage.blobToDataURL(compressedBlob);
      this.updateImageDisplay(dataURL);
      
      return dataURL;
      
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage:', error);
      // Fallback to localStorage
      return await this.localImageStorage.handleImageUpload(file, userId);
    }
  }

  async loadUserImage(userId) {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      if (userProfile.imageStoredIn === 'indexeddb') {
        // Load from IndexedDB
        const imageData = await this.imageStorage.getImage(userId);
        if (imageData && imageData.imageBlob) {
          const dataURL = await this.imageStorage.blobToDataURL(imageData.imageBlob);
          this.updateImageDisplay(dataURL);
          return dataURL;
        }
      }
      
      // Fallback to localStorage
      const localImage = this.localImageStorage.getStoredImage(userId);
      if (localImage) {
        this.updateImageDisplay(localImage);
        return localImage;
      }
      
      return null;
      
    } catch (error) {
      console.error('Failed to load user image:', error);
      return null;
    }
  }

  async compressImageToBlob(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Compress to reasonable size
        const maxWidth = 400;
        const maxHeight = 400;
        let { width, height } = this.calculateDimensions(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  updateImageDisplay(dataURL) {
    const displays = ['#profileImageDisplay', '#navProfileAvatar', '#dropdownAvatar'];
    displays.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.innerHTML = `<img src="${dataURL}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Profile Image">`;
      }
    });
  }
}

// Initialize hybrid storage
const hybridStorage = new HybridProfileStorage();

// Global functions
window.handleProfileImageUploadAdvanced = async function(file, userId) {
  try {
    showToast('Uploading image...', 'success');
    await hybridStorage.handleImageUpload(file, userId);
    showToast('Profile image updated successfully!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.loadUserProfileImage = async function(userId) {
  return await hybridStorage.loadUserImage(userId);
};

export { IndexedDBImageStorage, HybridProfileStorage, hybridStorage }; 