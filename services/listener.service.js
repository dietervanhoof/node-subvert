const amqplib = require('amqplib');

function Listener(broker) {
	this.broker = broker;
	return this;
}

Listener.prototype.listen = function(queuename) {
	amqplib.connect(this.broker).then((conn)=> {
		return conn.createChannel();
	}).then(function(ch) {
        return ch.assertQueue(queuename).then(function(ok) {
            return ch.consume(queuename, function(msg) {
                if (msg !== null) {
                    console.log(msg.content.toString());
                    ch.ack(msg);
                }
            });
        });
    }).catch(console.warn);
};

module.exports = Listener;