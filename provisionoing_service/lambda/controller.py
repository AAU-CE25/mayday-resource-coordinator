def lambda_handler(event, context):
    print("✅ Lambda invoked successfully!")
    return {
        "statusCode": 200,
        "body": "Hello from provisioning_service Lambda!"
    }
