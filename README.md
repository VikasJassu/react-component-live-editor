# React Live Inspector

A powerful React component editor with live preview, element selection, and property editing capabilities. Built with React 19, Vite, and Node.js.

## ✨ Features

### Frontend

- 🎨 **Live JSX Preview** - See your React components render in real-time
- 🎯 **Element Selection** - Click on any element to inspect and edit
- 🛠️ **Property Editor** - Edit styles, text content, and more
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔄 **Auto-compilation** - Instant feedback as you type

### Backend

- 💾 **Component Persistence** - Save and load your components
- 🔗 **Share Links** - Share components via URLs
- 🛡️ **Security** - Input validation and XSS protection
- 📊 **XPath Integration** - Precise element targeting
- 🔄 **Code Updates** - Automatically update JSX with property changes

## 🚀 Quick Start

**👉 For detailed setup instructions, see [QUICK_START.md](QUICK_START.md)**

### Prerequisites

- Node.js 16+
- npm or yarn

### Fastest Way to Get Started

1. **Clone and setup**

   ```bash
   git clone <repository-url>
   cd react-live-inspector
   npm install
   ```

2. **Start simple backend**

   ```bash
   cd backend
   npm install express cors
   node start-simple.js
   ```

3. **Start frontend (new terminal)**

   ```bash
   npm run dev
   ```

4. **Open browser** to `http://localhost:5173`

### Full Setup (Advanced)

For production features like Babel AST parsing, file persistence, and security:

- Follow the complete setup in [QUICK_START.md](QUICK_START.md)
- Use the full backend with `npm run dev` in the backend directory

  Backend runs on `http://localhost:3001`

2. **Start the frontend (in a new terminal)**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## 🎯 How to Use

### Basic Usage

1. **Write JSX Code**: Paste or write React component code in the left panel
2. **Live Preview**: See your component render in the center panel
3. **Select Elements**: Click on any element in the preview to select it
4. **Edit Properties**: Use the right panel to edit styles and content
5. **Save & Share**: Click "Save Component" to persist and get a share link

### Advanced Features

#### Element Selection

- **Hover Effects**: Elements highlight on hover
- **XPath Generation**: Each selected element gets a unique XPath
- **Property Tracking**: Changes are tracked by XPath for precise updates

#### Property Editing

- **Style Properties**: Color, font size, padding, margin, etc.
- **Text Content**: Edit element text directly
- **Real-time Updates**: See changes instantly in the preview

#### Code Integration

- **Auto-update**: Saved components get updated JSX code with applied properties
- **XPath-based**: Backend uses XPath to precisely target elements for updates
- **Fallback**: If updates fail, original code is preserved

## 📁 Project Structure

```
react-live-inspector/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── CodeInput.tsx       # JSX code editor
│   │   ├── PreviewPane.tsx     # Live preview with selection
│   │   ├── Inspector.tsx       # Property editor
│   │   └── ErrorBoundary.tsx   # Error handling
│   ├── services/               # Frontend services
│   │   ├── JSXCompiler.ts      # Babel-based JSX compilation
│   │   └── ApiService.ts       # Backend API client
│   └── types/                  # TypeScript definitions
├── backend/                     # Backend source
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   │   ├── ComponentService.js    # Component CRUD
│   │   │   └── JSXUpdaterService.js   # JSX code manipulation
│   │   ├── middleware/         # Express middleware
│   │   └── utils/              # Utilities and validation
│   ├── data/                   # JSON storage
│   └── tests/                  # Test files
└── docs/                       # Documentation
```

## 🔧 API Endpoints

### Components

- `POST /api/components/save` - Save a component
- `GET /api/components/:id` - Load a component
- `PUT /api/components/:id` - Update a component
- `DELETE /api/components/:id` - Delete a component
- `GET /api/components` - List components (paginated)

### Health Check

- `GET /health` - Server health status

## 🛡️ Security Features

- **Input Validation**: JSX code validation and sanitization
- **XSS Protection**: Prevents script injection
- **Rate Limiting**: API rate limiting (100 requests/15min)
- **Property Whitelisting**: Only safe CSS properties allowed
- **CORS Configuration**: Proper cross-origin setup

## 🧪 Testing

### Frontend Tests

```bash
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### Manual Testing

1. Try pasting different React components
2. Test element selection and property editing
3. Save and load components via share links
4. Test error handling with invalid JSX

## 🔄 Development Workflow

### Adding New Features

1. **Frontend Changes**:

   - Add components in `src/components/`
   - Update types in `src/types/`
   - Add services in `src/services/`

2. **Backend Changes**:

   - Add routes in `backend/src/routes/`
   - Add services in `backend/src/services/`
   - Update validation in `backend/src/utils/`

3. **Testing**:
   - Add tests for new functionality
   - Test integration between frontend and backend

### Code Style

- Use TypeScript for frontend
- Use ESLint and Prettier for formatting
- Follow React best practices
- Use meaningful variable names

## 🚀 Deployment

### Frontend (Vite)

```bash
npm run build
npm run preview
```

### Backend (Node.js)

```bash
cd backend
npm start
```

### Environment Variables

- Set `VITE_API_URL` for frontend
- Set `PORT` and `NODE_ENV` for backend
- Configure CORS origins for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Backend not starting**: Check Node.js version (16+ required)
2. **CORS errors**: Verify `VITE_API_URL` in frontend `.env`
3. **Compilation errors**: Check JSX syntax in code input
4. **Save failures**: Check backend logs for validation errors

### Debug Mode

- Set `NODE_ENV=development` for detailed error messages
- Check browser console for frontend errors
- Check backend logs for API errors

## 📞 Support

For issues and questions:

- Check the troubleshooting section
- Review the API documentation
- Check existing GitHub issues
- Create a new issue with detailed information
