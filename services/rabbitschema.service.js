const RabbitSchema = require('rabbitmq-schema');
const log = require("./logger.service");

function RabbitSchemaservice(config) {
    this.config = config;
    return this;
}

RabbitSchemaservice.prototype.createSchema = function() {
    const requestQueue = this.createQueueDefinition(this.config.RABBIT_MQ_REQUEST_QUEUE, {}, {});
    const responseQueue = this.createQueueDefinition(this.config.RABBIT_MQ_RESPONSE_QUEUE, {}, {});
    const requestBinding = this.createBindingDefinition(this.config.RABBIT_MQ_REQUEST_QUEUE, requestQueue, {});
    const responseBinding = this.createBindingDefinition(this.config.RABBIT_MQ_RESPONSE_QUEUE, responseQueue, {});
    const requestExchange = this.createExchangeDefinition(this.config.RABBIT_MQ_REQUEST_EXCHANGE, this.config.RABBIT_MQ_REQUEST_TOPIC_TYPE, [requestBinding], {});
    const responseExchange = this.createExchangeDefinition(this.config.RABBIT_MQ_RESPONSE_EXCHANGE, this.config.RABBIT_MQ_RESPONSE_TOPIC_TYPE, [responseBinding], {});
    return new RabbitSchema([
        requestExchange,
        responseExchange
    ]);
};

RabbitSchemaservice.prototype.createMessageSchema = function(type, properties, required) {
    return {
        type: type,
        properties: properties,
        required: required
    }
};

RabbitSchemaservice.prototype.createQueueDefinition = function(queueName, messageSchema, options) {
    return {
        queue: queueName,
        messageSchema: messageSchema,
        options: options
    }
};

RabbitSchemaservice.prototype.createExchangeDefinition = function(exchangeName, type, bindings, options) {
    return {
        exchange: exchangeName,
        type: type,
        bindings: bindings,
        options: options
    }
};

RabbitSchemaservice.prototype.createBindingDefinition = function(routingPattern, destination, args) {
    return {
        routingPattern: routingPattern,
        destination: destination,
        args: args
    }
};

RabbitSchemaservice.prototype.createDefaultMessageSchema = function(routingPattern, destination, args) {
    return {
        type: 'string'
    }
};

module.exports = RabbitSchemaservice;