// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4R38lAN1rYbuzuyalhwdDn_pSO1qPF0M",
    authDomain: "yukopaste.firebaseapp.com",
    projectId: "yukopaste",
    storageBucket: "yukopaste.firebasestorage.app",
    messagingSenderId: "633287845888",
    appId: "1:633287845888:web:9365635606a1bba6f410e5",
    measurementId: "G-88V7HNDF82"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global Variables
let currentUser = null;
let allScripts = [];
let filteredScripts = [];
let currentScript = null;
let currentImageIndex = 0;
let currentImages = [];

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const scriptsGrid = document.getElementById('scripts-grid');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const backButton = document.getElementById('back-button');
const scriptDetailContent = document.getElementById('script-detail-content');
const imageModal = document.getElementById('image-modal');
const modalClose = document.querySelector('.modal-close');
const galleryImage = document.getElementById('gallery-image');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const galleryIndicators = document.querySelector('.gallery-indicators');
const hiddenAdminBtn = document.getElementById('hidden-admin-btn');

// Admin Elements
const loginForm = document.getElementById('login-form');
const adminEmail = document.getElementById('admin-email');
const adminPassword = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const adminLogin = document.getElementById('admin-login');
const adminDashboard = document.getElementById('admin-dashboard');
const logoutButton = document.getElementById('logout-button');
const addScriptForm = document.getElementById('add-script-form');
const adminScriptsList = document.getElementById('admin-scripts-list');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('YukoScripts initialized');
    
    // Hide loading screen after 2 seconds
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load scripts from Firebase
    loadScripts();
    
    // Check authentication state
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI();
    });
});

// Event Listeners
function initializeEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('href').substring(1);
            showPage(targetPage);
            updateActiveNavLink(link);
        });
    });
    
    // Search and Filter
    searchInput.addEventListener('input', handleSearch);
    filterSelect.addEventListener('change', handleFilter);
    
    // Back button
    backButton.addEventListener('click', () => showPage('home'));
    
    // Modal controls
    modalClose.addEventListener('click', closeImageModal);
    prevBtn.addEventListener('click', showPreviousImage);
    nextBtn.addEventListener('click', showNextImage);
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) closeImageModal();
    });
    
    // Hidden admin button
    hiddenAdminBtn.addEventListener('click', () => {
        showPage('admin');
        updateActiveNavLink(document.createElement('a')); // Clear active nav
    });
    
    // Admin form handlers
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    addScriptForm.addEventListener('submit', handleAddScript);
    
    // Keyboard navigation for modal
    document.addEventListener('keydown', (e) => {
        if (imageModal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') showPreviousImage();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'Escape') closeImageModal();
        }
    });
}

// Page Management
function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // Load admin scripts when showing admin page
    if (pageId === 'admin' && currentUser) {
        loadAdminScripts();
    }
}

function updateActiveNavLink(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

// Firebase Operations
async function loadScripts() {
    try {
        const snapshot = await db.collection('scripts').orderBy('createdAt', 'desc').get();
        allScripts = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            allScripts.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                views: data.views || 0
            });
        });
        
        filteredScripts = [...allScripts];
        displayScripts();
    } catch (error) {
        console.error('Error loading scripts:', error);
        showError('Failed to load scripts. Please try again later.');
    }
}

