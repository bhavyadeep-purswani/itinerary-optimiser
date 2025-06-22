import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  Star,
  Download,
  ChevronRight,
  MapPin,
} from "lucide-react";

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

interface Experience {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  price: string;
  timeSlot: string;
  category: "Morning" | "Afternoon" | "Evening";
}

interface DayPlan {
  day: number;
  date: string;
  dayName: string;
  experiences: Experience[];
}

function ItineraryPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedData = localStorage.getItem("itineraryData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setFormData(data);
      generateDayPlans(data);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const generateDayPlans = (data: FormData) => {
    const tripDuration = calculateTripDuration(data.startDate, data.endDate);
    const plans: DayPlan[] = [];

    for (let day = 1; day <= tripDuration; day++) {
      const currentDate = new Date(data.startDate);
      currentDate.setDate(currentDate.getDate() + (day - 1));

      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dateStr = currentDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });

      // Generate experiences for each day
      const dayExperiences = generateExperiencesForDay(day, data.attractions);

      plans.push({
        day,
        date: dateStr,
        dayName,
        experiences: dayExperiences,
      });
    }

    setDayPlans(plans);
  };

  const generateExperiencesForDay = (
    day: number,
    attractions: Attraction[]
  ): Experience[] => {
    const experiences: Experience[] = [];
    const attractionsPerDay = Math.ceil(
      attractions.length / dayPlans.length || 1
    );
    const startIndex = (day - 1) * attractionsPerDay;
    const dayAttractions = attractions.slice(
      startIndex,
      startIndex + attractionsPerDay
    );

    // Morning experience
    if (dayAttractions[0]) {
      experiences.push({
        id: `morning-${day}`,
        name: `${dayAttractions[0].name} Reserved Access Tickets`,
        description: `Skip the early morning crowds in ${dayAttractions[0].name.toLowerCase()} and stay indoors and avoid the heat.`,
        image: dayAttractions[0].image,
        duration: dayAttractions[0].duration,
        price: "$56.45",
        timeSlot: "9:30am",
        category: "Morning",
      });
    }

    // Evening experiences
    if (dayAttractions[1]) {
      experiences.push({
        id: `evening-1-${day}`,
        name: `${dayAttractions[1].name}: Guided tour of second floor`,
        description: `Click amazing guided one hour pictures of the city with a glass of champagne.`,
        image: dayAttractions[1].image,
        duration: "2 hours",
        price: "$23.32",
        timeSlot: "4:00pm",
        category: "Evening",
      });
    }

    // Add Seine cruise for variety
    experiences.push({
      id: `evening-2-${day}`,
      name: "1-Hour Paris Illuminated Evening Sightseeing Cruise",
      description:
        "Watch the Eiffel tower glow and take a cruise on a nice windy evening.",
      image:
        "https://images.pexels.com/photos/1530259/pexels-photo-1530259.jpeg?auto=compress&cs=tinysrgb&w=400",
      duration: "1 hour",
      price: "$26.89",
      timeSlot: "6:30pm",
      category: "Evening",
    });

    return experiences;
  };

  const calculateTripDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTotalTravelers = (data: FormData) => {
    return data.adults + data.children + data.infants + data.seniors;
  };

  const handleSendItinerary = () => {
    if (email) {
      // Simulate sending email
      alert(`Itinerary sent to ${email}!`);
      setEmail("");
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  const currentDayPlan = dayPlans.find((plan) => plan.day === selectedDay);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-b from-gray-900/50 to-gray-900/70">
        <img
          src="https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800"
          alt="Paris skyline"
          className="absolute inset-0 w-full h-full object-cover -z-10"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative h-full flex flex-col justify-center items-center text-white px-4">
          <button
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-3xl font-bold mb-2">PARIS</h1>
          <p className="text-lg opacity-90">A trip designed just for you</p>

          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span>Detailed 3 day Paris itinerary with must do experiences</span>
            <div className="flex space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <MapPin className="w-3 h-3" />
              </div>
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Trip Overview */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            See what's planned for you
          </h2>

          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                {new Date(formData.startDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                -{" "}
                {new Date(formData.endDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>{getTotalTravelers(formData)} guests</span>
            </div>
          </div>

          {/* Day Selector */}
          <div className="flex space-x-1 mb-6 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {dayPlans.map((plan) => (
              <button
                key={plan.day}
                onClick={() => setSelectedDay(plan.day)}
                className={`flex-shrink-0 py-3 px-4 text-center border-b-2 transition-colors min-w-[80px] ${
                  selectedDay === plan.day
                    ? "border-blue-600 text-blue-600 font-medium"
                    : "border-gray-200 text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">DAY {plan.day}</div>
                <div className="text-sm">{plan.date}</div>
                <div className="text-xs">{plan.dayName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Day Content */}
        {currentDayPlan && (
          <div className="space-y-6">
            {/* Morning Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-yellow-600 text-xs">☀️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Morning</h3>
                    <p className="text-sm text-gray-500">
                      9:30am - 2:00pm • 1 experiences
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {currentDayPlan.experiences
                .filter((exp) => exp.category === "Morning")
                .map((experience, index) => (
                  <div key={experience.id} className="mb-4">
                    <div className="flex space-x-3">
                      <img
                        src={experience.image}
                        alt={experience.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                          {experience.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                          {experience.description}
                        </p>
                        <button className="text-xs text-blue-600 font-medium">
                          More details →
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        <span className="font-medium">
                          Recommended time slot
                        </span>
                        <div className="text-gray-900 font-medium">
                          {experience.timeSlot}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {experience.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Evening Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-orange-600 text-xs">🌅</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Evening</h3>
                    <p className="text-sm text-gray-500">
                      4:00pm - 7:30pm • 2 experiences
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {currentDayPlan.experiences
                .filter((exp) => exp.category === "Evening")
                .map((experience, index) => (
                  <div key={experience.id} className="mb-6">
                    <div className="text-xs text-gray-500 mb-2">
                      Experience {index + 1}/2
                    </div>

                    <div className="flex space-x-3">
                      <img
                        src={experience.image}
                        alt={experience.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                          {experience.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                          {experience.description}
                        </p>
                        <button className="text-xs text-blue-600 font-medium">
                          More details →
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        <span className="font-medium">
                          Recommended time slot
                        </span>
                        <div className="text-gray-900 font-medium">
                          {experience.timeSlot} | {experience.duration}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {experience.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Download Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <Download className="w-5 h-5 text-gray-700 mr-2" />
            <h3 className="font-semibold text-gray-900">
              Download this itinerary
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Save this itinerary for later by entering your email address. We'll
            send it directly to your inbox!
          </p>

          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Enter your email here"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendItinerary}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Send
            </button>
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Enjoy flat 10% on add-ons
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="relative mb-2">
                <img
                  src="https://images.pexels.com/photos/1851415/pexels-photo-1851415.jpeg?auto=compress&cs=tinysrgb&w=200"
                  alt="eSIM"
                  className="w-full h-20 object-cover rounded"
                />
                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs">+</span>
                </div>
                <div className="absolute top-1 right-1 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                  eSIM
                </div>
              </div>
              <div className="flex items-center text-yellow-500 text-xs mb-1">
                <Star className="w-3 h-3 fill-current mr-1" />
                <span>4.3 (2.6k)</span>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">
                Global eSIM with Unlimited 5G/4G Data: Access to 120 Countries
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 line-through">
                  from €30.28
                </span>
                <span className="text-sm font-bold text-gray-900">€27</span>
              </div>
              <div className="mt-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded inline-block">
                10% off
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <div className="relative mb-2">
                <img
                  src="https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=200"
                  alt="Airport Transfer"
                  className="w-full h-20 object-cover rounded"
                />
                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs">+</span>
                </div>
              </div>
              <div className="flex items-center text-yellow-500 text-xs mb-1">
                <Star className="w-3 h-3 fill-current mr-1" />
                <span>4.1 (6.9k)</span>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">
                Private Transfers from/to Paris-Orly Airport
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 line-through">
                  from €30.00
                </span>
                <span className="text-sm font-bold text-gray-900">€27</span>
              </div>
              <div className="mt-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded inline-block">
                10% off
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center pb-8">
          <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">
            Vetted by Headout
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Headout provides handpicked, verified experiences tailored for
            modern adventurers.
          </p>
          <button className="text-xs text-blue-600 mt-2">Learn more</button>
        </div>
      </div>
    </div>
  );
}

export default ItineraryPage;
