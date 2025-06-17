import { Server, Socket } from "socket.io";
let socketIOPostOject: Server;
export class SocketIOPostHandler {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
    socketIOPostOject = io;
  }
  public listen(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log("New client connected", socket.id);
    });
  }
}
