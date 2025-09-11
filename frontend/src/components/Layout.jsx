import Footer from './Footer.jsx';
import Header from './Header.jsx'

const Layout = ({ children }) => {
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
