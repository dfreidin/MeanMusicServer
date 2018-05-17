import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket;

  constructor() { }

  sendMessage(player_data) {
    this.socket.emit("update-player", player_data);
  }

  getMessages() {
    let observable = new Observable(observer => {
      this.socket = io();
      this.socket.on("player-data", (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }
}
