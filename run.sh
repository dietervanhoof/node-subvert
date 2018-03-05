#!/usr/bin/env bash
nodemon subvert.js \
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
	--RABBIT_MQ_PASSWORD=guest \
	--NUMBER_OF_WORKERS=1
