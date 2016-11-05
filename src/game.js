// выбор игры
game = 'tetrominos';

AZSplashScreen.show(function(){
    GAMES[game].game.init({row: 20, col:10});
    GAMES[game].game.newGame(params);
});

