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
listener.initialize([
        // Processing function
        function *(next) {
            const subtitleCovertService = new SubtitleConvertService(this.message.content.source_file, this.message.content.destination_file);
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
        },
        // Success publish function
        function * (next) {
            this.publish(options.RABBIT_MQ_RESPONSE_QUEUE, options.RABBIT_MQ_RESPONSE_QUEUE, this.state.response, {});
            yield next;
        }
    ],
    // Error function
    function (err, context) {
        this.ack = true;
        context.state.response = {
            outcome: "failed",
            correlation_id: context.message.content.correlation_id,
            source_file: context.message.content.source_file,
            destination_file: context.message.content.destination_file,
            message: err.message
        };
        context.publish(options.RABBIT_MQ_RESPONSE_QUEUE, options.RABBIT_MQ_RESPONSE_QUEUE, context.state.response, {});
        log.error(err.message);
    });

// Start listening
listener.listen();