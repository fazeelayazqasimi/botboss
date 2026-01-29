import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CompanyDashboard from "./pages/CompanyDashboard";
import SeekerDashboard from "./pages/SeekerDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/CompanyDashboard" element={<CompanyDashboard />} />
      <Route path="/SeekerDashboard" element={<SeekerDashboard />} />
    </Routes>
  );
}

export default App;