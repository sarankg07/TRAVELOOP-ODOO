import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TripList = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips');
      setTrips(response.data);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    
    setDeleting(id);
    try {
      await api.delete(`/trips/${id}`);
      setTrips(trips.filter(trip => trip.id !== id));
    } catch (error) {
      console.error('Failed to delete trip:', error);
      alert('Failed to delete trip');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">✈️ Traveloop</h1>
              <div className="flex space-x-4">
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
                <Link to="/trips" className="text-gray-700 hover:text-blue-600 font-semibold">My Trips</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Trips</h2>
          <Link to="/trips/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Create New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No trips yet. Start planning your adventure!</p>
            <Link to="/trips/new" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{trip.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                      trip.status === 'planning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-2xl font-bold text-green-600 mb-4">${trip.total_budget}</p>
                  <div className="flex space-x-2">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      disabled={deleting === trip.id}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleting === trip.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripList;