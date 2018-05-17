import { Component, AfterViewInit, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { SocketService } from './socket.service';
import { HttpService } from './http.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'app';
  player_data: any;
  connection: any;
  audio: any;
  play_path: string;
  pending_file: string;
  file_list = [];
  @ViewChild("player") player: ElementRef;

  constructor(
    private _socketService: SocketService,
    private _httpService: HttpService
  ) {}

  ngOnInit() {
    this.getSongList();
  }
  ngAfterViewInit() {
    // this.audio = new Audio();
    console.log(this.player);
    this.audio = this.player.nativeElement
    this.connection = this._socketService.getMessages().subscribe(data => {
      this.player_data = data;
      this.updatePlayer();
    });
  }
  ngOnDestroy() {
    this.connection.unsubscribe();
  }

  getSongList() {
    this._httpService.getFileList().subscribe(data => {
      if(data["message"] == "Success") {
        this.file_list = data["data"];
        this.pending_file = this.file_list[0];
      }
    });
  }

  updatePlayer() {
    this.play_path = this.audio.src ? new URL(this.audio.src).pathname.replace("%20", " ") : "";
    if(this.play_path != "/assets/" + this.player_data.file) {
      this.audio.src = "/assets/" + this.player_data.file;
      // this.audio.load();
    }
    if(Math.abs(this.audio.currentTime - this.player_data.position) > 1) {
      this.audio.currentTime = this.player_data.position;
    }
    if(this.audio.paused == this.player_data.playing) {
      if(this.player_data.playing) {
        this.audio.play();
      }
      else {
        this.audio.pause();
      }
    }
  }

  sendCurrentData() {
    this.player_data.position = this.audio.currentTime;
    this.player_data.playing = !this.audio.paused;
    this._socketService.sendMessage(this.player_data);
  }

  newSong() {
    this.player_data.file = this.pending_file;
    this.player_data.position = 0;
    this.player_data.playing = false;
    this.updatePlayer();
    this.sendCurrentData();
  }

  queueSong() {
    this.player_data.playlist.push(this.pending_file);
    this.sendCurrentData();
  }
  nextSong() {
    if(this.player_data.playlist.length > 0) {
      this.player_data.file = this.player_data.playlist[0];
      this.player_data.playlist.splice(0,1);
      this.player_data.position = 0;
      this.player_data.playing = true;
      this.updatePlayer();
      this.sendCurrentData();
    }
  }

  moveInQueue(idx, movement) {
    var pos = idx + movement;
    if(pos >= 0 && idx >= 0 && pos < this.player_data.playlist.length && idx < this.player_data.playlist.length) {
      var temp = this.player_data.playlist[idx];
      this.player_data.playlist[idx] = this.player_data.playlist[pos];
      this.player_data.playlist[pos] = temp;
      this.sendCurrentData();
    }
  }
  removeFromQueue(idx) {
    if(idx >= 0 && idx < this.player_data.playlist.length) {
      this.player_data.playlist.splice(idx, 1);
      this.sendCurrentData();
    }
  }

  play() {
    if(!this.player_data.playing || this.audio.currentTime != this.player_data.position) {
      this.sendCurrentData();
    }
  }
  pause() {
    if(this.player_data.playing || this.audio.currentTime != this.player_data.position) {
      this.sendCurrentData();
    }
  }
}
