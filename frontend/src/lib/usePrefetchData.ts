import { useEffect, useRef } from "react";
import { schoolsApi } from "@/store/api/schoolsApi";
import { useAppDispatch } from "@/store/hooks";

const CACHE_VERSION_KEY = "schools_data_version";

export function usePrefetchData() {
  const dispatch = useAppDispatch();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function prefetch() {
      try {
        const versionResult = await dispatch(
          schoolsApi.endpoints.getDataVersion.initiate()
        ).unwrap();

        const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);

        if (cachedVersion === String(versionResult.version)) {
          return;
        }

        await dispatch(
          schoolsApi.endpoints.getDataAll.initiate()
        ).unwrap();

        localStorage.setItem(CACHE_VERSION_KEY, String(versionResult.version));
      } catch {
        // offline or server down — SW cache will serve stale data
      }
    }

    prefetch();
  }, [dispatch]);
}
