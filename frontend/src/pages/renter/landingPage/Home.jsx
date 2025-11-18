// pages/renter/landingPage/Home.jsx
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Hero from "@/components/common/Hero";
import RecommendationSection from "@/components/renter/recommendation/RecommendationSection";

const Home = () => {
  const { role, loading } = useSelector((state) => state.userStore);
  const navigate = useNavigate();

  useEffect(() => {
    if (role === "admin") navigate("/admin");
    else if (role === "owner") navigate("/owner");
  }, [role, navigate]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <RecommendationSection limit={8} />
    </div>
  );
};

export default Home;
