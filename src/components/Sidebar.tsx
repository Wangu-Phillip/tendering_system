import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole?: "admin" | "vendor" | "buyer" | null;
}

export default function Sidebar({ isOpen, onToggle, userRole }: SidebarProps) {
  const location = useLocation();

  // Define menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tenders", href: "/tenders" },
    ];

    switch (userRole) {
      case "vendor":
        // Bidder menu
        return [
          ...commonItems,
          { label: "My Bids", href: "/bids" },
          { label: "Profile", href: "/profile" },
        ];
      case "buyer":
        // Procurement Entity menu
        return [
          ...commonItems,
          { label: "Bid Submissions", href: "/bids" },
          { label: "Analytics", href: "/analytics" },
          { label: "Profile", href: "/profile" },
        ];
      case "admin":
        // Administrator menu
        return [
          ...commonItems,
          { label: "Bids", href: "/bids" },
          { label: "Analytics", href: "/analytics" },
          { label: "Users", href: "/dashboard" },
          { label: "Profile", href: "/profile" },
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();
  const isActive = (href: string) => location.pathname === href;

  return (
    <aside
      className={`bg-primary text-white transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } h-screen flex flex-col`}
    >
      <button onClick={onToggle} className="p-4 hover:bg-gray-800">
        ☰
      </button>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`block px-4 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? "bg-secondary text-white"
                    : "text-gray-200 hover:bg-gray-800"
                }`}
              >
                {isOpen && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
