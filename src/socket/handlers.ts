import { Socket } from "socket.io";

export const registerSocketHandlers = (socket: Socket): void => {
  console.log(`🔌 User connected: ${socket.id}`);

  // MATCHES FRONTEND: socket.emit('game:join', { gameId })
  socket.on("game:join", ({ gameId }: { gameId: string }) => {
    socket.join(gameId);
    console.log(`👤 Socket ${socket.id} joined game room: ${gameId}`);

    // Optional: Emit to room that player joined
    socket.to(gameId).emit('player:joined', {
      gameId,
      player: { userId: 'unknown', userName: 'Guest' } // You can enhance this with Auth data
    });
  });

  // MATCHES FRONTEND: socket.emit('game:leave', { gameId })
  socket.on("game:leave", ({ gameId }: { gameId: string }) => {
    socket.leave(gameId);
    console.log(`👤 Socket ${socket.id} left game room: ${gameId}`);
    socket.to(gameId).emit('player:left', { gameId, userId: socket.id });
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
  });
};