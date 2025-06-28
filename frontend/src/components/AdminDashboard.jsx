// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';

// A reusable component for each statistic card
const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${color}`}>
        <div className="flex items-center">
            <div className="mr-4 text-3xl">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const response = await apiClient.get('/admin/dashboard/stats');
                setStats(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch dashboard stats:", err);
                setError("Could not load dashboard data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []); // Empty dependency array means this runs once on component mount

    if (isLoading) {
        return <div className="p-8"><p className="text-center">Loading Dashboard...</p></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    // Fallback if stats are still null for some reason
    if (!stats) {
        return <div className="p-8"><p className="text-center">No data available.</p></div>;
    }

    // Formatting values for display
    const formattedRevenue = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(stats.todaysRevenue);

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

            {/* Grid for the stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Today's Revenue" 
                    value={formattedRevenue} 
                    icon="₹" 
                    color="border-green-500"
                />
                <StatCard 
                    title="Today's Orders" 
                    value={stats.todaysOrdersCount} 
                    icon="📦" 
                    color="border-blue-500"
                />
                <StatCard 
                    title="Total Dishes" 
                    value={stats.totalDishesCount} 
                    icon="🍔" 
                    color="border-purple-500"
                />
                <StatCard 
                    title="Total Tables" 
                    value={stats.totalTablesCount} 
                    icon="🪑" 
                    color="border-yellow-500"
                />
            </div>

            {/* You can add more sections here in the future, like recent orders or charts */}
            <div className="mt-12 bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700">More Analytics Coming Soon...</h2>
                {/* Placeholder for future charts or lists */}
            </div>
        </div>
    );
};

export default AdminDashboard;