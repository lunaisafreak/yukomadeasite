# YukoScripts - Roblox Scripts Hub

A modern, professional website for managing and displaying Roblox scripts with Firebase backend integration.

## Features

### 🎨 Design
- Black and red modern theme
- Responsive design for all devices
- Stylish loading screen
- Professional UI/UX

### 🏠 Homepage
- Grid layout displaying all Roblox scripts
- Real-time search functionality
- Filter options (Most Recent, Most Viewed, Title A-Z)
- View counters for each script

### 📝 Script Details
- Detailed script information
- YouTube video embeds
- Image gallery with modal viewer
- Navigation between gallery images
- "GET SCRIPT" button for easy access

### 👨‍💼 Admin System
- Secure Firebase Authentication
- Admin dashboard for content management
- Add new scripts with all details
- Edit existing scripts
- Delete scripts with confirmation
- Image and video link management

### 🔥 Firebase Integration
- Firestore database for script storage
- Real-time data synchronization
- User authentication
- View tracking and analytics

## File Structure

```
├── index.html          # Main HTML file with all pages
├── style.css          # Complete CSS styling
├── script.js          # JavaScript functionality and Firebase integration
├── package.json       # Project configuration
└── README.md         # This file
```

## Firebase Configuration

The project is configured with the following Firebase settings:
- Project: yukopaste
- Authentication: Email/Password
- Database: Firestore
- Storage: Firebase Storage

## Database Schema

### Scripts Collection
Each script document contains:
- `title`: String - Script name
- `description`: String - Script description
- `link`: String - URL to the actual script
- `images`: Array - List of image URLs
- `videoLinks`: Array - List of YouTube video URLs
- `createdAt`: Timestamp - Creation date
- `views`: Number - View counter

## Deployment

### GitHub Pages
1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to Settings > Pages
4. Select source branch (usually main)
5. Your site will be available at `https://username.github.io/repository-name`

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: (leave empty for static sites)
3. Set publish directory: `/` (root directory)
4. Deploy automatically on git push

## Admin Access

To access the admin panel:
1. Navigate to `/admin` or click the Admin link
2. Login with your Firebase Auth credentials
3. Use the dashboard to manage scripts

## Features in Detail

### Search & Filter
- Real-time search across titles and descriptions
- Sort by creation date, view count, or alphabetically
- Instant results without page reload

### Image Gallery
- Click any thumbnail to open full-size modal
- Navigate with arrow keys or buttons
- Close with Escape key or clicking outside
- Gallery indicators show current position

### Video Integration
- Automatic YouTube embed detection
- Clean video player integration
- Support for multiple videos per script

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Optimized loading performance

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- Firebase Auth handles all authentication
- Firestore security rules should be configured
- XSS protection through HTML escaping
- No sensitive data in client-side code

## Performance

- Lazy loading for images
- Optimized Firebase queries
- Minimal external dependencies
- Compressed assets for fast loading

## Customization

### Themes
Modify CSS variables in `style.css`:
- `--primary-color: #ff0000` (red theme)
- `--background-color: #0a0a0a` (dark background)
- `--text-color: #ffffff` (white text)

### Firebase
Update `firebaseConfig` in `script.js` with your project settings.

### Content
All content is managed through the admin dashboard - no code changes needed for regular updates.