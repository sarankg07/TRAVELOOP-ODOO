import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TripDetail = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [cities, setCities] = useState([]);
  const [itineraries, setItineraries] = useState({});
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddCity, setShowAddCity] = useState(false);
  const [expandedCity, setExpandedCity] = useState(null);
  const [newCity, setNewCity] = useState({
    name: '',
    country: '',
    arrival_date: '',
    departure_date: ''
  });

  useEffect(() => {
    fetchTrip();
    fetchCities();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const response = await api.get(`/trips/${id}`);
      setTrip(response.data);
    } catch (error) {
      console.error('Failed to fetch trip:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get(`/cities/trip/${id}`);
      setCities(response.data);
      
      // Fetch itineraries for each city
      const itinerariesMap = {};
      const activitiesMap = {};
      
      for (const city of response.data) {
        const itineraryRes = await api.get(`/itineraries/city/${city.id}`);
        itinerariesMap[city.id] = itineraryRes.data;
        
        // Fetch activities for each itinerary
        for (const itinerary of itineraryRes.data) {
          const activityRes = await api.get(`/activities/itinerary/${itinerary.id}`);
          activitiesMap[itinerary.id] = activityRes.data;
        }
      }
      
      setItineraries(itinerariesMap);
      setActivities(activitiesMap);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/cities', {
        ...newCity,
        trip_id: id,
        order_index: cities.length
      });
      setCities([...cities, response.data]);
      setItineraries({ ...itineraries, [response.data.id]: [] });
      setShowAddCity(false);
      setNewCity({ name: '', country: '', arrival_date: '', departure_date: '' });
    } catch (error) {
      console.error('Failed to add city:', error);
      alert('Failed to add city');
    }
  };

  const handleDeleteCity = async (cityId) => {
    if (!window.confirm('Delete this city and all its itineraries?')) return;
    try {
      await api.delete(`/cities/${cityId}`);
      setCities(cities.filter(city => city.id !== cityId));
      const newItineraries = { ...itineraries };
      delete newItineraries[cityId];
      setItineraries(newItineraries);
    } catch (error) {
      console.error('Failed to delete city:', error);
      alert('Failed to delete city');
    }
  };

  const handleDeleteDay = async (dayId, cityId) => {
    if (!window.confirm('Delete this day and all its activities?')) return;
    try {
      await api.delete(`/itineraries/${dayId}`);
      const updatedItineraries = itineraries[cityId].filter(day => day.id !== dayId);
      setItineraries({ ...itineraries, [cityId]: updatedItineraries });
    } catch (error) {
      console.error('Failed to delete day:', error);
      alert('Failed to delete day');
    }
  };

  const handleDeleteActivity = async (activityId, itineraryId, cityId) => {
    try {
      await api.delete(`/activities/${activityId}`);
      const updatedActivities = { ...activities };
      updatedActivities[itineraryId] = updatedActivities[itineraryId].filter(act => act.id !== activityId);
      setActivities(updatedActivities);
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleToggleBooked = async (activity, itineraryId, cityId) => {
    try {
      await api.put(`/activities/${activity.id}`, {
        ...activity,
        is_booked: !activity.is_booked
      });
      // Refresh data
      fetchCities();
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCityExpand = (cityId) => {
    if (expandedCity === cityId) {
      setExpandedCity(null);
    } else {
      setExpandedCity(cityId);
    }
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
                <Link to="/trips" className="text-gray-700 hover:text-blue-600">My Trips</Link>
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
        <div className="mb-4">
          <Link to="/trips" className="text-blue-600 hover:underline">← Back to Trips</Link>
        </div>
        
        {trip && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-gray-800">{trip.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm ${
                trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                trip.status === 'planning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {trip.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div>
                <label className="text-sm text-gray-500">Start Date</label>
                <p className="text-lg font-semibold">{new Date(trip.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">End Date</label>
                <p className="text-lg font-semibold">{new Date(trip.end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Total Budget</label>
                <p className="text-2xl font-bold text-green-600">${trip.total_budget?.toLocaleString() || 0}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Duration</label>
                <p className="text-lg font-semibold">
                  {Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cities Section with Itineraries */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📍 Cities & Itinerary</h2>
            <button
              onClick={() => setShowAddCity(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add City
            </button>
          </div>

          {cities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No cities added yet. Start by adding a city to your trip!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cities.map((city) => {
                const cityItineraries = itineraries[city.id] || [];
                const hasItineraries = cityItineraries.length > 0;
                
                return (
                  <div key={city.id} className="border rounded-lg overflow-hidden">
                    {/* City Header */}
                    <div 
                      className="bg-gray-50 p-6 cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => toggleCityExpand(city.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {city.name}{city.country ? `, ${city.country}` : ''}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {city.arrival_date && new Date(city.arrival_date).toLocaleDateString()} - 
                            {city.departure_date && new Date(city.departure_date).toLocaleDateString()}
                          </p>
                          {hasItineraries && (
                            <p className="text-sm text-blue-600 mt-1">
                              📅 {cityItineraries.length} day{cityItineraries.length !== 1 ? 's' : ''} planned
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCityExpand(city.id);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedCity === city.id ? '▲' : '▼'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCity(city.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Itinerary Days */}
                    {expandedCity === city.id && (
                      <div className="p-6 bg-white">
                        {!hasItineraries ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">No itinerary days yet.</p>
                            <Link
                              to={`/city/${city.id}/itinerary`}
                              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                              + Add Itinerary Days
                            </Link>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-gray-700">Itinerary</h4>
                              <Link
                                to={`/city/${city.id}/itinerary`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit Full Itinerary →
                              </Link>
                            </div>
                            <div className="space-y-4">
                              {cityItineraries.map((day) => {
                                const dayActivities = activities[day.id] || [];
                                return (
                                  <div key={day.id} className="border rounded-lg overflow-hidden">
                                    <div className="bg-blue-50 px-4 py-2 flex justify-between items-center">
                                      <div>
                                        <span className="font-semibold text-blue-800">Day {day.day_number}</span>
                                        <span className="text-sm text-gray-600 ml-2">
                                          {new Date(day.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteDay(day.id, city.id)}
                                        className="text-red-500 text-sm hover:text-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    <div className="p-4">
                                      {day.notes && (
                                        <p className="text-sm text-gray-600 mb-3 bg-yellow-50 p-2 rounded">
                                          📝 {day.notes}
                                        </p>
                                      )}
                                      {dayActivities.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No activities added yet.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {dayActivities.map((activity) => (
                                            <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                              <div className="flex items-center space-x-3 flex-1">
                                                <input
                                                  type="checkbox"
                                                  checked={activity.is_booked}
                                                  onChange={() => handleToggleBooked(activity, day.id, city.id)}
                                                  className="w-4 h-4 text-blue-600"
                                                />
                                                <div>
                                                  <span className={`${activity.is_booked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                    {activity.name}
                                                  </span>
                                                  <div className="text-xs text-gray-500">
                                                    {activity.start_time && activity.start_time.slice(0,5)} - {activity.end_time && activity.end_time.slice(0,5)} • {activity.location}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-3">
                                                <span className="text-sm font-semibold text-green-600">
                                                  ${activity.cost}
                                                </span>
                                                <button
                                                  onClick={() => handleDeleteActivity(activity.id, day.id, city.id)}
                                                  className="text-red-500 text-sm hover:text-red-700"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <Link
                                        to={`/city/${city.id}/itinerary`}
                                        className="text-blue-600 text-sm mt-3 inline-block hover:underline"
                                      >
                                        + Add Activity
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add City Modal */}
      {showAddCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add City</h3>
            <form onSubmit={handleAddCity}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">City Name *</label>
                <input
                  type="text"
                  value={newCity.name}
                  onChange={(e) => setNewCity({...newCity, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={newCity.country}
                  onChange={(e) => setNewCity({...newCity, country: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 mb-2">Arrival Date</label>
                  <input
                    type="date"
                    value={newCity.arrival_date}
                    onChange={(e) => setNewCity({...newCity, arrival_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Departure Date</label>
                  <input
                    type="date"
                    value={newCity.departure_date}
                    onChange={(e) => setNewCity({...newCity, departure_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add City
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCity(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetail;