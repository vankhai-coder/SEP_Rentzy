import { useDispatch } from 'react-redux';
import Footer from './Footer.jsx';
import Header from './Header.jsx'
import { useEffect } from 'react';
import { checkAuth } from '@/redux/features/auth/authSlice.js';
import { useSearchParams } from 'react-router-dom';

const Layout = ({ children }) => {

  const dispatch = useDispatch()

  // search param for checkauth : 
  const [searchParams] = useSearchParams();
   const googleCheckAuth = searchParams.get("googleCheckAuth");

  useEffect(() => {
   if(googleCheckAuth){
     dispatch(checkAuth())
   }
  }, [])

  return (
    <div className=' px-40'>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="">{children}</main>

      {/* Footer : */}
      <Footer />
    </div>
  );
};

export default Layout;
