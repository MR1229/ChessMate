import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './theme/ThemeProvider'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
