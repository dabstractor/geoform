// Patterns for validating isMountedRef approaches
// This file demonstrates the patterns documented in isMountedRef_research.md

// Pattern 1: Basic isMountedRef
function createBasicIsMountedPattern() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Usage example
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMounted.current) {
        // Safe to update
        setState(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);
}

// Pattern 2: AbortController for fetch
function createFetchWithAbortPattern() {
  const abortController = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    abortController.current = new AbortController();
    setLoading(true);

    fetch('/api/data', {
      signal: abortController.current.signal
    })
      .then(response => response.json())
      .then(data => {
        setData(data);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      abortController.current?.abort();
    };
  }, []);

  return { data, loading };
}

// Pattern 3: RequestAnimationFrame with cleanup
function createAnimationPattern() {
  const requestRef = useRef();
  const previousTimeRef = useRef();

  useEffect(() => {
    let mounted = true;

    const animate = time => {
      if (!mounted) return;

      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        // Animation logic here
        updateAnimation(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      mounted = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return requestRef;
}

// Pattern 4: RAF-based coalescing (from Geoform)
function createRAFCoalescingPattern() {
  const isUpdatingRef = useRef(false);
  const pendingUpdateRef = useRef(0);
  const latestStackRef = useRef([]);

  const syncToUrl = useCallback((formIds) => {
    if (typeof window === 'undefined') return;

    // Store latest value for RAF callback access
    latestStackRef.current = formIds;

    // Create version ID for this update
    const updateId = ++pendingUpdateRef.current;

    // Set updating flag to prevent concurrent updates
    isUpdatingRef.current = true;

    // URL update function
    const performUpdate = () => {
      // Only proceed if this is still the latest update
      if (updateId !== pendingUpdateRef.current) {
        return;
      }

      // Build URL using latest value
      const url = buildUrl(latestStackRef.current);

      // Apply URL update
      window.history.pushState({}, '', url);

      // Reset updating flag
      requestAnimationFrame(() => {
        isUpdatingRef.current = false;
      });
    };

    // Schedule update
    requestAnimationFrame(performUpdate);
  }, []);

  return syncToUrl;
}

// Pattern 5: setTimeout for async state updates
function createAsyncStatePattern() {
  const [value, setValue] = useState(null);

  useEffect(() => {
    fetchData().then(data => {
      // Use setTimeout to avoid setState on unmounted component
      setTimeout(() => {
        setValue(data);
      }, 0);
    });
  }, []);

  return value;
}

// Anti-pattern examples to avoid
function createAntiPatterns() {
  // Anti-pattern 1: Missing cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => prev + 1);
    }, 1000);
    // ❌ Missing clearInterval
  }, []);

  // Anti-pattern 2: Using isMounted without cleanup
  useEffect(() => {
    let isMounted = true;

    fetch('/api/data').then(data => {
      if (isMounted) {
        setData(data); // ❌ Warning: possible memory leak
      }
    });
    // ❌ No cleanup to set isMounted = false
  }, []);

  // Anti-pattern 3: RAF without cleanup
  useEffect(() => {
    const animate = () => {
      updateAnimation();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // ❌ Missing cleanup
  }, []);
}

module.exports = {
  createBasicIsMountedPattern,
  createFetchWithAbortPattern,
  createAnimationPattern,
  createRAFCoalescingPattern,
  createAsyncStatePattern,
  createAntiPatterns
};