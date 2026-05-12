import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import logo from "@/assets/logo.png";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const Icon = ({ name, className }) => {
  const LucideIcon = LucideIcons[name] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
};

const NAV_ITEMS = [
  { path: "/dashboard/cotizaciones-home", label: "Dashboard", icon: "LayoutDashboard" },
  { path: "/dashboard/aprobacion-cotizacion", label: "Comercial", icon: "FileText" },
  { path: "/dashboard/proyectos", label: "Proyectos", icon: "Briefcase" },
  { path: "/dashboard/compras", label: "Compras", icon: "ShoppingCart" },
  { path: "/dashboard/almacen", label: "Almacén", icon: "Package" },
  { path: "/dashboard/finanzas", label: "Finanzas", icon: "DollarSign" },
  { path: "/dashboard/tablas/catalogo", label: "Maestro", icon: "Database" },
  { path: "/dashboard/audit", label: "Auditoría", icon: "ShieldCheck" },
];

export default function DashboardLayout() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { authUser: user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    logout();
    navigate("/login");
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const path = `/${parts.slice(0, index + 1).join("/")}`;
      const isLast = index === parts.length - 1;
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      return { path, label, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen w-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          isExpanded ? "w-60" : "w-20"
        } flex flex-col h-full bg-white border-r border-gray-200 shrink-0 transition-all duration-300 z-40`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center overflow-hidden">
            <img src={logo} alt="Logo" className="h-8 w-8 object-contain shrink-0" />
            {isExpanded && (
              <span className="text-xl font-bold text-gray-900 ml-2 whitespace-nowrap">
                SIGECOM
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? (
              <LucideIcons.PanelLeftClose className="h-5 w-5 text-gray-400 hover:text-indigo-600" />
            ) : (
              <LucideIcons.PanelLeftOpen className="h-5 w-5 text-gray-400 hover:text-indigo-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } ${isExpanded ? "" : "justify-center"}`}
              >
                <Icon
                  name={item.icon}
                  className={`h-5 w-5 ${isExpanded ? "mr-3" : ""} ${
                    isActive ? "text-indigo-600" : "text-gray-400"
                  }`}
                />
                {isExpanded && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex-shrink-0 flex border-t border-gray-200 p-4 bg-gray-50/50">
          <div className="flex items-center w-full min-w-0">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.usuario?.substring(0, 2).toUpperCase() || "US"}
            </div>
            {isExpanded && (
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-700 truncate">
                  {user?.usuario || "Usuario"}
                </p>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30">
          <nav className="flex items-center overflow-hidden">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 min-w-0">
              <li>
                <NavLink to="/dashboard/cotizaciones-home" className="hover:text-indigo-600 transition-colors">
                  <LucideIcons.Home className="h-4 w-4" />
                </NavLink>
              </li>
              {breadcrumbs.slice(1).map((crumb) => (
                <li key={crumb.path} className="flex items-center min-w-0">
                  <LucideIcons.ChevronRight className="h-4 w-4 text-gray-300 mx-1 shrink-0" />
                  {crumb.isLast ? (
                    <span className="font-bold text-indigo-600 truncate uppercase tracking-tight">
                      {crumb.label}
                    </span>
                  ) : (
                    <NavLink 
                      to={crumb.path} 
                      className="hover:text-gray-900 transition-colors truncate"
                    >
                      {crumb.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          
          <div className="flex items-center space-x-4">
             {/* Dynamic icons or actions could go here */}
             <div className="h-8 w-px bg-gray-200" />
             <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all">
                <LucideIcons.Bell className="h-5 w-5" />
             </button>
             <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all">
                <LucideIcons.Settings className="h-5 w-5" />
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50/50">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
