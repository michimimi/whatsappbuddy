const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }, // To be able to use Root
    authStrategy: new LocalAuth() // Storing the QR Code so you don't have to login every time
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message_create', message => {
	console.log(message.body);
    console.log(message.from);
    console.log(message.id);
    console.log(message.rawData)
});

client.on('message_create', Chat => {
	console.log(Chat.id);
    console.log(Chat.rawData)
});


client.initialize();