// Test script to populate localStorage with sample itinerary data
// Run this in browser console to test the ItineraryPage

const sampleItinerary = {
  itinerary: {
    day1: {
      morning: {
        timeSlot: "09:00-12:00",
        experienceId: 3909,
        vendorId: "headout",
        tourId: 1,
        variantId: 2,
        tourGroupName: "Skip The Line Entry + Audioguide",
        variantName: "Louvre Museum Reserved Access Tickets with Audio Guide",
        duration: "3h 0m",
        location: "The Louvre Museum",
        price: "31.5 EUR per person",
        notes:
          "Start early to avoid crowds, audioguide recommended for comprehensive experience",
      },
      afternoon: {
        timeSlot: "14:30-16:30",
        experienceId: 7504,
        vendorId: "headout",
        tourId: 1,
        variantId: 1,
        tourGroupName: "Direct Entry Tickets with Rooftop Access",
        variantName: "Direct Entry Tickets with Rooftop Access",
        duration: "2h 0m",
        location: "Arc De Triomphe",
        price: "16 EUR per person",
        notes:
          "Perfect afternoon timing for golden hour photography from rooftop",
      },
      evening: {
        timeSlot: "18:00-19:30",
        experienceId: 23604,
        vendorId: "headout",
        tourId: 1,
        variantId: 1,
        tourGroupName: "Access to 2nd floor & guided tour tickets",
        variantName: "Guided Tour of Second Floor",
        duration: "1h 30m",
        location: "Eiffel Tower",
        price: "45 EUR per person",
        notes: "Evening visit for beautiful city lights and sunset views",
      },
    },
    day2: {
      morning: {
        timeSlot: "10:00-12:00",
        experienceId: 9005,
        vendorId: "headout",
        tourId: 1,
        variantId: 2,
        tourGroupName: "Summit Climbing Experience",
        variantName:
          "Guided Tour of Second Floor by Stairs + Summit Access by Elevator",
        duration: "2h 0m",
        location: "Eiffel Tower",
        price: "50 EUR per person",
        notes:
          "Active morning experience with stairs climb and elevator to summit",
      },
      afternoon: {
        timeSlot: "14:00-18:00",
        experienceId: 30021,
        vendorId: "headout",
        tourId: 1,
        variantId: 1,
        tourGroupName: "Discover Pass: 24-Hours",
        variantName: "24-Hour HOHO Pass + Eiffel Tower Guided Tour",
        duration: "4h 0m",
        location: "Paris City Tour",
        price: "96.6 EUR per person",
        notes:
          "Comprehensive city exploration with hop-on hop-off flexibility, includes return to Eiffel Tower",
      },
    },
    totalCost: {
      day1: "185 EUR for 2 people",
      day2: "293.2 EUR for 2 people",
      total: "478.2 EUR for 2 people",
      perPerson: "239.1 EUR per person",
    },
    optimizationNotes: {
      crowdAvoidance: "Weekday visits recommended, early morning Louvre entry",
      logistics:
        "Day 1 covers central Paris attractions within walking/short metro distance",
      valueOptimization:
        "Day 2 combo includes 16% discount on hop-on hop-off + Eiffel Tower",
      experienceVariety:
        "Mix of cultural (Louvre), historical (Arc de Triomphe), and iconic (Eiffel Tower) experiences",
    },
  },
};

const sampleFormData = {
  attractions: [
    {
      id: 1,
      name: "Louvre Museum",
      category: "Museum",
      description: "World's largest art museum",
      rating: 4.5,
      image:
        "https://images.pexels.com/photos/2675264/pexels-photo-2675264.jpeg",
      duration: "3 hours",
      waitTime: "30 mins",
    },
    {
      id: 2,
      name: "Eiffel Tower",
      category: "Landmark",
      description: "Iconic iron lattice tower",
      rating: 4.8,
      image: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg",
      duration: "2 hours",
      waitTime: "45 mins",
    },
  ],
  startDate: "2024-06-20",
  endDate: "2024-06-26",
  adults: 2,
  children: 0,
  infants: 0,
  seniors: 0,
};

// Store the data in localStorage
localStorage.setItem("itinerary", JSON.stringify(sampleItinerary));
localStorage.setItem("itineraryData", JSON.stringify(sampleFormData));

console.log("Sample itinerary data has been stored in localStorage!");
console.log("You can now navigate to the itinerary page to see the results.");
