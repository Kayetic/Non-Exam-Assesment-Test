import boto3
import json
import logging
from botocore.exceptions import ClientError
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()


s3_client = boto3.client('s3')
bucket_name = 'shared-calendar-bucket'

def lambda_handler(event, context):
    version = event.get('version', '1.0')  # Default to '1.0' if version key is not present
    
    # Determine HTTP method based on payload version
    if version == '2.0':
        # Handle version 2.0 specific logic
        http_method = event['requestContext']['http']['method']
    else:
        # Handle version 1.0 specific logic
        http_method = event.get('httpMethod')
    
    if http_method == 'GET':
        logger.info('Handling GET request')
        return handle_get_request(event)
    elif http_method == 'POST':
        logger.info('Handling POST request')
        return handle_post_request(event)
    elif http_method == 'DELETE':
        logger.info('Handling DELETE request')
        return handle_delete_request(event)
    else:
        logger.warning('Received unexpected HTTP method')
        return {
            'statusCode': 405,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Method Not Allowed', 'method': http_method})
        }
    

def handle_get_request(event):
    try:
        # Extract year and month from the query parameters
        year = event['queryStringParameters']['year']
        month = event['queryStringParameters']['month']
        prefix = f'{year}/{month}/'
        logger.info(f'Searching for events in {prefix}')

        # List objects in the S3 bucket for the given year and month
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        events = []

        for item in response.get('Contents', []):
            event_object = s3_client.get_object(Bucket=bucket_name, Key=item['Key'])
            event_content = event_object['Body'].read().decode('utf-8')
            event_data = json.loads(event_content)
            events.append(event_data)

        logger.info(f'Retrieved {len(events)} events')
        return {
            'statusCode': 200,
            'body': json.dumps({'events': events})
        }

    except ClientError as e:
        logger.error('ClientError', exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Error fetching events', 'error': str(e)})
        }
    except Exception as e:
        logger.error('Unhandled exception', exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'An unexpected error occurred', 'error': str(e)})
        }

def handle_post_request(event):
    # Extract year and month from the query parameters
    year = event['queryStringParameters']['year']
    month = event['queryStringParameters']['month']
    event_body = json.loads(event['body'])
    
    # Generate a unique identifier for the new event
    event_id = str(uuid.uuid4())
    
    # Add the eventID to the event body
    event_body['eventID'] = event_id
    
    # Construct the object key with the unique eventID
    object_key = f'{year}/{month}/{event_id}.json'

    # Save the new event to S3
    try:
        s3_client.put_object(Bucket=bucket_name, Key=object_key, Body=json.dumps(event_body))
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Event created successfully', 'eventID': event_id})
        }
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Error creating event', 'error': str(e)})
        }