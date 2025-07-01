import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center">
    <h1 className="text-6xl font-bold text-gray-800">404</h1>
    <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
    <Link to="/" className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
      Go Home
    </Link>
  </div>
);

export default NotFoundPage;