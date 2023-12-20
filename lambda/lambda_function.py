import boto3
import json
import logging
from botocore.exceptions import ClientError

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
bucket_name = 'timetreebucket'

def lambda_handler(event, context):
    version = event.get('version', '1.0')  # Default to 1.0 if version key is not present
    logger.info('Payload version: ' + version)

    # Determine HTTP method based on payload version
    if version == '2.0':
        # Handle version 2.0 specific logic
        http_method = event['requestContext']['http']['method']
    else:
        # Handle version 1.0 specific logic
        http_method = event.get('httpMethod')

    logger.info('HTTP Method: ' + str(http_method))

    # Additional log to confirm the event structure
    logger.info('Received event: ' + json.dumps(event))

    if http_method == 'GET':
        logger.info('Handling GET request')
        return handle_get_request(event)
    elif http_method == 'POST':
        logger.info('Handling POST request')
        return handle_post_request(event)
    else:
        logger.warning('Received unexpected HTTP method')
        return {
            'statusCode': 405,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Method Not Allowed', 'method': http_method})
        }





def handle_get_request(event):
    year = event['queryStringParameters']['year']
    month = event['queryStringParameters']['month']
    object_name = f'events/{year}/events-{month}.json'

    try:
        data = s3_client.get_object(Bucket=bucket_name, Key=object_name)
        file_content = data['Body'].read().decode('utf-8')
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': file_content
        }
    except ClientError as e:
        return handle_client_error(e)

def handle_post_request(event):
    year = event['queryStringParameters']['year']
    month = event['queryStringParameters']['month']
    new_event = json.loads(event['body'])
    
    object_name = f'events/{year}/events-{month}.json'

    try:
        # Try to get the existing file
        data = s3_client.get_object(Bucket=bucket_name, Key=object_name)
        existing_file_content = json.loads(data['Body'].read().decode('utf-8'))
        existing_events = existing_file_content.get('events', [])
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            existing_events = []
        else:
            return {
                'statusCode': 500,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': str(e)})
            }

    # Add the new event to the existing events
    existing_events.append(new_event)

    # Create the updated content in the desired format
    updated_content = {
        "events": existing_events
    }

    try:
        # Write the updated content to the S3 object
        s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=json.dumps(updated_content))
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Event added successfully'})
        }
    except ClientError as e:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }


def handle_client_error(e):
    error_code = e.response['Error']['Code']
    if error_code == 'NoSuchKey':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'No events found for this month'})
        }
    else:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def get_cors_headers():
    # Since the Lambda URL is handling CORS, we do not need to set these headers here.
    return {
        'Content-Type': 'application/json'
    }

