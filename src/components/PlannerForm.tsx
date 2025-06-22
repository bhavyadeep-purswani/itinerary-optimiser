import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, MapPin, Calendar, Users, X, Plus, Minus, Loader2, Camera, Clock, Star } from 'lucide-react';

interface Attraction {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  image: string;
  duration: string;
  waitTime: string;
}

interface FormData {
  attractions: Attraction[];
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  infants: number;
  seniors: number;
}

const PARIS_ATTRACTIONS: Attraction[] = [
  { 
    id: '1', 
    name: 'Eiffel Tower', 
    category: 'Monument', 
    description: 'Iconic iron lattice tower and symbol of Paris', 
    rating: 4.6,
    image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '2-3 hours',
    waitTime: '30-60 min'
  },
  { 
    id: '2', 
    name: 'Louvre Museum', 
    category: 'Museum', 
    description: 'World\'s largest art museum and historic palace', 
    rating: 4.5,
    image: 'https://images.pexels.com/photos/2675266/pexels-photo-2675266.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '3-4 hours',
    waitTime: '45-90 min'
  },
  { 
    id: '3', 
    name: 'Notre-Dame Cathedral', 
    category: 'Historic Site', 
    description: 'Medieval Catholic cathedral and Gothic architecture masterpiece', 
    rating: 4.4,
    image: 'https://images.pexels.com/photos/1850619/pexels-photo-1850619.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '1-2 hours',
    waitTime: '15-30 min'
  },
  { 
    id: '4', 
    name: 'Arc de Triomphe', 
    category: 'Monument', 
    description: 'Monumental arch honoring French military victories', 
    rating: 4.5,
    image: 'https://images.pexels.com/photos/1530259/pexels-photo-1530259.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '1-2 hours',
    waitTime: '20-40 min'
  },
  { 
    id: '5', 
    name: 'Champs-Élysées', 
    category: 'Street', 
    description: 'Famous avenue lined with shops, cafés, and theaters', 
    rating: 4.3,
    image: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg?auto=compress&cs=tinysrgb&w=400',
    duration: '2-3 hours',
    waitTime: 'No wait'
  },
  { 
    id: '6', 
    name: 'Sacré-Cœur Basilica', 
    category: 'Religious Site', 
    description: 'Roman Catholic church atop Montmartre hill', 
    rating: 4.4,
    image: 'https://images.pexels.com/photos/1461974/pexels-photo-1461974.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '1-2 hours',
    waitTime: '10-25 min'
  },
  { 
    id: '7', 
    name: 'Musée d\'Orsay', 
    category: 'Museum', 
    description: 'Museum featuring world\'s finest collection of Impressionist art', 
    rating: 4.5,
    image: 'https://images.pexels.com/photos/2675264/pexels-photo-2675264.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '2-3 hours',
    waitTime: '20-45 min'
  },
  { 
    id: '8', 
    name: 'Latin Quarter', 
    category: 'Neighborhood', 
    description: 'Historic area known for its student life and bohemian atmosphere', 
    rating: 4.3,
    image: 'https://images.pexels.com/photos/161901/paris-sunset-france-monument-161901.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '2-4 hours',
    waitTime: 'No wait'
  },
  { 
    id: '9', 
    name: 'Montmartre', 
    category: 'Neighborhood', 
    description: 'Historic hilltop district famous for artists and nightlife', 
    rating: 4.4,
    image: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg?auto=compress&cs=tinysrgb&w=400',
    duration: '3-4 hours',
    waitTime: 'No wait'
  },
  { 
    id: '10', 
    name: 'Seine River Cruise', 
    category: 'Experience', 
    description: 'Scenic boat tour along the Seine River', 
    rating: 4.2,
    image: 'https://images.pexels.com/photos/1530259/pexels-photo-1530259.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '1 hour',
    waitTime: '5-15 min'
  },
  { 
    id: '11', 
    name: 'Palace of Versailles', 
    category: 'Palace', 
    description: 'Opulent royal château and gardens', 
    rating: 4.4,
    image: 'https://images.pexels.com/photos/2675266/pexels-photo-2675266.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '4-6 hours',
    waitTime: '60-120 min'
  },
  { 
    id: '12', 
    name: 'Sainte-Chapelle', 
    category: 'Religious Site', 
    description: 'Gothic chapel renowned for its stunning stained glass', 
    rating: 4.5,
    image: 'https://images.pexels.com/photos/1850619/pexels-photo-1850619.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '45 min - 1 hour',
    waitTime: '15-30 min'
  }
];

function PlannerForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    attractions: [],
    startDate: '',
    endDate: '',
    adults: 2,
    children: 0,
    infants: 0,
    seniors: 0
  });

  const filteredAttractions = PARIS_ATTRACTIONS.filter(attraction =>
    attraction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attraction.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTripDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const getTotalTravelers = () => {
    return formData.adults + formData.children + formData.infants + formData.seniors;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (formData.attractions.length === 0) {
          newErrors.attractions = 'Please select at least one attraction';
        }
        break;
      case 2:
        if (!formData.startDate) {
          newErrors.startDate = 'Please select a start date';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'Please select an end date';
        }
        if (formData.startDate && formData.endDate) {
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          if (end <= start) {
            newErrors.endDate = 'End date must be after start date';
          }
        }
        break;
      case 3:
        if (formData.adults < 1) {
          newErrors.adults = 'At least one adult is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (validateStep(3)) {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      
      // Store form data in localStorage to pass to itinerary page
      localStorage.setItem('itineraryData', JSON.stringify(formData));
      
      // Navigate to itinerary page
      navigate('/itinerary');
    }
  };

  const addAttraction = (attraction: Attraction) => {
    if (!formData.attractions.find(a => a.id === attraction.id)) {
      setFormData({
        ...formData,
        attractions: [...formData.attractions, attraction]
      });
      setErrors({ ...errors, attractions: '' });
    }
  };

  const removeAttraction = (attractionId: string) => {
    setFormData({
      ...formData,
      attractions: formData.attractions.filter(a => a.id !== attractionId)
    });
  };

  const updateGroupCount = (type: keyof FormData, delta: number) => {
    const newValue = Math.max(0, Math.min(20, (formData[type] as number) + delta));
    setFormData({
      ...formData,
      [type]: newValue
    });
    if (type === 'adults' && newValue >= 1) {
      setErrors({ ...errors, adults: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Plan Your Paris Adventure</h1>
            <p className="text-gray-600">Create a personalized itinerary for the City of Light</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    step <= currentStep 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <span className="font-semibold">{step}</span>
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-0.5 transition-colors duration-300 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <span className="text-sm text-gray-600">
                Step {currentStep} of 3: {
                  currentStep === 1 ? 'Select Attractions' :
                  currentStep === 2 ? 'Choose Dates' : 'Group Details'
                }
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              {/* Step 1: Select Attractions */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">What would you like to see?</h2>
                    <p className="text-gray-600">Search and select the attractions you want to visit in Paris</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search attractions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Selected Attractions */}
                  {formData.attractions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Attractions ({formData.attractions.length})</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.attractions.map((attraction) => (
                          <div key={attraction.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                            <img 
                              src={attraction.image} 
                              alt={attraction.name}
                              className="w-6 h-6 rounded object-cover mr-2"
                            />
                            <span className="text-sm font-medium">{attraction.name}</span>
                            <button
                              onClick={() => removeAttraction(attraction.id)}
                              className="ml-2 hover:bg-blue-200 rounded-full p-1 transition-colors duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attractions List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {filteredAttractions.map((attraction) => {
                      const isSelected = formData.attractions.find(a => a.id === attraction.id);
                      return (
                        <button
                          key={attraction.id}
                          onClick={() => addAttraction(attraction)}
                          disabled={!!isSelected}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-300 bg-blue-50 cursor-not-allowed opacity-75'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            {/* Square Image */}
                            <div className="flex-shrink-0">
                              <img 
                                src={attraction.image} 
                                alt={attraction.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Title and Rating Row */}
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 text-lg leading-tight">{attraction.name}</h4>
                                <div className="flex items-center text-yellow-500 ml-3 flex-shrink-0">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span className="text-sm ml-1 font-medium">{attraction.rating}</span>
                                </div>
                              </div>
                              
                              {/* Category */}
                              <p className="text-sm text-blue-600 font-medium mb-2">{attraction.category}</p>
                              
                              {/* Duration and Wait Time */}
                              <div className="flex items-center space-x-6 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1 text-blue-500" />
                                  <span className="font-medium">Duration:</span>
                                  <span className="ml-1">{attraction.duration}</span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-1 text-orange-500" />
                                  <span className="font-medium">Wait:</span>
                                  <span className="ml-1">{attraction.waitTime}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {errors.attractions && (
                    <p className="text-red-600 text-sm">{errors.attractions}</p>
                  )}
                </div>
              )}

              {/* Step 2: Choose Dates */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">When are you traveling?</h2>
                    <p className="text-gray-600">Select your travel dates to plan your itinerary</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.startDate && (
                        <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.endDate && (
                        <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && calculateTripDuration() > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-blue-800 font-medium">
                          Trip Duration: {calculateTripDuration()} {calculateTripDuration() === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Show selected attractions summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Your selected attractions:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.attractions.map((attraction) => (
                        <div key={attraction.id} className="flex items-center bg-white p-2 rounded-lg border">
                          <img 
                            src={attraction.image} 
                            alt={attraction.name}
                            className="w-8 h-8 rounded object-cover mr-2"
                          />
                          <span className="text-sm text-gray-700 truncate">{attraction.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Group Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Who's traveling?</h2>
                    <p className="text-gray-600">Tell us about your group to personalize your itinerary</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'adults', label: 'Adults', sublabel: '18-64 years', required: true },
                      { key: 'children', label: 'Children', sublabel: '4-17 years', required: false },
                      { key: 'infants', label: 'Infants', sublabel: '0-3 years', required: false },
                      { key: 'seniors', label: 'Seniors', sublabel: '65+ years', required: false }
                    ].map(({ key, label, sublabel, required }) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {label} {required && <span className="text-red-500">*</span>}
                          <span className="block text-xs text-gray-500 font-normal">{sublabel}</span>
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => updateGroupCount(key as keyof FormData, -1)}
                            disabled={formData[key as keyof FormData] === 0}
                            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                            {formData[key as keyof FormData]}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateGroupCount(key as keyof FormData, 1)}
                            disabled={formData[key as keyof FormData] >= 20}
                            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {key === 'adults' && errors.adults && (
                          <p className="text-red-600 text-sm">{errors.adults}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">
                        Total Travelers: {getTotalTravelers()}
                      </span>
                    </div>
                  </div>

                  {/* Trip Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-gray-900">Trip Summary:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Destinations: <span className="font-medium text-gray-900">{formData.attractions.length} attractions</span></p>
                        <p className="text-gray-600">Duration: <span className="font-medium text-gray-900">{calculateTripDuration()} days</span></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dates: <span className="font-medium text-gray-900">
                          {formData.startDate && formData.endDate 
                            ? `${new Date(formData.startDate).toLocaleDateString()} - ${new Date(formData.endDate).toLocaleDateString()}`
                            : 'Not selected'
                          }
                        </span></p>
                        <p className="text-gray-600">Group: <span className="font-medium text-gray-900">{getTotalTravelers()} travelers</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-gray-50 px-8 py-4 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Generate Itinerary
                    <Camera className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlannerForm;