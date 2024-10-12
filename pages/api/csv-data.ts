import { InfluxDB } from '@influxdata/influxdb-client'

const url = 'http://localhost:8086'
const token = process.env.INFLUXDB_TOKEN
const org = process.env.INFLUXDB_ORG
const bucket = process.env.INFLUXDB_BUCKET

export default async function handler(req, res) {
  const { startDate, endDate, samplingRate } = req.query

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' })
  }

  // Format dates for InfluxDB
  const formattedStartDate = new Date(startDate).toISOString()
  const formattedEndDate = new Date(endDate).toISOString()

  const client = new InfluxDB({ url, token })
  const queryApi = client.getQueryApi(org)

  let query = `
    from(bucket:"${bucket}")
      |> range(start: ${formattedStartDate}, stop: ${formattedEndDate})
      |> filter(fn: (r) => r._measurement == "electrical_data")
  `

  if (samplingRate) {
    query += `|> aggregateWindow(every: ${samplingRate}, fn: mean, createEmpty: false)`
  }

  query += `|> limit(n: 10000)`

  console.log('Query:', query)

  try {
    const result = await queryApi.collectRows(query)
    
    // Transform the data into a more suitable format
    const transformedResult = result.reduce((acc, row) => {
      const timeKey = row._time
      if (!acc[timeKey]) {
        acc[timeKey] = { time: timeKey }
      }
      acc[timeKey][row._field] = row._value
      return acc
    }, {})

    const finalResult = Object.values(transformedResult)

    res.status(200).json(finalResult)
  } catch (error) {
    console.error('Error querying data:', error)
    res.status(500).json({ error: 'Failed to fetch data', details: error.message, stack: error.stack })
  }
}