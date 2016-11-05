GAMES.tetrominos.audio = function() {

    let _self = this;
    let muted = false;


    this.soundOnOff = function (){
        if(!muted) {
            Howler.mute();
        } else {
            Howler.unmute();
        }
        muted = !muted;
    };

    this.blockRotate = new Howl({
        urls: ['./sounds/rotate.wav'],
        volume: 0.25,
    });

    this.slowHit = new Howl({
        urls: ['./sounds/down.wav'],
        volume: 0.5,
    });

    this.forceHit = new Howl({
        urls: ['./sounds/drop.wav'],
    });

    this.pause = new Howl({
        urls: ['./sounds/pause.wav'],
        volume: 0.5,
    });

    this.lineRemove = new Howl({
        urls: ['./sounds/line.wav'],
        volume: 0.6
    });

    this.whoosh = new Howl({
        urls: ['./sounds/move.wav'],
        volume: 0.5,
    });

    this.gameover = new Howl({
        urls: ['./sounds/gameover.wav'],
    });

    this.music = new Howl({
        urls: ['./sounds/music.ogg'],
        volume: 0.25,
        onend: function() {
            _self.music.play();
        }
    });

};
