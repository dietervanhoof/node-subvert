# node-subvert
Microservice that converts XIF to SRT using RabbitMQ based on my [node-microservice-template
](https://github.com/dietervanhoof/node-microservice-template).

## Usage
Start the project by running
```
node subvert.js \
        --RABBIT_MQ_HOST=localhost \
        --RABBIT_MQ_PORT=5672 \
        --RABBIT_MQ_VHOST=/ \
        --RABBIT_MQ_REQUEST_EXCHANGE=subvert-requests \
        --RABBIT_MQ_REQUEST_QUEUE=subvert-requests \
        --RABBIT_MQ_RESPONSE_EXCHANGE=subvert-responses \
        --RABBIT_MQ_RESPONSE_QUEUE=subvert-responses \
        --RABBIT_MQ_REQUEST_TOPIC_TYPE=direct \
        --RABBIT_MQ_RESPONSE_TOPIC_TYPE=direct \
        --RABBIT_MQ_USER=guest \
        --RABBIT_MQ_PASSWORD=guest
        --NUMBER_OF_WORKERS=1
```

The service will create exchanges, queues and bindings on RabbitMQ. Incoming and outgoing messages against a JSON schema.

## Example request
```
{
    "correlation_id": "abcdefg",
    "source_file": "/Users/dieter/input.xif",
    "destination_file": "/Users/dieter/output.srt",
    "start": "00:03:00:14",
    "end": "00:48:01:10"
}
```

The `start` and `end` parameters are optional. The others are mandatory.

## Example response
```
{
    "outcome": "success",
    "correlation_id": "abcdefg",
    "source_file": "/Users/dieter/input.xif",
    "destination_file": "/Users/dieter/output.srt"
}
```
