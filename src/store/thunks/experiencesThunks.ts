import { AppDispatch } from "../store";
import {
  setLoading,
  setError,
  setExperiences,
  Experience,
  ExperienceVariant,
  Availability,
  Inventory,
} from "../slices/experiencesSlice";

// API Response types based on the provided endpoint
interface APITour {
  id: number;
  name: string;
  variantId?: number;
  variantName?: string;
  variantInfo?: string;
  parentProductName?: string;
  productId?: number;
  duration?: number;
  inventoryType?: string;
  minPax?: number;
  maxPax?: number;
}

interface APIVariant {
  id: number;
  name: string;
  productId: number;
  variantInfo?: string;
  listingPrice?: {
    currencyCode: string;
    originalPrice: number;
    finalPrice: number;
    minimumPayablePrice: number;
    type: string;
    otherPricesExist: boolean;
    bestDiscount: number;
  };
  tours: APITour[];
}

interface APIResponse {
  id: number;
  name: string;
  url?: string;
  city?: {
    displayName: string;
    country: {
      displayName: string;
      currency: {
        code: string;
        symbol: string;
      };
    };
  };
  imageUploads?: Array<{
    url: string;
    alt?: string;
    title?: string;
  }>;
  media?: {
    productImages?: Array<{
      url: string;
      altText?: string;
      description?: string;
    }>;
  };
  variants?: APIVariant[];
  description?: string;
}

interface InventoryAPIResponse {
  availabilities: Availability[];
  fromDate: string;
  toDate: string;
  currencyCode: string;
}

// Transform API response to our Experience format (without price data)
const transformAPIResponseToExperiences = (
  apiData: APIResponse
): Experience[] => {
  const baseExperience = {
    id: apiData.id.toString(),
    name: apiData.name,
    description:
      apiData.description ||
      `Visit ${apiData.name} and explore this amazing experience.`,
    currency: apiData.city?.country?.currency?.code || "USD",
    image:
      apiData.imageUploads?.[0]?.url ||
      apiData.media?.productImages?.[0]?.url ||
      "/api/placeholder/400/250",
    images: [
      ...(apiData.imageUploads || []).map((img) => ({
        url: img.url,
        alt: img.alt,
        altText: img.title,
        description: img.title,
      })),
      ...(apiData.media?.productImages || []).map((img) => ({
        url: img.url,
        alt: img.altText,
        altText: img.altText,
        description: img.description,
      })),
    ],
    city: apiData.city,
    // Placeholder values - will be overridden in component
    price: 0,
    originalPrice: 0,
    selectedDate: "2024-01-15",
    selectedTime: "10:00 AM",
    availableDates: ["2024-01-15", "2024-01-16", "2024-01-17"],
    availableTimeSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"],
    hasDiscount: false,
  };

  if (apiData.variants && apiData.variants.length > 0) {
    // Create variants from the API variants array
    const variants: ExperienceVariant[] = apiData.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      variantName: variant.name,
      variantInfo: variant.variantInfo,
      price: variant.listingPrice?.finalPrice || 0,
      originalPrice: variant.listingPrice?.originalPrice || 0,
      currency:
        variant.listingPrice?.currencyCode ||
        apiData.city?.country?.currency?.code ||
        "USD",
      tours: variant.tours.map((tour) => ({
        id: tour.id,
        name: tour.name,
        duration: tour.duration,
        inventoryType: tour.inventoryType,
        minPax: tour.minPax,
        maxPax: tour.maxPax,
      })),
    }));

    return [
      {
        ...baseExperience,
        variants: variants,
        selectedVariant: variants.length > 0 ? variants[0].id : 0,
      },
    ];
  }

  // If no variants, create a single experience with basic variants
  return [
    {
      ...baseExperience,
      variants: [],
      selectedVariant: 0,
    },
  ];
};

export const fetchInventory = async (
  experienceId: string,
  variantId: number
): Promise<Inventory | null> => {
  const fromDate = new Date();
  const toDate = new Date();
  toDate.setDate(fromDate.getDate() + 7);

  const fromDateStr = fromDate.toISOString().split("T")[0];
  const toDateStr = toDate.toISOString().split("T")[0];

  try {
    const response = await fetch(
      `https://api-ho.headout.com/api/v7/tour-groups/${experienceId}/inventories/?variantId=${variantId}&from-date=${fromDateStr}&to-date=${toDateStr}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch inventory for variant ${variantId}: ${response.status} ${response.statusText}`
      );
    }

    const inventoryData: InventoryAPIResponse = await response.json();

    const inventory: Inventory = {};
    for (const availability of inventoryData.availabilities) {
      if (!inventory[availability.tourId]) {
        inventory[availability.tourId] = {};
      }
      if (!inventory[availability.tourId][availability.startDate]) {
        inventory[availability.tourId][availability.startDate] = [];
      }
      inventory[availability.tourId][availability.startDate].push(availability);
    }

    return inventory;
  } catch (error) {
    console.error(`Error fetching inventory for variant ${variantId}:`, error);
    return null;
  }
};

// Thunk to fetch experience by ID
export const fetchExperienceById =
  (experienceId: string) => async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await fetch(
        `https://api-ho.headout.com/api/v6/tour-groups/${experienceId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch experience: ${response.status} ${response.statusText}`
        );
      }

      const apiData: APIResponse = await response.json();
      const experiences = transformAPIResponseToExperiences(apiData);

      if (experiences.length > 0 && experiences[0].selectedVariant) {
        const experience = experiences[0];
        const inventory = await fetchInventory(
          experience.id,
          experience.selectedVariant
        );
        if (inventory) {
          experience.inventory = inventory;
        }
      }

      dispatch(setExperiences(experiences));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      console.error("Error fetching experience:", error);
    }
  };

// Thunk to fetch multiple experiences by IDs
export const fetchExperiencesByIds =
  (experienceIds: string[]) => async (dispatch: AppDispatch) => {
    if (!experienceIds || experienceIds.length === 0) {
      dispatch(setError("No experience IDs provided"));
      dispatch(setLoading(false));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Fetch all experiences in parallel
      const promises = experienceIds.map(async (id, index) => {
        try {
          const response = await fetch(
            `https://api-ho.headout.com/api/v6/tour-groups/${id}`
          );

          if (!response.ok) {
            console.warn(
              `Failed to fetch experience ${id}: ${response.status} ${response.statusText}`
            );
            return null;
          }

          const apiData: APIResponse = await response.json();
          return transformAPIResponseToExperiences(apiData);
        } catch (error) {
          console.warn(`Error fetching experience ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);

      // Filter out failed requests and flatten the results
      const allExperiences = results
        .filter((result): result is Experience[] => result !== null)
        .flat();

      if (allExperiences.length === 0) {
        dispatch(
          setError(
            "Failed to fetch any experiences. Please check the experience IDs and try again."
          )
        );
        dispatch(setLoading(false));
        return;
      }

      const experiencesWithInventory = await Promise.all(
        allExperiences.map(async (experience) => {
          if (experience.selectedVariant) {
            const inventory = await fetchInventory(
              experience.id,
              experience.selectedVariant
            );
            if (inventory) {
              return { ...experience, inventory };
            }
          }
          return experience;
        })
      );

      dispatch(setExperiences(experiencesWithInventory));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      console.error("Error fetching experiences:", error);
    }
  };
