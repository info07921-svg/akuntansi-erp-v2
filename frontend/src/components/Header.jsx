import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/header.css";

export default function Header() {

  const [showMenu, setShowMenu] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="header">

      <h2 className="header-title">
        ERP Akuntansi
      </h2>

      <div className="header-right">

        <input
          type="text"
          placeholder="Cari..."
          className="search-box"
        />

        <div
          className="user-box"
          onClick={() => setShowMenu(!showMenu)}
        >
          Administrator ▼

          {showMenu && (
            <div className="dropdown-menu">

  <div
    className="dropdown-item logout"
    onClick={handleLogout}
  >
    Logout
  </div>

</div>
          )}

        </div>

      </div>

    </header>
  );
}