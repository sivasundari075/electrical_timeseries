# electrical_timeseries
Visualize timeseries dynamically

How to use:

- Upload csv to an influxdb instance (local or cloud)
    - influxdb.py file will guide in the case of a local influxdb docker image
    - csv files should be in public
- Fill the .env.local file with bucket name and token from influxdb
- npm run dev
