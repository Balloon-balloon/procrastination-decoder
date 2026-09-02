"use client";
import { useCallback, useEffect, useState } from "react";
import { AppData } from "@/lib/types";
import { loadData, saveData, getDefaultData } from "@/lib/store";

export function useAppData() {
  const [data, setData] = useState<AppData>(getDefaultData());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveData(data);
    }
  }, [data, loaded]);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev));
  }, []);

  return { data, update, loaded };
}
