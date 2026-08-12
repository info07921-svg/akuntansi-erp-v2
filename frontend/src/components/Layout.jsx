import Sidebar from "./Sidebar";
import Header from "./Header";

import "../styles/layout.css";

export default function Layout({ children }) {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-content">

        <Header />

        <div className="page-content">
          {children}
        </div>

      </div>

    </div>
  );
}