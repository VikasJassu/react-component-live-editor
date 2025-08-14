# React Live Inspector Backend

A Node.js/Express backend API for the React Live Inspector application that provides component persistence and sharing capabilities.

## Features

- 🔐 **Secure Component Storage**: Save and retrieve React components with validation
- 🚀 **RESTful API**: Clean, well-documented API endpoints
- 🛡️ **Security First**: Input validation, rate limiting, and XSS protection
- 📊 **Component Management**: CRUD operations for React components
- 🔍 **Search & Filter**: Find components by title, description, or code content
- 📈 **Analytics**: Basic usage statistics and metrics

## API Endpoints

### Components

| Method   | Endpoint               | Description                     |
| -------- | ---------------------- | ------------------------------- |
| `POST`   | `/api/components/save` | Save a new React component      |
| `GET`    | `/api/components/:id`  | Load a component by ID          |
| `PUT`    | `/api/components/:id`  | Update an existing component    |
| `DELETE` | `/api/components/:id`  | Delete a component              |
| `GET`    | `/api/components`      | List all components (paginated) |

### Health Check

| Method | Endpoint  | Description          |
| ------ | --------- | -------------------- |
| `GET`  | `/health` | Server health status |

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

### Production Deployment

```bash
npm start
```

## API Documentation

### Save Component

**POST** `/api/components/save`

Save a new React component with its properties.

**Request Body:**

```json
{
  "code": "function Counter() { const [count, setCount] = React.useState(0); return <div>Count: {count}</div>; }",
  "properties": {
    "0.0": {
      "style": {
        "color": "#ff0000",
        "fontSize": "18px"
      }
    }
  },
  "title": "Simple Counter",
  "description": "A basic counter component"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "http://localhost:3001/api/components/123e4567-e89b-12d3-a456-426614174000",
    "shareUrl": "http://localhost:3001/share/123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Load Component

**GET** `/api/components/:id`

Load a saved React component by its ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "function Counter() { ... }",
    "properties": { ... },
    "title": "Simple Counter",
    "description": "A basic counter component",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Component

**PUT** `/api/components/:id`

Update an existing React component.

**Request Body:**

```json
{
  "code": "function UpdatedCounter() { ... }",
  "title": "Updated Counter",
  "properties": { ... }
}
```

### List Components

**GET** `/api/components?page=1&limit=10`

List all components with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Simple Counter",
      "description": "A basic counter component",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## Security Features

### Input Validation

- **JSX Code Validation**: Prevents dangerous patterns like `eval()`, `innerHTML`, `<script>` tags
- **Property Sanitization**: Whitelist-based CSS property filtering
- **Size Limits**: Maximum code length and request size limits
- **XSS Protection**: Automatic sanitization of user inputs

### Rate Limiting

- **API Rate Limits**: 100 requests per 15 minutes per IP
- **Configurable**: Adjust limits via environment variables

### CORS Configuration

- **Development**: Allows `localhost:5173` and `localhost:3000`
- **Production**: Configure allowed origins via environment variables

## Data Storage

The backend uses a simple JSON file-based storage system for development. Components are stored in `backend/data/components.json`.

### Data Structure

```json
{
  "id": "uuid-v4",
  "code": "React component code",
  "properties": {
    "elementPath": {
      "style": { "color": "#ff0000" },
      "textContent": "Updated text"
    }
  },
  "title": "Component title",
  "description": "Component description",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/components/invalid-id",
  "method": "GET"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Development

### Project Structure

```
backend/
├── src/
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── data/                # JSON storage
├── tests/               # Test files
└── package.json
```

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

## Testing

Run the test suite:

```bash
npm test
```

Tests cover:

- API endpoint functionality
- Input validation
- Error handling
- Security measures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
