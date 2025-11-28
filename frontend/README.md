# V2V React Frontend

Modern React frontend for the V2V Communication System.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Access

- Development: http://localhost:3000
- API Proxy: Configured to proxy `/api/*` to `http://localhost:5000`

## Features

- Real-time dashboard with live alerts
- Metrics display (verified alerts, active nodes, messages/sec)
- Alerts page with detailed hazard information
- Auto-refresh every 5 seconds
- Responsive design with Tailwind CSS

## Prerequisites

Make sure the Node.js API is running:
```bash
cd ../node
npm start
```

## Architecture

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Icons**: React Icons

## API Integration

The frontend connects to the Node.js API at `http://localhost:5000`:
- `GET /alerts` - Fetch all verified alerts
- `GET /metrics` - Fetch system metrics
- `GET /blockchain/status` - Check blockchain connection

## Deployment

For production deployment:
```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be served by Apache or Nginx.

See `../APACHE_DEPLOYMENT_CHECKLIST.md` for deployment instructions.
