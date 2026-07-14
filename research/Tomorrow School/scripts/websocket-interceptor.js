/**
 * WebSocket Interceptor for Hasura
 * 
 * Запускать в Sources → Snippets ДО открытия страницы аудита.
 * Перехватывает все WebSocket сообщения и ищет код аудита.
 */

(function() {
  const origWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new origWebSocket(url, protocols);
    
    if (url.includes('graphql')) {
      console.log('🔌 Hasura WebSocket detected:', url);
      
      // Перехват отправки
      const origSend = ws.send.bind(ws);
      ws.send = function(data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'connection_init') {
            console.log('📤 connection_init (токен отправлен)');
          } else if (parsed.type === 'subscribe') {
            console.log('📤 subscribe:', parsed.id, parsed.payload?.query?.substring(0, 200));
          } else {
            console.log('📤', parsed.type, data.substring(0, 200));
          }
        } catch(e) {
          console.log('📤 [raw]', data.substring(0, 200));
        }
        return origSend(data);
      };
      
      // Перехват получения
      ws.addEventListener('message', function(event) {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'data' && parsed.payload?.data) {
            const data = parsed.payload.data;
            console.log('📥 data:', JSON.stringify(data).substring(0, 500));
            
            // Ищем код аудита в ответе
            const str = JSON.stringify(data);
            if (str.includes('code') || str.includes('audit')) {
              console.log('🔍 FOUND CODE:', str);
            }
          } else if (parsed.type === 'next') {
            console.log('📥 next:', JSON.stringify(parsed.payload).substring(0, 500));
          } else if (parsed.type === 'error') {
            console.log('❌ error:', parsed.payload);
          } else {
            console.log('📥', parsed.type, event.data.substring(0, 200));
          }
        } catch(e) {
          console.log('📥 [raw]', event.data.substring(0, 200));
        }
      });
    }
    
    return ws;
  };
  
  window.WebSocket.prototype = origWebSocket.prototype;
  
  console.log('✅ WebSocket interceptor installed');
  console.log('Открой страницу аудита — все WS сообщения будут в консоли');
})();
