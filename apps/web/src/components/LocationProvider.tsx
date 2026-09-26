"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCATION,
  type DeliveryLocation,
  readStoredLocation,
  writeStoredLocation,
} from "@/lib/location";

type LocationContextValue = {
  location: DeliveryLocation;
  setLocation: (location: DeliveryLocation) => void;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  ready: boolean;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({
  children,
  fallbackAddress,
}: {
  children: ReactNode;
  fallbackAddress?: string;
}) {
  const fallback: DeliveryLocation = {
    ...DEFAULT_LOCATION,
    line1: fallbackAddress?.trim() || DEFAULT_LOCATION.line1,
  };

  const [location, setLocationState] = useState<DeliveryLocation>(fallback);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) setLocationState(stored);
    setReady(true);
  }, []);

  const setLocation = useCallback((next: DeliveryLocation) => {
    setLocationState(next);
    writeStoredLocation(next);
  }, []);

  const value = useMemo(
    () => ({
      location,
      setLocation,
      pickerOpen,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
      ready,
    }),
    [location, setLocation, pickerOpen, ready],
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useDeliveryLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useDeliveryLocation must be used within LocationProvider");
  }
  return ctx;
}
