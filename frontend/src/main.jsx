import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { store } from './redux/store/store'
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Toaster richColors position="top-center" />
      <App />
    </Provider>
  </StrictMode>,
)
