const express = require('express');
const path = require('path');
const app = express();

// Determine the correct dist path (Angular 19 uses /browser subdirectory)
const distPath = path.join(__dirname, 'dist', 'tinta-frontend', 'browser');
const fallbackPath = path.join(__dirname, 'dist', 'tinta-frontend');

// Try browser subdirectory first, fallback to root dist
const staticPath = require('fs').existsSync(distPath) ? distPath : fallbackPath;

// Serve static files from the Angular app
app.use(express.static(staticPath));

// Handle Angular routing - return all requests to Angular app
app.get('*', function(req, res) {
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath);
});

// Start the app by listening on the default Heroku port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving static files from: ${staticPath}`);
});
