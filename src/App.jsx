import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home";
import Sign from "./components/pages/Sign";
import ScrollToTop from "./components/pages/ScrollToTop";
import PrivateRoute from "./components/pages/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <ScrollToTop />
        <Routes>
          <Route exact path="/sign" element={<Sign />} />
          <Route element={<PrivateRoute />}>
            <Route exact path="/" element={<Home />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
