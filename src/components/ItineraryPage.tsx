import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  Star,
  Download,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchExperiencesByIds } from "../store/thunks";
import { Availability } from "../store/slices/experiencesSlice";

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

interface ItineraryExperience {
  timeSlot: string;
  experienceId: number;
  vendorId: string;
  tourId: number;
  variantId: number;
  tourGroupName: string;
  variantName: string;
  duration: string;
  location: string;
  price: string;
  notes: string;
}

interface DayItinerary {
  morning?: ItineraryExperience;
  afternoon?: ItineraryExperience;
  evening?: ItineraryExperience;
}

interface ItineraryData {
  itinerary: {
    [key: string]: DayItinerary | any; // Allow string indexing for dynamic day keys
    day1?: DayItinerary;
    day2?: DayItinerary;
    day3?: DayItinerary;
    totalCost: {
      day1: string;
      day2: string;
      total: string;
      perPerson: string;
    };
    optimizationNotes: {
      crowdAvoidance: string;
      logistics: string;
      valueOptimization: string;
      experienceVariety: string;
    };
  };
}

interface DayPlan {
  day: number;
  date: string;
  dayName: string;
  experiences: {
    morning?: ItineraryExperience;
    afternoon?: ItineraryExperience;
    evening?: ItineraryExperience;
  };
}

function ItineraryPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const {
    experiences,
    loading: experiencesLoading,
    error,
  } = useAppSelector((state) => state.experiences);

  // Local state
  const [formData, setFormData] = useState<FormData | null>(null);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(
    null
  );
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Load all data from the single itineraryData localStorage key
    const storedData = localStorage.getItem("itineraryData");

    if (storedData) {
      const parsedData = JSON.parse(storedData);

      // Extract form data (attractions, dates, travelers, etc.)
      const formDataPart: FormData = {
        attractions: parsedData.attractions || [],
        startDate: parsedData.startDate || "",
        endDate: parsedData.endDate || "",
        adults: parsedData.adults || 0,
        children: parsedData.children || 0,
        infants: parsedData.infants || 0,
        seniors: parsedData.seniors || 0,
      };
      setFormData(formDataPart);

      // Extract AI-generated itinerary data
      if (parsedData.aiItinerary && parsedData.aiItinerary.itinerary) {
        // Wrap the itinerary data to match the expected ItineraryData interface
        setItineraryData({ itinerary: parsedData.aiItinerary.itinerary });

        // Extract all experience IDs from the itinerary
        const experienceIds: string[] = [];
        const itineraryObj = parsedData.aiItinerary.itinerary;

        if (itineraryObj) {
          Object.keys(itineraryObj).forEach((dayKey) => {
            if (dayKey.startsWith("day")) {
              const day = itineraryObj[dayKey];
              ["morning", "afternoon", "evening"].forEach((timeSlot) => {
                if (day[timeSlot]?.experienceId) {
                  experienceIds.push(day[timeSlot].experienceId.toString());
                }
              });
            }
          });

          // Fetch experience details with date parameters
          if (experienceIds.length > 0) {
            if (formDataPart.startDate && formDataPart.endDate) {
              dispatch(
                fetchExperiencesByIds(
                  experienceIds,
                  formDataPart.startDate,
                  formDataPart.endDate
                )
              );
            } else {
              // Fallback to default behavior if dates are not available
              dispatch(fetchExperiencesByIds(experienceIds));
            }
          }
        }
      } else {
        console.warn("No valid AI itinerary found in stored data");
        // Could show a fallback message or redirect
      }
    } else {
      console.warn("No itinerary data found in localStorage");
      navigate("/");
    }
  }, [navigate, dispatch]);

  useEffect(() => {
    if (formData && itineraryData) {
      generateDayPlans(formData, itineraryData);
    }
  }, [formData, itineraryData]);

  // Helper function to check if an experience is valid (not empty)
  const isValidExperience = (
    experience: ItineraryExperience | undefined
  ): boolean => {
    if (!experience) return false;

    // Check if experience has valid data (not empty/zero values)
    return experience.experienceId > 0;
  };

  const generateDayPlans = (data: FormData, itinerary: ItineraryData) => {
    const plans: DayPlan[] = [];
    const itineraryObj = itinerary.itinerary;

    // Calculate total trip duration
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Create plans for all days in the trip duration
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const dayNumber = dayIndex + 1;
      const dayKey = `day${dayNumber}`;

      const currentDate = new Date(data.startDate);
      currentDate.setDate(currentDate.getDate() + dayIndex);

      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dateStr = currentDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });

      // Check if this day has itinerary data
      const dayExperiences =
        itineraryObj[dayKey] &&
        typeof itineraryObj[dayKey] === "object" &&
        !Array.isArray(itineraryObj[dayKey])
          ? (itineraryObj[dayKey] as DayItinerary)
          : { morning: undefined, afternoon: undefined, evening: undefined };

      plans.push({
        day: dayNumber,
        date: dateStr,
        dayName,
        experiences: dayExperiences,
      });
    }

    setDayPlans(plans);
  };

  const getExperienceDetails = (experienceId: number) => {
    return experiences.find((exp) => exp.id === experienceId.toString());
  };

  // Helper function to extract start time from timeSlot
  const extractStartTime = (timeSlot: string): string => {
    // Handle various time formats:
    // "09:00 - 11:00", "9:00AM - 11:00AM", "09:00-11:00", "Morning (09:00-11:00)", etc.

    // Remove any parentheses and extra text, focus on the time part
    let cleanTimeSlot = timeSlot.replace(/[()]/g, "").trim();

    // Split by common separators to get start time
    const separators = [" - ", "-", " to ", " till ", "–", "—"];
    let startTime = cleanTimeSlot;

    for (const separator of separators) {
      if (cleanTimeSlot.includes(separator)) {
        startTime = cleanTimeSlot.split(separator)[0].trim();
        break;
      }
    }

    // Remove any non-time text (like "Morning", "Afternoon", etc.)
    const timeMatch = startTime.match(/\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?/);
    if (timeMatch) {
      startTime = timeMatch[0];
    }

    // Normalize time format to HH:MM
    if (startTime.includes(":")) {
      let [hours, minutes] = startTime.split(":");
      hours = hours.padStart(2, "0");
      minutes = (minutes || "00").replace(/[^\d]/g, "").padStart(2, "0");

      // Handle AM/PM
      if (startTime.toUpperCase().includes("PM") && parseInt(hours) !== 12) {
        hours = (parseInt(hours) + 12).toString();
      } else if (
        startTime.toUpperCase().includes("AM") &&
        parseInt(hours) === 12
      ) {
        hours = "00";
      }

      return `${hours}:${minutes}`;
    } else {
      // Handle cases like "9AM", "10PM"
      const match = startTime.match(/(\d{1,2})\s*(AM|PM|am|pm)?/);
      if (match) {
        let hours = parseInt(match[1]);
        const period = match[2]?.toUpperCase();

        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }

        return `${hours.toString().padStart(2, "0")}:00`;
      }
    }

    return startTime;
  };

  // Helper function to calculate experience date based on start date and day number
  const calculateExperienceDate = (
    startDate: string,
    dayNumber: number
  ): string => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (dayNumber - 1)); // dayNumber is 1-based
    return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
  };

  // Helper function to match time strings with various formats
  const timeMatches = (time1: string, time2: string): boolean => {
    const normalize = (time: string): string => {
      // Extract time from various formats and normalize to HH:MM
      const timeMatch = time.match(/\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?/);
      if (!timeMatch) return time;

      let timeStr = timeMatch[0];

      if (timeStr.includes(":")) {
        let [hours, minutes] = timeStr.split(":");
        hours = hours.padStart(2, "0");
        minutes = (minutes || "00").replace(/[^\d]/g, "").padStart(2, "0");

        // Handle AM/PM
        if (timeStr.toUpperCase().includes("PM") && parseInt(hours) !== 12) {
          hours = (parseInt(hours) + 12).toString();
        } else if (
          timeStr.toUpperCase().includes("AM") &&
          parseInt(hours) === 12
        ) {
          hours = "00";
        }

        return `${hours}:${minutes}`;
      } else {
        // Handle cases like "9AM", "10PM"
        const match = timeStr.match(/(\d{1,2})\s*(AM|PM|am|pm)?/);
        if (match) {
          let hours = parseInt(match[1]);
          const period = match[2]?.toUpperCase();

          if (period === "PM" && hours !== 12) {
            hours += 12;
          } else if (period === "AM" && hours === 12) {
            hours = 0;
          }

          return `${hours.toString().padStart(2, "0")}:00`;
        }
      }

      return timeStr;
    };

    return normalize(time1) === normalize(time2);
  };

  // Helper function to get price for an experience
  const getExperiencePrice = (
    experience: ItineraryExperience,
    dayNumber: number
  ): string => {
    if (!formData) return "Price unavailable";

    const experienceDetails = getExperienceDetails(experience.experienceId);
    if (!experienceDetails || !experienceDetails.inventory) {
      return "Price unavailable";
    }

    // TODO: Replace this index-based approach with actual variantId matching
    // In future: find variant where variant.id === experience.variantId
    let variant = experienceDetails.variants[experience.variantId];

    // Fallback to first variant if the specified index is out of range or variant not found
    if (!variant && experienceDetails.variants.length > 0) {
      variant = experienceDetails.variants[0];
    }

    if (!variant) return "Price unavailable";

    // Get the tour ID (using the first tour for now, this might need refinement)
    const tourId = variant.tours?.[0]?.id?.toString();
    if (!tourId || !experienceDetails.inventory[tourId]) {
      return "Price unavailable";
    }

    // Calculate the experience date
    const experienceDate = calculateExperienceDate(
      formData.startDate,
      dayNumber
    );
    const dateInventory = experienceDetails.inventory[tourId][experienceDate];

    if (!dateInventory || !Array.isArray(dateInventory)) {
      return "Price unavailable";
    }

    // Extract start time from timeSlot
    const startTime = extractStartTime(experience.timeSlot);

    // Find the availability with matching start time
    let matchingAvailability = dateInventory.find(
      (availability: Availability) =>
        timeMatches(availability.startTime, startTime)
    );

    // If no exact match found, use the first available slot of that day
    if (!matchingAvailability && dateInventory.length > 0) {
      matchingAvailability = dateInventory[0];
    }

    if (!matchingAvailability || !matchingAvailability.priceProfile) {
      return "Price unavailable";
    }

    // Get the price from the first person in the price profile
    const firstPerson = matchingAvailability.priceProfile.persons?.[0];
    if (!firstPerson) {
      return "Price unavailable";
    }

    const currency = experienceDetails.currency || "USD";
    const price = firstPerson.listingPrice || firstPerson.retailPrice || 0;

    return `${getCurrencySymbol(currency)}${price.toFixed(0)}`;
  };

  const getTotalTravelers = (data: FormData) => {
    return data.adults + data.children + data.infants + data.seniors;
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "EUR ";
      case "GBP":
        return "£";
      default:
        return currency;
    }
  };

  // Helper function to calculate total trip cost
  const calculateTripCost = () => {
    if (!formData || !itineraryData) return null;

    let totalCost = 0;
    const totalTravelers = getTotalTravelers(formData);
    let currency = "USD"; // Default fallback

    // Calculate cost for all experiences across all days
    dayPlans.forEach((dayPlan) => {
      const { morning, afternoon, evening } = dayPlan.experiences;

      [morning, afternoon, evening].forEach((experience) => {
        if (isValidExperience(experience) && experience) {
          // Get currency from the first valid experience
          if (currency === "USD") {
            const experienceDetails = getExperienceDetails(
              experience.experienceId
            );
            if (experienceDetails?.currency) {
              currency = experienceDetails.currency;
            }
          }

          const priceStr = getExperiencePrice(experience, dayPlan.day);
          // Extract numeric value from price string (e.g., "€45" -> 45 or "$45" -> 45)
          const priceMatch = priceStr.match(/\d+/);
          if (priceMatch) {
            const pricePerPerson = parseInt(priceMatch[0]);
            totalCost += pricePerPerson * totalTravelers;
          }
        }
      });
    });

    // Apply 10% discount
    const discountAmount = totalCost * 0.1;
    const discountedTotal = totalCost - discountAmount;
    const pricePerPerson =
      totalTravelers > 0 ? discountedTotal / totalTravelers : 0;

    return {
      originalTotal: totalCost,
      discountAmount: discountAmount,
      discountedTotal: discountedTotal,
      pricePerPerson: pricePerPerson,
      currency: currency,
      totalTravelers: totalTravelers,
    };
  };

  const handleSendItinerary = () => {
    if (email) {
      // Simulate sending email
      alert(`Itinerary sent to ${email}!`);
      setEmail("");
    }
  };

  const renderExperienceCard = (
    experience: ItineraryExperience,
    timeSlotName: string,
    dayNumber: number
  ) => {
    const experienceDetails = getExperienceDetails(experience.experienceId);
    const price = getExperiencePrice(experience, dayNumber);

    return (
      <div key={`${timeSlotName}-${experience.experienceId}`} className="mb-6">
        <div className="flex space-x-3">
          <img
            src={experienceDetails?.image || "/api/placeholder/400/250"}
            alt={experienceDetails?.name || experience.variantName}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
              {experienceDetails?.name || experience.variantName}
            </h4>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              {experience.notes}
            </p>
            <button className="text-xs text-blue-600 font-medium">
              More details →
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-gray-600">
            <span className="font-medium">Recommended time slot</span>
            <div className="text-gray-900 font-medium">
              {experience.timeSlot} | {experience.duration}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{price}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderFreeTimeSlot = (timeSlotName: string) => {
    return (
      <div key={`${timeSlotName}-free`} className="mb-6">
        <div className="flex space-x-3">
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-2xl">☕</span>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
              Free Time
            </h4>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              No scheduled activities - perfect time to explore on your own,
              relax, or discover local spots.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-gray-600">
            <span className="font-medium">Status</span>
            <div className="text-gray-500 font-medium">Free</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-500">-</div>
          </div>
        </div>
      </div>
    );
  };

  if (!formData || !itineraryData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (experiencesLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experience details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error loading experiences: {error}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentDayPlan = dayPlans.find((plan) => plan.day === selectedDay);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-b from-gray-900/50 to-gray-900/70">
        <img
          src="https://media.istockphoto.com/id/635758088/photo/sunrise-at-the-eiffel-tower-in-paris-along-the-seine.jpg?s=612x612&w=0&k=20&c=rdy3aU1CDyh66mPyR5AAc1yJ0yEameR_v2vOXp2uuMM="
          alt="Paris skyline"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        <div className="relative h-full flex flex-col justify-center items-center text-white px-4 z-20">
          <button
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-3xl font-bold mb-2">PARIS</h1>
          <p className="text-lg opacity-90">A trip designed just for you</p>
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
                      {isValidExperience(currentDayPlan.experiences.morning)
                        ? `${currentDayPlan.experiences.morning?.timeSlot} • 1 experience`
                        : "Free time"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              {isValidExperience(currentDayPlan.experiences.morning)
                ? renderExperienceCard(
                    currentDayPlan.experiences.morning!,
                    "morning",
                    currentDayPlan.day
                  )
                : renderFreeTimeSlot("morning")}
            </div>

            {/* Afternoon Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-xs">☀️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Afternoon</h3>
                    <p className="text-sm text-gray-500">
                      {isValidExperience(currentDayPlan.experiences.afternoon)
                        ? `${currentDayPlan.experiences.afternoon?.timeSlot} • 1 experience`
                        : "Free time"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              {isValidExperience(currentDayPlan.experiences.afternoon)
                ? renderExperienceCard(
                    currentDayPlan.experiences.afternoon!,
                    "afternoon",
                    currentDayPlan.day
                  )
                : renderFreeTimeSlot("afternoon")}
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
                      {isValidExperience(currentDayPlan.experiences.evening)
                        ? `${currentDayPlan.experiences.evening?.timeSlot} • 1 experience`
                        : "Free time"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              {isValidExperience(currentDayPlan.experiences.evening)
                ? renderExperienceCard(
                    currentDayPlan.experiences.evening!,
                    "evening",
                    currentDayPlan.day
                  )
                : renderFreeTimeSlot("evening")}
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

        {/* Total Cost Section */}
        {(() => {
          const tripCost = calculateTripCost();
          return tripCost ? (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Original Total:</span>
                  <span className="text-gray-500 line-through">
                    {getCurrencySymbol(tripCost.currency)}
                    {tripCost.originalTotal.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount (10%):</span>
                  <span className="text-green-600 font-medium">
                    -{getCurrencySymbol(tripCost.currency)}
                    {tripCost.discountAmount.toFixed(0)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-semibold">
                      Total Cost ({tripCost.totalTravelers} travelers):
                    </span>
                    <span className="font-bold text-lg">
                      {getCurrencySymbol(tripCost.currency)}
                      {tripCost.discountedTotal.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Per Person:</span>
                    <span className="font-medium">
                      {getCurrencySymbol(tripCost.currency)}
                      {tripCost.pricePerPerson.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-green-100 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">%</span>
                  </div>
                  <span className="text-green-800 text-sm font-medium">
                    You saved {getCurrencySymbol(tripCost.currency)}
                    {tripCost.discountAmount.toFixed(0)} with 10% discount!
                  </span>
                </div>
              </div>
            </div>
          ) : null;
        })()}

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

        {/* Add padding to account for sticky button */}
        <div className="pb-20"></div>
      </div>

      {/* Sticky Buy Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-md mx-auto">
          <button
            className="w-full py-3 px-4 font-semibold text-base shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: "#222222",
              color: "#FFFFFF",
              borderRadius: "12px",
            }}
            onClick={() => {
              // Handle buy action here
              alert("Redirecting to booking page...");
            }}
          >
            Buy these experiences at 10% off
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItineraryPage;
