// API layer — now uses localStorage instead of Supabase
import {
  fetchListings,
  fetchListing,
  uploadImage,
  createListing,
  fetchUserListings,
  getCurrentUser,
  signUp,
  signIn,
  signOut,
} from './localData';

// Re-export with same function signatures as before
export {
  fetchListings,
  fetchListing,
  uploadImage,
  createListing,
  fetchUserListings,
  getCurrentUser,
  signUp,
  signIn,
  signOut,
};