// Display Scripts
function displayScripts() {
    if (filteredScripts.length === 0) {
        scriptsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #888;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No scripts found matching your search.</p>
            </div>
        `;
        return;
    }
    
    scriptsGrid.innerHTML = filteredScripts.map(script => `
        <div class="script-card" onclick="showScriptDetail('${script.id}')">
            <h3>${escapeHtml(script.title)}</h3>
            <p>${escapeHtml(script.description)}</p>
            <div class="script-meta">
                <span><i class="fas fa-calendar"></i> ${formatDate(script.createdAt)}</span>
                <span><i class="fas fa-eye"></i> ${script.views} views</span>
            </div>
        </div>
    `).join('');
}

// Script Detail
async function showScriptDetail(scriptId) {
    currentScript = allScripts.find(s => s.id === scriptId);
    if (!currentScript) return;
    
    // Increment view count
    try {
        await db.collection('scripts').doc(scriptId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
        currentScript.views = (currentScript.views || 0) + 1;
    } catch (error) {
        console.error('Error updating views:', error);
    }
    
    // Prepare images and videos
    const images = Array.isArray(currentScript.images) ? currentScript.images : 
                  (currentScript.images ? currentScript.images.split('\n').filter(img => img.trim()) : []);
    const videos = Array.isArray(currentScript.videoLinks) ? currentScript.videoLinks :
                  (currentScript.videoLinks ? currentScript.videoLinks.split('\n').filter(vid => vid.trim()) : []);
    
    currentImages = images;
    currentImageIndex = 0;
    
    // Build detail HTML
    let detailHtml = `
        <div class="script-detail">
            <h1>${escapeHtml(currentScript.title)}</h1>
            <div class="description">${escapeHtml(currentScript.description).replace(/\n/g, '<br>')}</div>
            
            <div class="script-meta">
                <span><i class="fas fa-calendar"></i> ${formatDate(currentScript.createdAt)}</span>
                <span><i class="fas fa-eye"></i> ${currentScript.views} views</span>
            </div>
    `;
    
    // Add image gallery if images exist
    if (images.length > 0) {
        detailHtml += `
            <div class="image-gallery-container">
                <h3><i class="fas fa-images"></i> Gallery</h3>
                <div class="image-thumbnails">
                    ${images.map((img, index) => `
                        <img src="${escapeHtml(img)}" 
                             alt="Script Image ${index + 1}" 
                             class="image-thumbnail"
                             onclick="openImageModal(${index})"
                             onerror="this.style.display='none'">
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Add videos if they exist
    if (videos.length > 0) {
        detailHtml += `
            <div class="video-section">
                <h3><i class="fas fa-play-circle"></i> Videos</h3>
                ${videos.map(video => {
                    const videoId = extractYouTubeId(video);
                    if (videoId) {
                        return `
                            <iframe class="video-embed" 
                                    src="https://www.youtube.com/embed/${videoId}" 
                                    frameborder="0" 
                                    allowfullscreen>
                            </iframe>
                        `;
                    } else {
                        return `<p style="color: #ff4444;">Invalid video URL: ${escapeHtml(video)}</p>`;
                    }
                }).join('')}
            </div>
        `;
    }
    
    // Add get script button
    detailHtml += `
            <a href="${escapeHtml(currentScript.link)}" 
               target="_blank" 
               class="get-script-button">
               <i class="fas fa-download"></i> Get Script
            </a>
        </div>
    `;
    
    scriptDetailContent.innerHTML = detailHtml;
    showPage('script-detail');
}

// Search and Filter Functions
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (query === '') {
        filteredScripts = [...allScripts];
    } else {
        filteredScripts = allScripts.filter(script =>
            script.title.toLowerCase().includes(query) ||
            script.description.toLowerCase().includes(query)
        );
    }
    
    applySorting();
    displayScripts();
}

function handleFilter() {
    applySorting();
    displayScripts();
}

function applySorting() {
    const sortBy = filterSelect.value;
    
    switch (sortBy) {
        case 'recent':
            filteredScripts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'views':
            filteredScripts.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'title':
            filteredScripts.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
}

// Image Gallery Functions
function openImageModal(index) {
    if (currentImages.length === 0) return;
    
    currentImageIndex = index;
    updateGalleryImage();
    updateGalleryIndicators();
    imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    imageModal.classList.remove('active');
    document.body.style.overflow = '';
}

function showPreviousImage() {
    if (currentImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    updateGalleryImage();
    updateGalleryIndicators();
}

function showNextImage() {
    if (currentImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    updateGalleryImage();
    updateGalleryIndicators();
}

function updateGalleryImage() {
    if (currentImages[currentImageIndex]) {
        galleryImage.src = currentImages[currentImageIndex];
    }
}

function updateGalleryIndicators() {
    const indicators = currentImages.map((_, index) => `
        <div class="gallery-indicator ${index === currentImageIndex ? 'active' : ''}"
             onclick="openImageModal(${index})"></div>
    `).join('');
    
    galleryIndicators.innerHTML = indicators;
}

// Admin Authentication
async function handleLogin(e) {
    e.preventDefault();
    
    const email = adminEmail.value.trim();
    const password = adminPassword.value;
    
    hideError();
    
    if (!email || !password) {
        showError('Please enter both email and password.');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Success handled by auth state change listener
    } catch (error) {
        console.error('Login error:', error);
        showError(getAuthErrorMessage(error.code));
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        // Success handled by auth state change listener
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout. Please try again.');
    }
}

function updateAuthUI() {
    if (currentUser) {
        adminLogin.classList.remove('active');
        adminDashboard.classList.add('active');
        loadAdminScripts();
    } else {
        adminLogin.classList.add('active');
        adminDashboard.classList.remove('active');
        // Clear forms
        loginForm.reset();
        addScriptForm.reset();
        hideError();
    }
}

// Admin Script Management
async function handleAddScript(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showError('You must be logged in to add scripts.');
        return;
    }
    
    const title = document.getElementById('script-title').value.trim();
    const description = document.getElementById('script-description').value.trim();
    const link = document.getElementById('script-link').value.trim();
    const videoLinks = document.getElementById('video-links').value.trim();
    const imageLinks = document.getElementById('image-links').value.trim();
    
    if (!title || !description || !link) {
        showError('Please fill in all required fields.');
        return;
    }
    
    // Show loading state
    const submitBtn = addScriptForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding...';
    submitBtn.disabled = true;
    
    try {
        // Process video links
        const processedVideoLinks = videoLinks ? 
            videoLinks.split('\n')
                     .map(v => v.trim())
                     .filter(v => v.length > 0) : [];
        
        // Process image links
        const processedImageLinks = imageLinks ? 
            imageLinks.split('\n')
                      .map(i => i.trim())
                      .filter(i => i.length > 0) : [];
        
        const scriptData = {
            title,
            description,
            link,
            videoLinks: processedVideoLinks,
            images: processedImageLinks,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            views: 0
        };
        
        console.log('Adding script with data:', scriptData);
        
        const docRef = await db.collection('scripts').add(scriptData);
        console.log('Script added with ID:', docRef.id);
        
        // Reset form and reload data
        addScriptForm.reset();
        showSuccess('Script added successfully!');
        
        // Reload scripts data
        await loadScripts();
        await loadAdminScripts();
        
        // Hide success message after 3 seconds
        setTimeout(hideSuccess, 3000);
        
    } catch (error) {
        console.error('Error adding script:', error);
        showError('Failed to add script: ' + error.message);
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function loadAdminScripts() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('scripts').orderBy('createdAt', 'desc').get();
        const scripts = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            scripts.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            });
        });
        
        displayAdminScripts(scripts);
    } catch (error) {
        console.error('Error loading admin scripts:', error);
        showError('Failed to load scripts for management.');
    }
}

function displayAdminScripts(scripts) {
    if (scripts.length === 0) {
        adminScriptsList.innerHTML = '<p style="text-align: center; color: #888;">No scripts found.</p>';
        return;
    }
    
    adminScriptsList.innerHTML = scripts.map(script => `
        <div class="admin-script-item">
            <div class="admin-script-info">
                <h4>${escapeHtml(script.title)}</h4>
                <p>${escapeHtml(script.description.substring(0, 100))}${script.description.length > 100 ? '...' : ''}</p>
                <p><i class="fas fa-calendar"></i> ${formatDate(script.createdAt)} | <i class="fas fa-eye"></i> ${script.views || 0} views</p>
            </div>
            <div class="admin-script-actions">
                <button class="btn-secondary" onclick="editScript('${script.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteScript('${script.id}', '${escapeHtml(script.title)}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteScript(scriptId, scriptTitle) {
    if (!confirm(`Are you sure you want to delete "${scriptTitle}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await db.collection('scripts').doc(scriptId).delete();
        showSuccess('Script deleted successfully!');
        loadScripts();
        loadAdminScripts();
        
        // Hide success message after 3 seconds
        setTimeout(hideSuccess, 3000);
    } catch (error) {
        console.error('Error deleting script:', error);
        showError('Failed to delete script. Please try again.');
    }
}

function editScript(scriptId) {
    const script = allScripts.find(s => s.id === scriptId);
    if (!script) return;
    
    // Populate form with script data
    document.getElementById('script-title').value = script.title;
    document.getElementById('script-description').value = script.description;
    document.getElementById('script-link').value = script.link;
    
    const videoLinks = Array.isArray(script.videoLinks) ? script.videoLinks.join('\n') : 
                      (script.videoLinks || '');
    const imageLinks = Array.isArray(script.images) ? script.images.join('\n') : 
                      (script.images || '');
    
    document.getElementById('video-links').value = videoLinks;
    document.getElementById('image-links').value = imageLinks;
    
    // Update form to edit mode
    const submitBtn = addScriptForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Script';
    submitBtn.onclick = (e) => handleUpdateScript(e, scriptId);
    
    // Scroll to form
    document.querySelector('.dashboard-section').scrollIntoView({ behavior: 'smooth' });
}

async function handleUpdateScript(e, scriptId) {
    e.preventDefault();
    
    const title = document.getElementById('script-title').value.trim();
    const description = document.getElementById('script-description').value.trim();
    const link = document.getElementById('script-link').value.trim();
    const videoLinks = document.getElementById('video-links').value.trim();
    const imageLinks = document.getElementById('image-links').value.trim();
    
    if (!title || !description || !link) {
        showError('Please fill in all required fields.');
        return;
    }
    
    try {
        const scriptData = {
            title,
            description,
            link,
            videoLinks: videoLinks ? videoLinks.split('\n').filter(v => v.trim()) : [],
            images: imageLinks ? imageLinks.split('\n').filter(i => i.trim()) : []
        };
        
        await db.collection('scripts').doc(scriptId).update(scriptData);
        
        // Reset form and reload data
        resetScriptForm();
        showSuccess('Script updated successfully!');
        loadScripts();
        loadAdminScripts();
        
        // Hide success message after 3 seconds
        setTimeout(hideSuccess, 3000);
        
    } catch (error) {
        console.error('Error updating script:', error);
        showError('Failed to update script. Please try again.');
    }
}

function resetScriptForm() {
    addScriptForm.reset();
    const submitBtn = addScriptForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Script';
    submitBtn.onclick = null;
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function showError(message) {
    // Try to find error element in current context
    let errorElement = document.getElementById('login-error');
    
    // If not found or not visible, create/find error element in admin dashboard
    if (!errorElement || !errorElement.offsetParent) {
        errorElement = document.querySelector('.admin-section.active .error-message') || 
                      document.getElementById('login-error');
    }
    
    // If still no error element, create one
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.id = 'dynamic-error';
        
        // Try to append to active admin section
        const activeAdminSection = document.querySelector('.admin-section.active');
        if (activeAdminSection) {
            const form = activeAdminSection.querySelector('form');
            if (form) {
                form.appendChild(errorElement);
            } else {
                activeAdminSection.appendChild(errorElement);
            }
        }
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    // Also show in console for debugging
    console.error('Error:', message);
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }, 5000);
}

function hideError() {
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function showSuccess(message) {
    // Create success message element if it doesn't exist
    let successElement = document.querySelector('.success-message');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.className = 'success-message';
        
        // Insert after the add script form
        const form = document.getElementById('add-script-form');
        form.parentNode.insertBefore(successElement, form.nextSibling);
    }
    
    successElement.textContent = message;
    successElement.classList.add('show');
}

function hideSuccess() {
    const successElement = document.querySelector('.success-message');
    if (successElement) {
        successElement.classList.remove('show');
    }
}

function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        default:
            return 'Login failed. Please try again.';
    }
}

// Export functions for global access
window.showScriptDetail = showScriptDetail;
window.openImageModal = openImageModal;
window.editScript = editScript;
window.deleteScript = deleteScript;