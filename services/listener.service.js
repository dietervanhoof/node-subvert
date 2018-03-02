const coworkers = require('coworkers');
const amqplib = require("amqplib");
const log = require("./logger.service");
const consumeOpts = {};

function Listener(config) {
    this.config = config;
    return this;
}

Listener.prototype.initialize = function(middleware) {
    this.app = coworkers();
    /*
        Pass all middleware to the consumer
     */
    middleware.forEach((mid) => {
        this.app.use(mid);
    });

    this.app.prefetch(1, false);

    this.app.queue(this.config.RABBIT_MQ_REQUEST_QUEUE, consumeOpts, function * () {
        this.ack = true;
        log.debug("I finished with this message");
    });

    this.app.on('error', function (err) {
        this.nack = true;
        console.error(err)
    });
};
Listener.prototype.listen = function() {
    this.app.connect(this.config.broker);
};

module.exports = Listener;