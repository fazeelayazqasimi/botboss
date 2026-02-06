import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CompanyDashboard from "./pages/CompanyDashboard";
import SeekerDashboard from "./pages/SeekerDashboard";
import InterviewPage from './pages/InterviewPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/CompanyDashboard" element={<CompanyDashboard />} />
      <Route path="/SeekerDashboard" element={<SeekerDashboard />} />
      <Route path="/interview/:applicationId/:jobId" element={<InterviewPage />} />
    </Routes>
  );
}

export default App;