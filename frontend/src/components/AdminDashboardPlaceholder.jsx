import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming this context provides user info

// Example Heroicons (outline style). You'd typically import these from a library like @heroicons/react
const AdjustmentsHorizontalIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
  </svg>
);

const Square3Stack3DIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10.5 11.25h3M12 15h.008" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M17.25 4.5l-1.5 1.5L12 4.5l-3.75 1.5L4.5 4.5m12.75 0l-1.5 1.5L12 4.5" /> {/* Simplified this icon part a bit */}
  </svg>
);

const TableCellsIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

const ShoppingBagIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const CheckCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);


function AdminDashboardPlaceholder() {
  const { user } = useAuth();

  // Define your primary brand color, e.g., from tailwind.config.js
  // const primaryColor = 'indigo'; // Replace with your brand color e.g. 'brand-blue'
  // For demonstration, I'll use a pleasing blue and green directly.

  const cardBaseStyle = "bg-white p-6 rounded-xl shadow-lg transition-all hover:shadow-2xl"; // Added hover effect
  const cardTitleStyle = "text-xl font-semibold text-slate-700 mb-4"; // Made title more prominent

  const quickActionLinkStyle = `
    flex items-center p-3 text-slate-600 hover:text-sky-600 hover:bg-sky-50 
    rounded-md transition-colors duration-150 group
  `; // Replaced indigo with sky for a different blue tone

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"> {/* Lighter page background, more padding */}
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Admin Dashboard</h1>
        {user?.username && (
          <p className="mt-2 text-lg text-slate-600">
            Welcome back, <span className="font-semibold text-sky-700">{user.username}</span>!
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"> {/* Increased gap slightly for larger screens */}
        {/* Welcome/Overview Card */}
        <div className={`${cardBaseStyle} md:col-span-2 lg:col-span-1`}> {/* Example of spanning */}
          <h2 className={cardTitleStyle}>Overview</h2>
          <p className="text-slate-500 leading-relaxed">
            Manage your restaurant's operations, track performance, and engage with staff effectively.
          </p>
          <div className="mt-6">
            <Link 
                to="/admin/profile" // Example: Link to a profile page
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
                View Your Profile
            </Link>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className={cardBaseStyle}>
          <h2 className={cardTitleStyle}>Quick Actions</h2>
          <div className="space-y-3"> {/* Increased spacing between actions */}
            <Link to="/admin/categories" className={quickActionLinkStyle}>
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-3 text-slate-400 group-hover:text-sky-500 transition-colors" />
              Manage Categories
            </Link>
            <Link to="/admin/dishes" className={quickActionLinkStyle}>
              <Square3Stack3DIcon className="h-5 w-5 mr-3 text-slate-400 group-hover:text-sky-500 transition-colors" />
              Manage Dishes
            </Link>
            <Link to="/admin/tables" className={quickActionLinkStyle}>
              <TableCellsIcon className="h-5 w-5 mr-3 text-slate-400 group-hover:text-sky-500 transition-colors" />
              Manage Tables
            </Link>
            <Link to="/orders" className={quickActionLinkStyle}>
              <ShoppingBagIcon className="h-5 w-5 mr-3 text-slate-400 group-hover:text-sky-500 transition-colors" />
              View All Orders
            </Link>
          </div>
        </div>

        {/* System Status Card */}
        <div className={cardBaseStyle}>
          <h2 className={cardTitleStyle}>System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center text-emerald-600"> {/* Using a nice green */}
              <CheckCircleIcon className="h-6 w-6 mr-2" />
              <span className="font-medium">System Online</span>
            </div>
            <p className="text-slate-500 pl-8"> {/* Indent for sub-text */}
              All services are operational and running smoothly.
            </p>
            {/* You could add more status items here */}
            {/* <div className="flex items-center text-amber-600">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
              <span className="font-medium">New Updates Pending</span>
            </div> */}
          </div>
        </div>
      </div>

      {/* Additional Content - "Getting Started" styled more as a guide */}
      <div className={`mt-8 lg:mt-10 ${cardBaseStyle}`}>
        <h2 className={cardTitleStyle}>Getting Started Guide</h2>
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            This dashboard provides a centralized hub for all your restaurant management needs.
            Explore the sections to:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4 marker:text-sky-500"> {/* Styled list markers */}
            <li>Create, update, and organize menu categories and individual dishes with detailed descriptions and pricing.</li>
            <li>Efficiently manage your restaurant's table layout, availability, and assignments.</li>
            <li>Oversee incoming customer orders, update their statuses, and view order histories.</li>
            <li>Monitor system health and ensure smooth operations.</li>
          </ul>
          <p className="mt-4">
            Need help? Check out our <a href="/admin/help" className="text-sky-600 hover:text-sky-800 font-medium hover:underline">Help Documentation</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPlaceholder;