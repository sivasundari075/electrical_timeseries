import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useCSVData from '@/useCSVData';

export const Dashboard = () => {
  const [startDateTime, setStartDateTime] = useState('2023-06-26T00:00');
  const [endDateTime, setEndDateTime] = useState('2023-06-26T23:59');
  const [samplingRate, setSamplingRate] = useState('1m');
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [plotStyle, setPlotStyle] = useState({});
  const [useSecondaryAxis, setUseSecondaryAxis] = useState({});
  const [yScales, setYScales] = useState({});
  const { data: parsedData, loading, error } = useCSVData(startDateTime, endDateTime, samplingRate);

  const channels = useMemo(() => {
    if (!Array.isArray(parsedData) || parsedData.length === 0 || !parsedData[0]) {
      return [];
    }
    return Object.keys(parsedData[0]).filter(key => key !== 'time');
  }, [parsedData]);

  useEffect(() => {
    // Initialize y-scales for each channel
    const initialYScales = channels.reduce((acc, channel) => {
      acc[channel] = { min: 'auto', max: 'auto' };
      return acc;
    }, {});
    setYScales(initialYScales);
  }, [channels]);

  const handleChannelToggle = (channel) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(ch => ch !== channel)
        : [...prev, channel]
    );
  };

  const togglePlotStyle = (channel) => {
    setPlotStyle(prev => ({
      ...prev,
      [channel]: prev[channel] === 'scatter' ? 'line' : 'scatter'
    }));
  };

  const toggleSecondaryAxis = (channel) => {
    setUseSecondaryAxis(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  const handleYScaleChange = (channel, axis, value) => {
    setYScales(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [axis]: value === 'auto' ? 'auto' : Number(value)
      }
    }));
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'];

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleString();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return (
      <div>
        <p>No data available for the selected date range.</p>
        <p>Start Date: {startDateTime}</p>
        <p>End Date: {endDateTime}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Electrical Timeseries Dashboard</h1>
      
      <div className="mb-4 flex items-center space-x-2">
        <Label htmlFor="startDateTime">Start Date and Time:</Label>
        <Input 
          id="startDateTime" 
          type="datetime-local" 
          value={startDateTime} 
          onChange={(e) => setStartDateTime(e.target.value)} 
        />
        <Label htmlFor="endDateTime">End Date and Time:</Label>
        <Input 
          id="endDateTime" 
          type="datetime-local" 
          value={endDateTime} 
          onChange={(e) => setEndDateTime(e.target.value)} 
        />
        <Label htmlFor="samplingRate">Sampling Rate:</Label>
        <Select value={samplingRate} onValueChange={setSamplingRate}>
          <SelectTrigger id="samplingRate">
            <SelectValue placeholder="Select sampling rate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1s">1 second</SelectItem>
            <SelectItem value="10s">10 seconds</SelectItem>
            <SelectItem value="1m">1 minute</SelectItem>
            <SelectItem value="10m">10 minutes</SelectItem>
            <SelectItem value="1h">1 hour</SelectItem>
            <SelectItem value="1d">1 day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Select Channels:</h2>
        <div className="flex flex-wrap gap-4">
          {channels.map((channel) => (
            <div key={channel} className="flex items-center space-x-2">
              <Checkbox 
                id={channel} 
                checked={selectedChannels.includes(channel)}
                onCheckedChange={() => handleChannelToggle(channel)}
              />
              <Label htmlFor={channel}>{channel}</Label>
              {selectedChannels.includes(channel) && (
                <>
                  <Button variant="outline" size="sm" onClick={() => togglePlotStyle(channel)}>
                    {plotStyle[channel] === 'scatter' ? 'Line' : 'Scatter'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleSecondaryAxis(channel)}>
                    {useSecondaryAxis[channel] ? 'Primary Y' : 'Secondary Y'}
                  </Button>
                  <Input
                    type="text"
                    placeholder="Min Y"
                    value={yScales[channel]?.min}
                    onChange={(e) => handleYScaleChange(channel, 'min', e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    placeholder="Max Y"
                    value={yScales[channel]?.max}
                    onChange={(e) => handleYScaleChange(channel, 'max', e.target.value)}
                    className="w-20"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Timeseries Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={parsedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={formatXAxis} />
              <YAxis 
                yAxisId="left" 
                domain={[
                  (dataMin) => {
                    const min = Math.min(...selectedChannels
                      .filter(ch => !useSecondaryAxis[ch])
                      .map(ch => yScales[ch]?.min === 'auto' ? dataMin : Number(yScales[ch]?.min)));
                    return isFinite(min) ? min : dataMin;
                  },
                  (dataMax) => {
                    const max = Math.max(...selectedChannels
                      .filter(ch => !useSecondaryAxis[ch])
                      .map(ch => yScales[ch]?.max === 'auto' ? dataMax : Number(yScales[ch]?.max)));
                    return isFinite(max) ? max : dataMax;
                  }
                ]}
              />
              {selectedChannels.some(channel => useSecondaryAxis[channel]) && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  domain={[
                    (dataMin) => {
                      const min = Math.min(...selectedChannels
                        .filter(ch => useSecondaryAxis[ch])
                        .map(ch => yScales[ch]?.min === 'auto' ? dataMin : Number(yScales[ch]?.min)));
                      return isFinite(min) ? min : dataMin;
                    },
                    (dataMax) => {
                      const max = Math.max(...selectedChannels
                        .filter(ch => useSecondaryAxis[ch])
                        .map(ch => yScales[ch]?.max === 'auto' ? dataMax : Number(yScales[ch]?.max)));
                      return isFinite(max) ? max : dataMax;
                    }
                  ]}
                />
              )}
              <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
              <Legend />
              {selectedChannels.map((channel, index) => (
                plotStyle[channel] === 'scatter' ? (
                  <Scatter
                    key={channel}
                    name={channel}
                    data={parsedData}
                    fill={colors[index % colors.length]}
                    line={false}
                    yAxisId={useSecondaryAxis[channel] ? "right" : "left"}
                  >
                    <YAxis dataKey={channel} />
                  </Scatter>
                ) : (
                  <Line 
                    key={channel}
                    type="monotone"
                    dataKey={channel}
                    stroke={colors[index % colors.length]}
                    dot={false}
                    yAxisId={useSecondaryAxis[channel] ? "right" : "left"}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};