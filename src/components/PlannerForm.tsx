import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Users,
  X,
  Plus,
  Minus,
  Loader2,
  Camera,
  Clock,
} from "lucide-react";
import poisData from "../data/pois.json";
import { anthropicService } from "../services/anthropic";
import LoadingScreen from "./LoadingScreen";

interface Attraction {
  id: number;
  name: string;
  type: string;
  image: string;
  duration: string;
  waitTime: string;
  nature?: string | null;
  yearOpened?: number | null;
  visitorsPerYear?: number | null;
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

type GroupCountKeys = "adults" | "children" | "infants" | "seniors";

// Transform POI data to match our Attraction interface
const transformPOIData = (): Attraction[] => {
  return poisData.map((item) => ({
    id: item.poi.id,
    name: item.poi.name,
    type: item.poi.type,
    image:
      item.poi.cardImageUrl ||
      "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400",
    duration: item.poi.recommendedDuration || "N/A",
    waitTime: item.poi.expectedWaitTime?.standard?.PEAK_SEASON || "N/A",
    nature: item.poi.nature,
    yearOpened: item.poi.yearOpened,
    visitorsPerYear: item.poi.visitorsPerYear,
  }));
};

function PlannerForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for bypass timeout parameter
  const bypassTimeout = searchParams.get("bypassTimeout") === "true";

  const [formData, setFormData] = useState<FormData>({
    attractions: [],
    startDate: "",
    endDate: "",
    adults: 2,
    children: 0,
    infants: 0,
    seniors: 0,
  });

  // Transform and memoize POI data
  const attractions = useMemo(() => transformPOIData(), []);

