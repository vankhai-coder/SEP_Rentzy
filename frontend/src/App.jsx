import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home.jsx'
import LoginPage from './pages/Login.jsx'
import Layout from './components/Layout.jsx'

const App = () => {

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Login,Register: */}
          <Route path='/login' element={<LoginPage />} />

          {/* Home : */}
          <Route path='/' element={<HomePage />} />

          {/* RENTER ROUTES :  */}

          {/* OWNER ROUTES :  */}

          {/* ADMIN ROUTES :  */}

          {/* 404 fallback */}
          <Route path="*" element={<HomePage />} />

        </Routes>
      </Layout>
    </Router>
  )
}

export default App 