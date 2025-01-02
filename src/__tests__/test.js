import { WebSocket } from "ws";

// Mock data for 100 clients
const generateMockClientsData = (num) => {
  const clients = [];

  for (let i = 0; i < num; i++) {
    const studentId = `23104${String(i).padStart(3, "0")}`;
    const latitude = 28.5 + Math.random();
    const longitude = 77.5 + Math.random();
    clients.push({
      student_id: studentId,
      latitude,
      longitude,
    });
  }

  return clients;
};

const mockClientsData = generateMockClientsData(100);

const createMockWebSocketClients = async (serverUrl, mockData) => {
  const clients = [];

  for (const data of mockData) {
    const delay = Math.random() * 5000; 

    setTimeout(() => {
      const ws = new WebSocket(serverUrl);

      let locationUpdateInterval;
      const sendLocation = () => {
        data.latitude += (Math.random() - 0.5) * 0.01;
        data.longitude += (Math.random() - 0.5) * 0.01;
        ws.send(JSON.stringify(data));
        console.log(`Sent updated location for ${data.student_id}:`, data);
      };

      ws.on("open", () => {
        console.log(`Client connected: ${data.student_id}`);
        sendLocation(); // Initial location send
        locationUpdateInterval = setInterval(sendLocation, 5000);
      });

      ws.on("message", (message) => {
        try {
          const parsedData = JSON.parse(message);
          console.log(`Received from server for ${data.student_id}:`, parsedData);

          if (parsedData.latitudeData && parsedData.latitudeData.length > 0) {
          } else {
            console.log(`No friends for ${data.student_id}`);
          }
        } catch (error) {
          console.error(`Error processing message for ${data.student_id}:`, error);
        }
      });

      ws.on("close", () => {
        console.log(`Client disconnected: ${data.student_id}`);
        clearInterval(locationUpdateInterval);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for ${data.student_id}:`, error);
      });

      clients.push(ws);

      const disconnectDelay = 60000 + Math.random() * 60000; 
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          console.log(`Client disconnected after delay: ${data.student_id}`);
        }
      }, disconnectDelay);
    }, delay);
  }

  return clients;
};

// Usage
(async () => {
  const serverUrl = "ws://localhost:3000";
  const clients = await createMockWebSocketClients(serverUrl, mockClientsData);

  setTimeout(() => {
    console.log("All WebSocket clients have been created");
  }, 6000); 
})();
