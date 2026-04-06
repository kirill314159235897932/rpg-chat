const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

let clients = [];
let messageHistory = [];

server.on('connection', (ws) => {
    console.log('Новый игрок подключился');
    
    ws.send(JSON.stringify({
        type: 'history',
        messages: messageHistory.slice(-50)
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            const chatMessage = {
                type: 'message',
                name: data.name,
                text: data.text,
                time: new Date().toLocaleTimeString(),
                timestamp: Date.now()
            };
            
            messageHistory.push(chatMessage);
            if (messageHistory.length > 100) messageHistory.shift();
            
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(chatMessage));
                }
            });
        } catch(e) {
            console.error('Ошибка:', e);
        }
    });
    
    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'online', count: clients.length }));
            }
        });
        console.log('Игрок отключился. Онлайн:', clients.length);
    });
    
    clients.push(ws);
    ws.send(JSON.stringify({ type: 'online', count: clients.length }));
    console.log('Онлайн:', clients.length);
});

console.log('Чат сервер запущен на порту', process.env.PORT || 8080);
