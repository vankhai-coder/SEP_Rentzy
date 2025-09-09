import Footer from './Footer.jsx';
import Header from './Header.jsx'

const Layout = ({ children }) => {
  return (
    <div>
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
