# React Live Inspector - Quick Start Guide

## 🚀 Two Ways to Run the Backend

### Option 1: Simple Backend (Recommended for Quick Testing)

This approach uses minimal dependencies and a simple JSX updater.

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install minimal dependencies**

   ```bash
   npm install express cors
   ```

3. **Start the simple backend**
   ```bash
   node start-simple.js
   ```

The backend will run on `http://localhost:3001`

### Option 2: Full Backend (Advanced Features)

This approach uses Babel for proper JSX parsing and manipulation.

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install all dependencies**

   ```bash
   npm install
   ```

3. **Start the full backend**
   ```bash
   npm run dev
   ```

## 🎯 Frontend Setup

1. **Install frontend dependencies**

   ```bash
   npm install
   ```

2. **Create environment file**

   ```bash
   cp .env.example .env
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## ✨ Features Available

### Simple Backend Features:

- ✅ Save and load components
- ✅ Basic JSX code updating
- ✅ XPath-based element selection
- ✅ In-memory storage
- ✅ Share links
- ✅ Property editing (basic)

### Full Backend Features:

- ✅ All simple backend features
- ✅ Advanced JSX parsing with Babel AST
- ✅ Precise element targeting
- ✅ File-based persistence
- ✅ Input validation and security
- ✅ Rate limiting
- ✅ Comprehensive error handling

## 🧪 Testing the System

1. **Start the backend** (choose Option 1 or 2 above)
2. **Start the frontend**
3. **Open browser** to `http://localhost:5173`
4. **Test the workflow**:
   - Paste JSX code in the left panel
   - Click elements in the preview (center panel)
   - Edit properties in the inspector (right panel)
   - Click "Save Component" to persist changes
   - Notice the JSX code updates with your changes

## 🎨 Example Workflow

1. **Paste this JSX code**:

   ```jsx
   function Counter() {
     const [count, setCount] = React.useState(0);

     return (
       <div>
         <h1>React Counter</h1>
         <p>Count: {count}</p>
         <button onClick={() => setCount(count + 1)}>Increment</button>
       </div>
     );
   }
   ```

2. **Click on the "React Counter" heading**
3. **Change the color to red in the inspector**
4. **Click "Save Component"**
5. **See the JSX code update** with `style={{color: '#ff0000'}}`

## 🔧 Troubleshooting

### Backend Issues:

- **Port 3001 in use**: Change PORT in backend code or kill existing process
- **CORS errors**: Ensure frontend is running on port 5173 or 3000
- **Module not found**: Run `npm install` in backend directory

### Frontend Issues:

- **API connection failed**: Ensure backend is running on port 3001
- **Compilation errors**: Check JSX syntax in the code input
- **Element selection not working**: Try refreshing the page

### Common Solutions:

1. **Restart both servers** if you encounter issues
2. **Check browser console** for error messages
3. **Verify ports**: Backend on 3001, Frontend on 5173
4. **Clear browser cache** if components don't load

## 📁 Project Structure

```
react-live-inspector/
├── src/                     # Frontend React app
│   ├── components/         # React components
│   ├── services/          # API and compilation services
│   └── types/             # TypeScript definitions
├── backend/               # Backend API
│   ├── start-simple.js    # Simple backend (minimal deps)
│   ├── src/               # Full backend source
│   └── package.json       # Dependencies
└── docs/                  # Documentation
```

## 🎯 Next Steps

Once you have the basic system running:

1. **Experiment with different JSX components**
2. **Try various property edits** (colors, fonts, spacing)
3. **Test the save/load functionality**
4. **Share components** using the generated URLs
5. **Explore the XPath generation** by copying element paths

## 🤝 Need Help?

- Check the browser console for errors
- Verify both servers are running
- Ensure correct ports (3001 for backend, 5173 for frontend)
- Try the simple backend first if you encounter dependency issues

Happy coding! 🎉
