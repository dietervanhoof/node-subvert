#!/usr/bin/env bash
nodemon subvert.js \
	--RABBIT_MQ_HOST=localhost \
	--RABBIT_MQ_PORT=5672 \
	--RABBIT_MQ_VHOST=/ \
	--RABBIT_MQ_SUCCESS_EXCHANGE=tempexchange \
	--RABBIT_MQ_SUCCESS_QUEUE=tempqueue \
	--RABBIT_MQ_ERROR_EXCHANGE=born.digital.errors \
	--RABBIT_MQ_ERROR_QUEUE=incomplete_packages \
	--RABBIT_MQ_TOPIC_TYPE=direct \
	--RABBIT_MQ_USER=guest \
	--RABBIT_MQ_PASSWORD=guest
