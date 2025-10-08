
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaCar, FaExclamationTriangle, FaProjectDiagram } from 'react-icons/fa';

const Sidebar = () => {
  const linkClasses = "flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700 rounded-lg transition-colors duration-200";
  const activeLinkClasses = "bg-gray-700";

  return (
    <aside className="w-64 bg-gray-800 text-white flex-shrink-0">
      <div className="p-6 flex items-center justify-center border-b border-gray-700">
        <FaProjectDiagram className="text-3xl text-blue-400 mr-3" />
        <h1 className="text-xl font-bold tracking-wider">V2V System</h1>
      </div>
      <nav className="p-4">
        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
              <FaTachometerAlt className="mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li className="mt-2">
            <NavLink to="/vehicles" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
              <FaCar className="mr-3" />
              Vehicles
            </NavLink>
          </li>
          <li className="mt-2">
            <NavLink to="/alerts" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
              <FaExclamationTriangle className="mr-3" />
              Alerts
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
