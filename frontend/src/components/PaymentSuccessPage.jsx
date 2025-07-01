// src/pages/PaymentSuccessPage.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function PaymentSuccessPage() {
    const location = useLocation();
    const orderDetails = location.state?.orderDetails;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 px-4 py-12 text-center">
            <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl max-w-lg w-full">
                {/* A simple checkmark icon */}
                <svg className="mx-auto h-16 w-16 text-green-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <h1 className="text-3xl md:text-4xl font-bold text-green-600 mb-4">Payment Successful!</h1>
                
                <p className="text-slate-700 text-lg mb-8">
                    Thank you for your payment. We hope you enjoyed your meal!
                </p>

                {orderDetails?.internalOrderId && (
                    <p className="text-sm text-slate-500 mb-8">
                        Reference Order ID: {orderDetails.internalOrderId}
                    </p>
                )}

                <Link
                    to="/" // Link to the root of your app
                    className="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}


export default PaymentSuccessPage;