import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home";
import Tree from "./pages/tree";

export default function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tree" element={<Tree />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
