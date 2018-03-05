const log = require("./services/logger.service");
const options = require("./utils/cmdargs").parseArguments();
const RabbitSchemaService = require("./services/rabbitschema.service");
const Listener = require("./services/listener.service");
const schemaService = new RabbitSchemaService(options);
const rabbitvalidationservice = require("./services/rabbitvalidation.service");
const SubtitleConvertService = require("./services/subtitleconvert.service");

// Defines the JSON schema to validate requests
const requestMessageSchema = {
    type: 'object',
    properties: {
        correlation_id: {
            type: 'string'
        },
        source_file: {
            type: 'string'
        },
        destination_file: {
            type: 'string'
        },
        start: {
            type: 'string'
        },
        end: {
            type: 'string'
        }
    },
    required: [
        "correlation_id",
        "source_file",
        "destination_file"
    ]
};

// Defines the JSON schema to validate responses
const responseMessageSchema = {
    type: 'object',
    properties: {
        correlation_id: {
            type: 'string'
        },
        source_file: {
            type: 'string'
        },
        destination_file: {
            type: 'string'
        },
        start: {
            type: 'string'
        },
        end: {
            type: 'string'
        },
        outcome: {
            type: 'string'
        },
        message: {
            type: 'string'
        }
    },
    required: [
        "correlation_id",
        "source_file",
        "destination_file",
        "outcome"
    ]
};

const topologySchema = schemaService.createSchema(requestMessageSchema, responseMessageSchema);
rabbitvalidationservice.validateRabbitSchema(options.broker, topologySchema);
const listener = new Listener(options, topologySchema);

// Initialize the listener by passing the functions to execute
listener.initialize(
    // Before processing
    [
        // Request validation function
        function *(next) {
            log.debug("Validating request message");
            topologySchema.validateMessage(options.RABBIT_MQ_REQUEST_EXCHANGE, options.RABBIT_MQ_REQUEST_EXCHANGE, this.message.content);
            yield next;
        }
    ],
    // Processing
    [
        function *(next) {
            const subtitleCovertService = new SubtitleConvertService(this.message.content.source_file,
                this.message.content.destination_file,
                this.message.content.start,
                this.message.content.end);
            yield subtitleCovertService.convert(next);
            log.debug("Subtitle was written!");
            // Put the response in the state object
            this.state.response = {
                outcome: "success",
                correlation_id: this.message.content.correlation_id,
                source_file: this.message.content.source_file,
                destination_file: this.message.content.destination_file
            };
            yield next;
        }
    ],
    // After processing
    [
        function *(next) {
            log.debug("Validating response message");
            topologySchema.validateMessage(options.RABBIT_MQ_RESPONSE_EXCHANGE, options.RABBIT_MQ_RESPONSE_EXCHANGE, this.state.response);
            yield next;
        },
        // Success publish function
        function * (next) {
            this.publish(options.RABBIT_MQ_RESPONSE_QUEUE, options.RABBIT_MQ_RESPONSE_QUEUE, this.state.response, {});
            yield next;
        }
    ],
    // Error function
    function (err, context) {
        context.state.response = {
            outcome: "failed",
            correlation_id: context.message.content.correlation_id,
            source_file: context.message.content.source_file,
            destination_file: context.message.content.destination_file,
            message: err.message
        };
        log.error(`${context.queueName}` + " consumer error: " + err.message);

        let channel = context.consumerChannel; // amqplib promise api: http://www.squaremobius.net/amqp.node/channel_api.html#channel
        let message = context.message;
        // nack the message
        channel.nack(message, false, false);
        context.publish(options.RABBIT_MQ_RESPONSE_QUEUE, options.RABBIT_MQ_RESPONSE_QUEUE, context.state.response, {});
    });

// Start listening
listener.listen();