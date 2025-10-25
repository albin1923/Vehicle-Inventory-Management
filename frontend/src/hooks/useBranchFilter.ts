import { useCallback } from "react";

import { setSelectedBranch } from "../store/preferencesSlice";
import useAppDispatch from "./useAppDispatch";
import useAppSelector from "./useAppSelector";

const useBranchFilter = () => {
  const dispatch = useAppDispatch();
  const branchId = useAppSelector((state) => state.preferences.selectedBranchId);

  const setBranchId = useCallback(
    (value: number | null) => {
      dispatch(setSelectedBranch(value));
    },
    [dispatch],
  );

  return { branchId, setBranchId };
};

export default useBranchFilter;
