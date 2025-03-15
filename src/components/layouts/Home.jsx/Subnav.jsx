import axios from "axios";
import React, { useEffect, useState } from "react";

function Subnav() {
  const [userInfo, setUserInfo] = useState(null);
  // FETCH GENERAL ALL REPOS
  const fetchUserInfoFunc = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user`);
      console.log("API Response:", response.data);
      setUserInfo(response.data);
    } catch (error) {
      console.log(error);

      console.error("Error fetching repos:", error?.response?.data.msg);
    }
  };
  useEffect(() => {
    fetchUserInfoFunc();
  }, []); // No dependency array needed since no external dependencies

  return (
    <div className="subnav">
      <h1>
        {/* <span className="name">{userInfo && userInfo.username}</span>  */}
        Turn Your Code into Clear, Structured Docs in Seconds!
      </h1>
      <div className="dpcont">
        <h1>
          {userInfo && userInfo.dailyUsage}
          <span className="no">/3</span>
        </h1>
        <img src={userInfo ? userInfo.avatar : "./logo.jpg"} alt="" />
      </div>
    </div>
  );
}

export default Subnav;
