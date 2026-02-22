# Deploying to Heroku

This Angular application is configured for deployment on Heroku.

## Prerequisites

- Heroku account
- Heroku CLI installed
- Git repository initialized

## Deployment Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create a new Heroku app
```bash
heroku create your-app-name
```

### 3. Set environment variables (if needed)
```bash
# If you need to override API URL, modify src/environments/environment.prod.ts
```

### 4. Deploy to Heroku
```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

Or if using master branch:
```bash
git push heroku master
```

## Configuration

### Build Process
- `heroku-postbuild` script automatically builds the production version during deployment
- Production build output: `dist/tinta-frontend/browser` (or `dist/tinta-frontend` for older Angular versions)

### Server
- Express server serves static files from the build output
- All routes are handled by Angular router (SPA routing)
- Server listens on `PORT` environment variable (set by Heroku)

### Environment Variables
The production environment uses:
- `apiUrl`: Set in `src/environments/environment.prod.ts`
- Default: `https://api.westwood.app/api/v1`

To override, you can modify `environment.prod.ts` before deployment.

## Troubleshooting

### Build fails
- Check Node.js version: `node --version`
- Heroku uses Node.js 18.x or 20.x by default
- You can specify version in `package.json`:
  ```json
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
  ```

### Routes not working
- Ensure `server.js` is correctly serving `index.html` for all routes
- Check that `outputPath` in `angular.json` matches the path in `server.js`

### API connection issues
- Verify `apiUrl` in `environment.prod.ts`
- Check CORS settings on your backend API
- Ensure backend API is accessible from Heroku

## Local Testing

To test the production build locally:
```bash
npm run build
npm start
```

The app will be available at `http://localhost:8080`
