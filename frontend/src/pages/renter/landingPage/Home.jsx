import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Home = () => {

  // check role using redux and navigate based on role : 
  const { role, loading } = useSelector((state) => state.userStore);

  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'owner') {
      navigate('/owner');
    }
  }, [role, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>Home</div>
  )
}

export default Home