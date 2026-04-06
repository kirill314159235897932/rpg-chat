const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

let clients = [];
let messageHistory = [];
let userPrivileges = {};

server.on('connection', (ws) => {
    console.log('Новый игрок подключился');
    
    ws.send(JSON.stringify({
        type: 'history',
        messages: messageHistory.slice(-50)
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'update_privilege') {
                userPrivileges[data.name] = {
                    badge: data.badge,
                    color: data.color
                };
                console.log(`👑 Обновлена привилегия для ${data.name}: ${data.badge}`);
                return;
            }
            
            const privilege = userPrivileges[data.name] || null;
            
            let formattedName = data.name;
            if (privilege) {
                if (privilege.color === 'rainbow') {
                    formattedName = `${privilege.badge} <span style="background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet); -webkit-background-clip: text; background-clip: text; color: transparent;">${data.name}</span> ${privilege.badge}`;
                } else {
                    formattedName = `${privilege.badge} <span style="color: ${privilege.color};">${data.name}</span> ${privilege.badge}`;
                }
            }
            
            const chatMessage = {
                type: 'message',
                name: formattedName,
                text: data.text,
                time: new Date().toLocaleTimeString(),
                timestamp: Date.now(),
                rawName: data.name,
                privilege: privilege
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
