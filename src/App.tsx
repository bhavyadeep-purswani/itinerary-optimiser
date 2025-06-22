import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlannerForm from './components/PlannerForm';
import ItineraryPage from './components/ItineraryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlannerForm />} />
      <Route path="/itinerary" element={<ItineraryPage />} />
    </Routes>
  );
}

export default App;