import { useEffect, useState } from "react";
import { api } from "./client";
export default function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    api(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({ data: null, loading: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  function reload() {
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    setRevision((previous) => previous + 1);
  }
  return { ...state, reload };
}
