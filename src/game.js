// выбор игры
game = 'tetramino';

AZSplashScreen.show(function(){
    GAMES[game].game.init({row: 20, col:10});

    if (GAMES[game].game.music) {
        GAMES[game].game.Sound.music.stop(music);
    }
    GAMES[game].game.music = GAMES[game].game.Sound.music.play();

});