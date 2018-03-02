const util = require("util");
const required_arguments = [
    "RABBIT_MQ_HOST",
    "RABBIT_MQ_PORT",
    "RABBIT_MQ_VHOST",
    "RABBIT_MQ_SUCCESS_EXCHANGE",
    "RABBIT_MQ_SUCCESS_QUEUE",
    "RABBIT_MQ_ERROR_EXCHANGE",
    "RABBIT_MQ_ERROR_QUEUE",
    "RABBIT_MQ_TOPIC_TYPE",
    "RABBIT_MQ_USER",
    "RABBIT_MQ_PASSWORD"
];

const parseArguments = () => {
    const argv = require('minimist')(process.argv.slice(2));
    required_arguments.forEach((argument) => {
        if (!argv[argument]) throw ('Argument ' + argument + ' was missing but is required.');
    });

    // Derived arguments
    argv.broker = util.format('amqp://%s:%s@%s:%d/%s',
        argv.RABBIT_MQ_USER,
        argv.RABBIT_MQ_PASSWORD,
        argv.RABBIT_MQ_HOST,
        argv.RABBIT_MQ_PORT,
        argv.RABBIT_MQ_VHOST);
    return argv;
};

module.exports = {
    parseArguments: parseArguments
};
