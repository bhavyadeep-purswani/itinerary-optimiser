// Export store and types
export { store } from "./store";
export type { RootState, AppDispatch } from "./store";

// Export typed hooks
export { useAppDispatch, useAppSelector } from "./hooks";

// Export slice actions (add more as you create them)
export {
  increment,
  decrement,
  incrementByAmount,
  reset,
} from "./slices/counterSlice";
