const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-6">
      <div className="container mx-auto flex justify-between">
        <div>© 2025 RENTZY</div>
        <div className="space-x-4">
          <a href="/cars">Xe Ô Tô</a>
          <a href="/motorbikes">Xe Máy</a>
          <a href="/profile">Profile</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
