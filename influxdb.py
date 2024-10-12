import pandas as pd
import re
import logging
from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS

# Set up logging
logging.basicConfig(filename='influxdb_import.log', level=logging.INFO, format='%(asctime)s %(message)s')

# InfluxDB connection parameters
url = "http://localhost:8086"
token = ""  # Replace with your actual token
org = ""       # Replace with your organization name
bucket = ""  # Replace with your bucket name

# Define the chunk size (number of rows per chunk)
chunk_size = 10000  # Adjust based on your system's capacity

# Create an InfluxDB client
client = InfluxDBClient(url=url, token=token, org=org)
write_api = client.write_api(write_options=SYNCHRONOUS)


time_name = 'Time' # Replace with the name of the time column in your CSV file
# Read and process the CSV file in chunks

path_csv = 'public\\data_logger.csv' # Replace with the path to your CSV file
df_iterator = pd.read_csv(path_csv, parse_dates=[time_name], chunksize=chunk_size)

for i, df_chunk in enumerate(df_iterator):
    try:
        # Clean column names by replacing non-alphanumeric characters with underscores
        df_chunk.columns = [re.sub(r'[^0-9a-zA-Z_]+', '_', col) for col in df_chunk.columns]

        # Ensure 'time' column is of datetime type
        df_chunk['time'] = pd.to_datetime(df_chunk[time_name])

        # Set 'time' as the DataFrame index
        df_chunk.set_index('time', inplace=True, drop=True)

        # Explicitly define data types for columns
        # For example, cast all numeric columns to float
        numeric_columns = df_chunk.select_dtypes(include=['int64', 'float64']).columns
        # df_chunk[numeric_columns] = df_chunk[numeric_columns].astype(float)

        # Write the DataFrame chunk to InfluxDB
        write_api.write(
            bucket=bucket,
            record=df_chunk,
            data_frame_measurement_name='electrical_data',
            data_frame_tag_columns=[]  # Add tag columns if you have any
        )

        logging.info(f"Chunk {i+1} written to InfluxDB with {len(df_chunk)} records.")
        print(f"Chunk {i+1} written to InfluxDB with {len(df_chunk)} records.")

    except Exception as e:
        logging.error(f"Error writing chunk {i+1}: {e}")
        print(f"Error writing chunk {i+1}: {e}")

print("Data import completed.")
client.close()
