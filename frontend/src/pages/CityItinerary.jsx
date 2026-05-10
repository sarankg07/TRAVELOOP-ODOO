import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CityItinerary = () => {
  const { cityId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState(null);
  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(null);
  const [newDay, setNewDay] = useState({ day_number: '', date: '', notes: '' });
  const [newActivity, setNewActivity] = useState({
    name: '',
    start_time: '',
    end_time: '',
    cost: '',
    location: '',
    type: 'activity'
  });

  useEffect(() => {
    fetchCityAndTrip();
    fetchItineraries();
  }, [cityId]);

  const fetchCityAndTrip = async () => {
    try {
      // Get city details
      const citiesRes = await api.get(`/cities/trip/${cityId}`);
      const currentCity = citiesRes.data.find(c => c.id == cityId);
      setCity(currentCity);
      
      if (currentCity) {
        const tripRes = await api.get(`/trips/${currentCity.trip_id}`);
        setTrip(tripRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch city:', error);
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await api.get(`/itineraries/city/${cityId}`);
      setItineraries(res.data);
      
      // Fetch activities for each itinerary
      const activitiesMap = {};
      for (const itinerary of res.data) {
        const activitiesRes = await api.get(`/activities/itinerary/${itinerary.id}`);
        activitiesMap[itinerary.id] = activitiesRes.data;
      }
      setActivities(activitiesMap);
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDay = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/itineraries', {
        ...newDay,
        city_id: parseInt(cityId),
        day_number: parseInt(newDay.day_number)
      });
      setItineraries([...itineraries, res.data]);
      setActivities({ ...activities, [res.data.id]: [] });
      setShowAddDay(false);
      setNewDay({ day_number: '', date: '', notes: '' });
    } catch (error) {
      console.error('Failed to add day:', error);
      alert('Failed to add day');
    }
  };

  const handleAddActivity = async (itineraryId, e) => {
    e.preventDefault();
    try {
      const res = await api.post('/activities', {
        ...newActivity,
        itinerary_id: itineraryId,
        cost: parseFloat(newActivity.cost) || 0
      });
      
      setActivities({
        ...activities,
        [itineraryId]: [...(activities[itineraryId] || []), res.data]
      });
      setShowAddActivity(null);
      setNewActivity({ name: '', start_time: '', end_time: '', cost: '', location: '', type: 'activity' });
    } catch (error) {
      console.error('Failed to add activity:', error);
      alert('Failed to add activity');
    }
  };

  const handleDeleteDay = async (dayId) => {
    if (!window.confirm('Delete this day and all its activities?')) return;
    try {
      await api.delete(`/itineraries/${dayId}`);
      setItineraries(itineraries.filter(day => day.id !== dayId));
      const newActivities = { ...activities };
      delete newActivities[dayId];
      setActivities(newActivities);
    } catch (error) {
      console.error('Failed to delete day:', error);
      alert('Failed to delete day');
    }
  };

  const handleDeleteActivity = async (activityId, itineraryId) => {
    try {
      await api.delete(`/activities/${activityId}`);
      setActivities({
        ...activities,
        [itineraryId]: activities[itineraryId].filter(act => act.id !== activityId)
      });
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleToggleBooked = async (activity) => {
    try {
      await api.put(`/activities/${activity.id}`, {
        ...activity,
        is_booked: !activity.is_booked
      });
      // Refresh activities
      fetchItineraries();
    } catch (error) {
      console.error('Failed to update booking status:', error);
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link to={`/trips/${trip?.id}`} className="text-blue-600 hover:underline">
            ← Back to {trip?.name}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{city?.name}</h1>
              <p className="text-gray-500 mt-1">
                {city?.country} • {city?.arrival_date && new Date(city.arrival_date).toLocaleDateString()} - 
                {city?.departure_date && new Date(city.departure_date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setShowAddDay(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Day
            </button>
          </div>
        </div>

        {/* Itinerary Days */}
        {itineraries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No itinerary days created yet.</p>
            <button
              onClick={() => setShowAddDay(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Your First Day
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {itineraries.map((day) => (
              <div key={day.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white">Day {day.day_number}</h3>
                      <p className="text-blue-100">{new Date(day.date).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDay(day.id)}
                      className="text-white hover:text-red-200"
                    >
                      Delete Day
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {day.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">{day.notes}</p>
                    </div>
                  )}
                  
                  {/* Activities */}
                  <div className="space-y-3 mb-4">
                    <h4 className="font-semibold text-gray-700">Activities</h4>
                    {activities[day.id]?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No activities planned yet.</p>
                    ) : (
                      activities[day.id]?.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={activity.is_booked}
                                onChange={() => handleToggleBooked(activity)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className={`font-medium ${activity.is_booked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {activity.name}
                              </span>
                              {activity.type === 'flight' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">✈️ Flight</span>}
                              {activity.type === 'hotel' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">🏨 Hotel</span>}
                              {activity.type === 'food' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🍜 Food</span>}
                            </div>
                            <div className="text-sm text-gray-500 ml-7">
                              {activity.start_time} - {activity.end_time} • {activity.location}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-green-600">${activity.cost}</span>
                            <button
                              onClick={() => handleDeleteActivity(activity.id, day.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <button
                    onClick={() => setShowAddActivity(day.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Activity
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Day Modal */}
      {showAddDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Itinerary Day</h3>
            <form onSubmit={handleAddDay}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Day Number *</label>
                <input
                  type="number"
                  value={newDay.day_number}
                  onChange={(e) => setNewDay({...newDay, day_number: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={newDay.date}
                  onChange={(e) => setNewDay({...newDay, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newDay.notes}
                  onChange={(e) => setNewDay({...newDay, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add Day
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDay(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Activity</h3>
            <form onSubmit={(e) => handleAddActivity(showAddActivity, e)}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Activity Name *</label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Visit Taj Mahal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newActivity.start_time}
                    onChange={(e) => setNewActivity({...newActivity, start_time: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newActivity.end_time}
                    onChange={(e) => setNewActivity({...newActivity, end_time: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Agra, India"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 mb-2">Cost ($)</label>
                  <input
                    type="number"
                    value={newActivity.cost}
                    onChange={(e) => setNewActivity({...newActivity, cost: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="10"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Type</label>
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="activity">Activity</option>
                    <option value="flight">Flight</option>
                    <option value="hotel">Hotel</option>
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add Activity
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddActivity(null)}
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

export default CityItinerary;