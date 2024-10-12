import { useState, useEffect } from 'react';

const useCSVData = (startDate, endDate, samplingRate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/csv-data?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&samplingRate=${encodeURIComponent(samplingRate)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          console.warn('Received empty or non-array data from API');
          setData([]);
        } else {
          setData(jsonData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, samplingRate]);

  return { data, loading, error };
};

export default useCSVData;