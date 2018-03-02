const log = require("./services/logger.service");
const options = require("./utils/cmdargs").parseArguments();
const Listener = require("./services/listener.service")


const listener = new Listener(options.broker);

listener.listen("listen");

log.debug('HUEHUE');
