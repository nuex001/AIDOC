import React, { useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";

function Sign() {
  const location = useLocation(); // Get current URL location
  const navigate = useNavigate();
  const signFunc = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/auth/github`
      );
      // console.log("API Response:", response.data.url);
      window.open(response.data.url, "_blank");
    } catch (error) {
      const err = error?.response?.data.msg;
      console.error("Error fetching repos:", error?.response?.data.msg);
    }
  };

  //
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token"); // Extract token parameter

    if (token) {
      localStorage.setItem("token", token);
      // Refresh the page
      window.location.href = window.location.origin;
    } else {
      console.log("No token in URL");
    }
  }, [location]);

  //
  useEffect(() => {
    const token = localStorage.getItem("token"); // Extract token parameter

    if (token) {
      navigate("/");
    } else {
      console.log("No token in Storage");
    }
  }, []);

  return (
    <div className="sign">
      <div className="txt">
        {/* <h1>🚀 AIDOC: Instant Project Documentation</h1> */}
        <h1>Turn Your Code into Clear, Structured Docs in Seconds!</h1>
        <p>
          Generate well-formatted, easy-to-read documentation in{" "}
          <strong>XML, HTML, or Markdown</strong>—perfect for developers and
          teams.
        </p>
        <button onClick={signFunc}>
          Sign In
          <FaGithub />
        </button>
      </div>
    </div>
  );
}

export default Sign;
