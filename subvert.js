const log = require("./services/logger.service");
const options = require("./utils/cmdargs").parseArguments();
const RabbitSchemaService = require("./services/rabbitschema.service");
const Listener = require("./services/listener.service");
const listener = new Listener(options);
const schemaService = new RabbitSchemaService(options);
const topologySchema = schemaService.createSchema();
const rabbitvalidationservice = require("./services/rabbitvalidation.service");
const subtitleconverterservice = require("./services/subtitleconvert.service");

rabbitvalidationservice.validateRabbitSchema(options.broker, topologySchema);

listener.initialize([
    function * (next) {
        // save consumer start time
        const startTime = Date.now();
        // move on to next middleware
        yield next;
        // all middlewares have finished
        const elapsed = Date.now() - startTime;
        log.debug(`coworkers-trace:${elapsed}`);
    },
    function * (next) {
        this.message.content = JSON.parse(this.message.content);
        yield next
    },
    function * (next) {
        // Put the response in the state object
        this.state.response = {
            correlation_id: this.message.content.correlation_id,
            data: subtitleconverterservice.convert(this.message.content.data)
        };
        yield next
    },
    function * (next) {
        this.publish(options.RABBIT_MQ_RESPONSE_QUEUE, options.RABBIT_MQ_RESPONSE_QUEUE, this.state.response, {});
        yield next;
    }
]);

listener.listen();