  // Flexible search implementation
  const filteredAttractions = useMemo(() => {
    if (!searchTerm.trim()) return attractions;

    const searchLower = searchTerm.toLowerCase();

    return attractions.filter((attraction) => {
      // Search by name
      if (attraction.name.toLowerCase().includes(searchLower)) return true;

      // Search by type
      if (attraction.type.toLowerCase().includes(searchLower)) return true;

      // Search by nature (indoor/outdoor)
      if (attraction.nature?.toLowerCase().includes(searchLower)) return true;

      // Search by year opened
      if (attraction.yearOpened?.toString().includes(searchTerm)) return true;

      // Fuzzy matching for partial words
      const nameWords = attraction.name.toLowerCase().split(" ");
      const typeWords = attraction.type.toLowerCase().split(" ");
      const searchWords = searchLower.split(" ");

      return searchWords.some(
        (searchWord) =>
          nameWords.some((nameWord) => nameWord.includes(searchWord)) ||
          typeWords.some((typeWord) => typeWord.includes(searchWord))
      );
    });
  }, [attractions, searchTerm]);

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
    return (
      formData.adults + formData.children + formData.infants + formData.seniors
    );
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (formData.attractions.length === 0) {
          newErrors.attractions = "Please select at least one attraction";
        }
        break;
      case 2:
        if (!formData.startDate) {
          newErrors.startDate = "Please select a start date";
        }
        if (!formData.endDate) {
          newErrors.endDate = "Please select an end date";
        }
        if (formData.startDate && formData.endDate) {
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          if (end <= start) {
            newErrors.endDate = "End date must be after start date";
          }
        }
        break;
      case 3:
        if (formData.adults < 1) {
          newErrors.adults = "At least one adult is required";
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

      try {
        // Generate AI-powered itinerary using Anthropic
        const attractionNames = formData.attractions.map((a) => a.name);
        const duration = calculateTripDuration();
        const totalTravelers = getTotalTravelers();

        const aiItineraryResponse = await anthropicService.generateItinerary(
          attractionNames,
          duration,
          {
            adults: formData.adults,
            children: formData.children,
            infants: formData.infants,
            seniors: formData.seniors,
          },
          formData.startDate,
          formData.endDate,
          bypassTimeout
        );

        console.log(aiItineraryResponse);

        // Handle the structured response
        let aiItinerary = null;
        if (aiItineraryResponse.success && aiItineraryResponse.itinerary) {
          aiItinerary = aiItineraryResponse.itinerary;
        } else {
          console.warn(
            "Failed to extract itinerary:",
            aiItineraryResponse.error
          );
          // Still proceed but with null itinerary
        }

        // Store both form data and AI-generated itinerary
        const dataToStore = {
          ...formData,
          aiItinerary,
          duration,
          totalTravelers,
          rawResponse: aiItineraryResponse.rawResponse, // Store raw response for debugging
          success: aiItineraryResponse.success,
        };

        localStorage.setItem("itineraryData", JSON.stringify(dataToStore));

        // Navigate to itinerary page
        navigate("/itinerary");
      } catch (error) {
        console.error("Failed to generate itinerary:", error);
        // Fallback: proceed without AI itinerary
        localStorage.setItem("itineraryData", JSON.stringify(formData));
        navigate("/itinerary");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addAttraction = (attraction: Attraction) => {
    if (!formData.attractions.find((a) => a.id === attraction.id)) {
      setFormData({
        ...formData,
        attractions: [...formData.attractions, attraction],
      });
      setErrors({ ...errors, attractions: "" });
    }
  };

  const removeAttraction = (attractionId: number) => {
    setFormData({
      ...formData,
      attractions: formData.attractions.filter((a) => a.id !== attractionId),
    });
  };

  const updateGroupCount = (type: keyof FormData, delta: number) => {
    const newValue = Math.max(
      0,
      Math.min(20, (formData[type] as number) + delta)
    );
    setFormData({
      ...formData,
      [type]: newValue,
    });
    if (type === "adults" && newValue >= 1) {
      setErrors({ ...errors, adults: "" });
    }
  };

  return (
    <>
      {/* Show loading screen when isLoading is true */}
      {isLoading && <LoadingScreen />}

      {/* Main form content */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Plan Your Paris Adventure
              </h1>
              <p className="text-gray-600 text-sm">
                Create a personalized itinerary for the City of Light
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                        step <= currentStep
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      <span className="font-semibold text-xs">{step}</span>
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-8 h-0.5 transition-colors duration-300 ${
                          step < currentStep ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4">
                {/* Step 1: Select Attractions */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        What would you like to see?
                      </h2>
                      <p className="text-xs text-gray-600">
                        Search and select the attractions you want to visit in
                        Paris
                      </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search attractions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Selected Attractions */}
                    {formData.attractions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Selected Attractions ({formData.attractions.length})
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {formData.attractions.map((attraction) => (
                            <div
                              key={attraction.id}
                              className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg"
                            >
                              <img
                                src={attraction.image}
                                alt={attraction.name}
                                className="w-6 h-6 rounded object-cover mr-2"
                              />
                              <span className="text-sm font-medium">
                                {attraction.name}
                              </span>
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
                        const isSelected = formData.attractions.find(
                          (a) => a.id === attraction.id
                        );
                        return (
                          <button
                            key={attraction.id}
                            onClick={() => addAttraction(attraction)}
                            disabled={!!isSelected}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? "border-blue-300 bg-blue-50 cursor-not-allowed opacity-75"
                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer hover:shadow-md"
                            }`}
                          >
                            <div className="flex space-x-4">
                              {/* Square Image */}
                              <div className="flex-shrink-0">
                                <img
                                  src={attraction.image}
                                  alt={attraction.name}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                {/* Top Section - Title */}
                                <div className="mb-2">
                                  <h4 className="font-semibold text-gray-900 text-lg leading-tight truncate">
                                    {attraction.name}
                                  </h4>
                                </div>

                                {/* Bottom Section - Duration and Wait Time */}
                                <div className="flex flex-col space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1 text-blue-500" />
                                    <span className="font-medium mr-1">
                                      Duration:
                                    </span>
                                    <span>{attraction.duration}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1 text-orange-500" />
                                    <span className="font-medium mr-1">
                                      Wait:
                                    </span>
                                    <span>{attraction.waitTime}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {errors.attractions && (
                      <p className="text-red-600 text-sm">
                        {errors.attractions}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 2: Choose Dates */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        When are you traveling?
                      </h2>
                      <p className="text-gray-600">
                        Select your travel dates to plan your itinerary
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.startDate && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.startDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                          min={
                            formData.startDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.endDate && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.endDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {formData.startDate &&
                      formData.endDate &&
                      calculateTripDuration() > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-blue-800 font-medium">
                              Trip Duration: {calculateTripDuration()}{" "}
                              {calculateTripDuration() === 1 ? "day" : "days"}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Show selected attractions summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        Your selected attractions:
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formData.attractions.map((attraction) => (
                          <div
                            key={attraction.id}
                            className="flex items-center bg-white p-2 rounded-lg border"
                          >
                            <img
                              src={attraction.image}
                              alt={attraction.name}
                              className="w-8 h-8 rounded object-cover mr-2"
                            />
                            <span className="text-sm text-gray-700 truncate">
                              {attraction.name}
                            </span>
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Who's traveling?
                      </h2>
                      <p className="text-gray-600">
                        Tell us about your group to personalize your itinerary
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          key: "adults",
                          label: "Adults",
                          sublabel: "18-64 years",
                          required: true,
                        },
                        {
                          key: "children",
                          label: "Children",
                          sublabel: "4-17 years",
                          required: false,
                        },
                        {
                          key: "infants",
                          label: "Infants",
                          sublabel: "0-3 years",
                          required: false,
                        },
                        {
                          key: "seniors",
                          label: "Seniors",
                          sublabel: "65+ years",
                          required: false,
                        },
                      ].map(({ key, label, sublabel, required }) => (
                        <div key={key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {label}{" "}
                            {required && (
                              <span className="text-red-500">*</span>
                            )}
                            <span className="block text-xs text-gray-500 font-normal">
                              {sublabel}
                            </span>
                          </label>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateGroupCount(key as keyof FormData, -1)
                              }
                              disabled={formData[key as GroupCountKeys] === 0}
                              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                              {formData[key as GroupCountKeys]}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateGroupCount(key as keyof FormData, 1)
                              }
                              disabled={formData[key as GroupCountKeys] >= 20}
                              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          {key === "adults" && errors.adults && (
                            <p className="text-red-600 text-sm">
                              {errors.adults}
                            </p>
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
                      <h3 className="font-medium text-gray-900">
                        Trip Summary:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            Destinations:{" "}
                            <span className="font-medium text-gray-900">
                              {formData.attractions.length} attractions
                            </span>
                          </p>
                          <p className="text-gray-600">
                            Duration:{" "}
                            <span className="font-medium text-gray-900">
                              {calculateTripDuration()} days
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Dates:{" "}
                            <span className="font-medium text-gray-900">
                              {formData.startDate && formData.endDate
                                ? `${new Date(
                                    formData.startDate
                                  ).toLocaleDateString()} - ${new Date(
                                    formData.endDate
                                  ).toLocaleDateString()}`
                                : "Not selected"}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            Group:{" "}
                            <span className="font-medium text-gray-900">
                              {getTotalTravelers()} travelers
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl z-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto py-4 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex items-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200"
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Generating Magic...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Generate Itinerary
                    <Camera className="w-5 h-5 ml-3" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PlannerForm;
