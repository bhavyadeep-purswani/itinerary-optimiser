import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types based on the API response
interface TourInfo {
  id: number;
  name: string;
  duration?: number;
  inventoryType?: string;
  minPax?: number;
  maxPax?: number;
}

export interface ExperienceVariant {
  id: number;
  name: string;
  variantName?: string;
  variantInfo?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  tours?: TourInfo[];
}

export interface ExperienceImage {
  url: string;
  alt?: string;
  altText?: string;
  description?: string;
}

export interface PaxValidationDetail {
  displayName: string;
  description: string;
  minPax: number;
  maxPax: number;
  ageFrom: number;
  ageTo: number | null;
}

export interface PaxValidation {
  [type: string]: PaxValidationDetail;
}

export interface PaxAvailability {
  remaining: number;
  availability: string;
  paxTypes: string[];
}

export interface PriceProfilePerson {
  type: string;
  retailPrice: number;
  listingPrice: number;
  extraCharges: number;
  isPricingInclusiveOfExtraCharges: boolean;
  discount: number;
}

export interface PriceProfile {
  priceProfileType: string;
  persons: PriceProfilePerson[];
  groups: any[];
  people: number;
}

export interface Availability {
  startDate: string;
  startTime: string;
  tourId: number;
  vendorId: number;
  endTime: string;
  boosters: any;
  priceProfile: PriceProfile;
  paxAvailability: PaxAvailability[];
  paxValidation: PaxValidation;
}

export interface Inventory {
  [tourId: string]: {
    [date: string]: Availability[];
  };
}

export interface Experience {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice: number;
  currency: string;
  image: string;
  variants: ExperienceVariant[];
  selectedVariant: number;
  selectedDate: string;
  selectedTime: string;
  hasDiscount: boolean;
  images?: ExperienceImage[];
  city?: {
    displayName: string;
    country: {
      displayName: string;
    };
  };
  inventory?: Inventory;
}

interface ExperiencesState {
  experiences: Experience[];
  loading: boolean;
  error: string | null;
}

const initialState: ExperiencesState = {
  experiences: [],
  loading: false,
  error: null,
};

const experiencesSlice = createSlice({
  name: "experiences",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setExperiences: (state, action: PayloadAction<Experience[]>) => {
      state.experiences = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateExperience: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Experience> }>
    ) => {
      const { id, updates } = action.payload;
      const index = state.experiences.findIndex((exp) => exp.id === id);
      if (index !== -1) {
        state.experiences[index] = { ...state.experiences[index], ...updates };
      }
    },
  },
});

export const { setLoading, setError, setExperiences, updateExperience } =
  experiencesSlice.actions;
export default experiencesSlice.reducer;
