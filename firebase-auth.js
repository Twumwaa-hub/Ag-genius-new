// Firebase Authentication Service
// This module handles all Firebase authentication operations

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

// Enhanced auth object with Firebase integration
export const firebaseAuth = {
  currentUser: null,
  isLoggingOut: false,

  // Initialize auth state listener
  init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        if (user) {
          console.log("User is signed in:", user.email);
          // Store basic user info in localStorage for compatibility
          localStorage.setItem("token", user.accessToken || "firebase-auth");
          localStorage.setItem("userId", user.uid);
          localStorage.setItem("userEmail", user.email);
        } else {
          console.log("User is signed out");
          this.clearLocalStorage();
        }
        resolve(user);
      });
    });
  },

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  },

  // Login with email and password
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store user info in localStorage for compatibility with existing code
      localStorage.setItem("token", user.accessToken || "firebase-auth");
      localStorage.setItem("userId", user.uid);
      localStorage.setItem("userEmail", user.email);
      
      this.showToast("Login successful", "success");
      return { success: true, user };
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
      
      this.showToast(errorMessage, "error");
      throw new Error(errorMessage);
    }
  },

  // Register new user
  async register(email, password, username) {
    try {
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

      this.showToast("Registration successful", "success");
      return { success: true, user };
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
      
      this.showToast(errorMessage, "error");
      throw new Error(errorMessage);
    }
  },

  // Logout user
  async logout() {
    if (this.isLoggingOut) return;
    
    try {
      this.isLoggingOut = true;
      await signOut(auth);
      this.clearLocalStorage();
      this.showToast("You have been logged out", "success");
      
      setTimeout(() => {
        window.location.replace("login.html");
      }, 800);
    } catch (error) {
      console.error("Logout error:", error);
      this.isLoggingOut = false;
      // Force redirect even if there was an error
      this.clearLocalStorage();
      window.location.replace("login.html");
    }
  },

  // Clear localStorage
  clearLocalStorage() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
  },

  // Get user profile from Firestore
  async getUserProfile() {
    if (!this.currentUser) return null;
    
    try {
      const docRef = doc(db, "userProfiles", this.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log("No user profile found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  // Toast notification system (reused from existing code)
  showToast(message, type = "success") {
    const toastContainer = 
      document.querySelector(".toast-container") || this.createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOutTop 0.3s ease-out forwards";
      setTimeout(() => {
        if (toastContainer.contains(toast)) {
          toastContainer.removeChild(toast);
        }
        if (toastContainer.children.length === 0) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, 3000);
  },

  createToastContainer() {
    const container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
  }
}; 