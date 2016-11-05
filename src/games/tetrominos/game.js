/**
 * @todo: генерация положений фигур при инициализации(как раз будет решена задача с разными системами вращения)
 * @todo: Нужны варианты отрисовки и верчения, как в NES и Tangen
 * @todo: моргающее убирание линий
 * @todo: events для функций отрисовки
 * @todo: music on/off
 * @todo: игрок-компьютер в соседнем окне
 *
 */
GAMES.tetrominos.game = (function () {

    const ROTATE_NES = 'nes';
    const ROTATE_GAMEBOY = 'gameboy';
    const ROTATE_SEGA = 'sega';
    const ROTATE_SRS = 'srs';

    let _self = this;

    let buckets = {};

    _self.Sound = null;

    _self.music = 0;

    let blockStyle = [
        'blue',
        'red',
        'orange',
        'green',
        'purple',
        'yellow'
    ];


    /*
     * Установки
     */
    let opt = {
        //
        bucketWrapperId: 'bucketWrapper',
        bucketNextWrapperId: 'bucketWrapperNext',
        bucketClassName: 'bucket',
        //
        col: 10,
        row: 20,
        //
        score: {
            figure: [0, 0, 4, 8, 6],
            line: 40
        },
        levelUp:1000,
        levelTime:2,
        highScoreVar: 'tetrominosHighScore',
        //
        speed: 500,
        rotateSystem: ROTATE_SRS
    };

    /**
     * Переменные во время игры
     */
    let Game = {
        fill: {},
        interval: {
            main: null,
            timer: null,
            pause: false
        },
        figures: [],
        count: {
            element: 0,
            line: 0,
            score: 0,
            timer: 0,
            level: 1
        },
        frame: {
            speed: opt.speed,
            row: 1,
            col: 1,
            offsetRow: 0,
            offsetCol: 0,
            figure: {
                type: [],
                cells: {},
                style:'default'
            },
            figureNext: {
                type: [],
                cells: {},
                style:'default'
            }
        },
        pause: false,
        next: true,
        gameOver: false
    };

    /**
     * Список фигур
     * @type {[*]}
     */
    let figuresList = [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I

        [[1, 1], [1, 1]], // O

        [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
        [[0, 0, 0], [1, 1, 0], [0, 1, 1]], // Z

        [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // L
        [[0, 0, 0], [1, 1, 1], [0, 0, 1]], // J

        [[0, 0, 0], [1, 1, 1], [0, 1, 0]], // T
    ];

    let figures = [
        [

        ]
    ];

    /*
     ------------DRAWS function------------
     */

    /**
     * Рисует таблицу-стакан
     * @param bucketWrapperId
     * @param row
     * @param col
     * @returns {boolean}
     */
    function drawBucket(bucketWrapperId, row, col) {
        if (bucketWrapperId) {
            Game.fill[bucketWrapperId] = [];
            buckets[bucketWrapperId] = document.createElement('table');
            buckets[bucketWrapperId].className = opt.bucketClassName;
            for (let i = 1; i <= row; i++) {
                lineAdd(bucketWrapperId, buckets[bucketWrapperId], col, i);
            }
            document.getElementById(bucketWrapperId).appendChild(buckets[bucketWrapperId]);
            return true;
        }
        return false;
    }

    /**
     * Добавляет линию в таблицу, перед первым элементом
     * @param bucketWrapperId
     * @param table
     * @param col
     */
    function lineAdd(bucketWrapperId, table, col) {
        let row = document.createElement('tr');
        Game.fill[bucketWrapperId].unshift({});
        for (let i = 1; i <= col; i++) {
            let td = document.createElement('td');
            row.appendChild(td);
            Game.fill[bucketWrapperId][0][i] = 0;
        }
        table.insertBefore(row, table.firstChild);
    }

    /**
     * Удаляет линию
     * @param table
     * @param index
     */
    function lineRemove(table, index) {
        table.removeChild(table.childNodes[index]);
    }

    /**
     * Удаляет и добавляет линию
     * @param bucketWrapperId
     * @param index
     */
    function lineDestroy(bucketWrapperId, index) {
        lineRemove(buckets[bucketWrapperId], index-1);
        Game.fill[bucketWrapperId].splice(index-1, 1);
        lineAdd(bucketWrapperId, buckets[bucketWrapperId], opt.col);
    }

    /**
     * Пустые строки сверху и столбцы слева при первой отрисовке фигуры
     * @param figure
     */
    function drawInitOffset(figure) {

        let setOffsetRow = false;
        let offsetCol = 0;

        let offset = {
            offsetRow: 0,
            offsetCol: 0
        };

        // rows
        for (let r = 0; r < figure.length; r++) {
            // row offset
            if (figure[r].indexOf(1) >= 0 && !setOffsetRow && Game.frame.offsetRow < 1) {
                setOffsetRow = true;
                offset.offsetRow = r;
            }

            // cols
            for (let c = 0; c < figure[r].length; c++) {
                // col offset
                if (figure[r][c] == 1 && offsetCol > c) {
                    offsetCol = c;
                }
            }
        }

        if (Game.frame.offsetCol < 1) {
            offset.offsetCol = offsetCol;
        }

        return offset;
    }

    /**
     * Проверка что клетки для отрисовки не заняты и не выходят за рамки стакана
     *
     * @param bucketWrapperId
     * @param figure
     * @param row
     * @param col
     * @param currentFigureCells
     *
     * @returns {boolean}
     */
    function canDrawElement(bucketWrapperId, figure, row, col, currentFigureCells) {

        // rows
        for (let r = 0; r < figure.length; r++) {

            // row top/bottom
            if ( //(figure[r].indexOf(1) > -1 && (row + r) - Game.frame.offsetRow <= 0) ||
                 (figure[r].indexOf(1) > -1 && (row + r) - Game.frame.offsetRow > opt.row)
            ) {
                return false;
            }

            // cols
            for (let c = 0; c < figure[r].length; c++) {
                // left/right
                if ((figure[r][c] === 1 && (col + c) - Game.frame.offsetCol <= 0)
                    || ((figure[r][c] === 1 && (col + c) - Game.frame.offsetCol > opt.col)
                        || (figure[r][c] === 1 && (col + c) - Game.frame.offsetCol <= 0)
                    )
                ) {
                    return false;
                }

                // collision
                if (((row + r) - Game.frame.offsetRow - 1) >= 0 && figure[r][c] === 1 && Game.fill[bucketWrapperId][(row + r) - Game.frame.offsetRow - 1][(col + c) - Game.frame.offsetCol] === 1
                    && (
                        typeof currentFigureCells[(row + r) - Game.frame.offsetRow] === 'undefined'
                        || (typeof currentFigureCells[(row + r) - Game.frame.offsetRow] !== 'undefined'
                            && typeof currentFigureCells[(row + r) - Game.frame.offsetRow][(col + c) - Game.frame.offsetCol] === 'undefined'
                        )
                    )
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Рисует элемент в основном стакане
     * @param bucketWrapperId
     * @param figure
     * @param row
     * @param col
     * @param offsetRow
     * @param offsetCol
     * @param style
     * @returns {*}
     */
    function drawElement(bucketWrapperId, figure, row, col, offsetRow, offsetCol, style) {
        let cells = {};
        for (let r = 0; r < figure.length; r++) {
            // blocks
            for (let c = 0; c < figure[r].length; c++) {
                if (figure[r][c] === 1 && (row + r) - offsetRow > 0 ) {
                    draw(bucketWrapperId, (row + r) - offsetRow, (col + c) - offsetCol, style);

                    Game.fill[bucketWrapperId][(row + r) - offsetRow - 1][(col + c) - offsetCol] = 1;

                    if (!cells[(row + r) - offsetRow]) cells[(row + r) - offsetRow] = {};
                    cells[(row + r) - offsetRow][(col + c) - offsetCol] = 1
                }
            }
        }
        return cells;
    }

    /**
     *
     * @param bucketWrapperId
     * @param y
     * @param x
     * @param style
     */
    function draw(bucketWrapperId, y, x, style) {
        let b = document.createElement('div');
        b.classList.add('block', style);
        document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + y + ')' + ' td:nth-child(' + x + ')').appendChild(b);
    }

    /**
     * Удаление блоков фигуры из ячейки
     * @param bucketWrapperId
     * @param cells
     */
    function eraseElement(bucketWrapperId, cells) {
        for (let r in cells) {
            for (let c in cells[r]) {
                document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + r + ')' + ' td:nth-child(' + c + ')').innerHTML = "";
                Game.fill[bucketWrapperId][r-1][c] = 0;
            }
        }
    }

    /**
     * Удаление блоков фигуры из ячейки
     * @param bucketWrapperId

     */
    function clear(bucketWrapperId) {
        for (let r in Game.fill[bucketWrapperId]) {
            for (let c in Game.fill[bucketWrapperId][r]) {
                document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + (parseInt(r) + 1) + ')' + ' td:nth-child(' + c + ')').innerHTML = "";
                Game.fill[bucketWrapperId][r][c] = 0;
            }
        }
    }

    /**
     * Поворачивает фигуру
     * @param figure
     * @returns {*}
     */
    function rotateFigure(figure) {
        /*SRS - rotation system, http://strategywiki.org/wiki/File:Tetrominos_rotation_super.png*/
        let col = figure[0].length;
        let row = figure.length;
        let rotateFigure = [];

        for (let l = 0; l < 1; l++) {
            rotateFigure = [];
            for (let r = row - 1; r >= 0; r--) {
                for (let c = 0; c < col; c++) {
                    if ((!rotateFigure[c])) {
                        rotateFigure[c] = [];
                    }
                    rotateFigure[c].push(figure[r][c]);
                }
            }
        }
        return rotateFigure;
    }

    /*
     ----------- MOVE -----------
     */
    /**
     * Переворот фигуры
     */
    function rotate() {
        if (!Game.next && !Game.pause) {
            let newRotate = rotateFigure(Game.frame.figure.type);
            if (canDrawElement(opt.bucketWrapperId, newRotate, Game.frame.row, Game.frame.col, Game.frame.figure.cells) && Game.frame.figure.type.length != 2) {
                _self.Sound.blockRotate.play();
                eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                Game.frame.figure.type = newRotate;
                Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.offsetRow, Game.frame.offsetCol, Game.frame.figure.style);
            }
        }
    }

    /**
     * Перемещение влево
     */
    function left() {
        if (!Game.next && !Game.pause) {
            Game.frame.col--;
            if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                _self.Sound.whoosh.play();
                eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.offsetRow, Game.frame.offsetCol, Game.frame.figure.style);
            } else {
                Game.frame.col++;
            }
        }
    }

    /**
     * Перемещение вправо
     */
    function right() {
        if (!Game.next && !Game.pause) {
            Game.frame.col++;
            if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                _self.Sound.whoosh.play();
                eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.offsetRow, Game.frame.offsetCol, Game.frame.figure.style);
            } else {
                Game.frame.col--;
            }
        }
    }

    /**
     * Перемещение вниз
     */
    function down() {
        if (!Game.next && !Game.pause) {
            Game.frame.row++;
            if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                if (Game.frame.speed <= 50) {
                } else {
                    //_self.Sound.blockRotate.play();
                }
                eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.offsetRow, Game.frame.offsetCol, Game.frame.figure.style);
                return true;
            } else {
                Game.frame.row--;
                return false;
            }
        }
    }

    /*
     ----------- / MOVE -----------
     */

    /**
     * "Центральная" линия/колонка
     * @param count
     * @param length
     * @returns {number}
     */
    function getCenter(count, length) {
        return Math.round((count / 2 - Math.round(length / 2)) + 1);
    }

    /**
     * Рандом
     * @param min
     * @param max
     * @returns {*}
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Случайная фигура в случайной ротации
     * @returns {*}
     */
    function getRandomFigure() {
        return Game.figures[getRandomInt(0, (Game.figures.length - 1))];
    }

    /**
     * Проверка что все ячейки заполнены
     * @param obj
     * @param value
     * @returns {*}
     */
    function checkValueInObject(obj, value) {
        for( let key in obj ) {
            if( obj.hasOwnProperty( key ) ) {
                if( obj[key] === value ) {
                    return key;
                }
            }
        }
        return false;
    }

    /*
     ------------/ DRAWS function------------
     */

    /**
     * Старт новой игры
     * @param mode
     */
    _self.newGame = function (mode) {

        if (Game.pause) {
            _self.pause();
        }

        gameReset();
        Game.gameOver = false;

        if (!music) {
            _self.Sound.music.play(music);
        }

        // очистка поля
        clear(opt.bucketWrapperId);
        clear(opt.bucketNextWrapperId);

        // figures
        Game.figures = Game.figures.concat(figuresList);

        // set trigger
        Game.next = true;

        document.querySelector('body').classList.remove('start');
        document.querySelector('#gameOver h5').style.display = 'none';
        document.querySelector('#bucketWrapper table').style.opacity = 1;
        document.querySelector('#gameOver').style.display = 'none';

        start();

    };


    /**
     * Start Game, основной цикл, начало новой фигуры
     */
    function start() {


        showScore();
        showLine();
        showHighScore();
        showTime();

        Game.interval.timer = setInterval(function(){
            if (!Game.pause) {
                showTime();
            }
        }, 1000);

        Game.interval.main = setInterval(function() {

            if (Game.next && !Game.pause && !Game.gameOver) {

                // установка уровня
                Game.count.level = 1 + Math.floor(Game.count.score/opt.levelUp);
                Game.frame.speed = opt.speed - (Game.count.level * opt.levelTime) + opt.levelTime;
                showLevel();

                // установка текущей и следующей фигуры
                if (Game.frame.figureNext.type.length > 0) {
                    Game.frame.figure.type = Game.frame.figureNext.type;
                    Game.frame.figure.cells = {};
                    Game.frame.figure.style = Game.frame.figureNext.style;
                } else {
                    // случайная фигура
                    Game.frame.figure.type = getRandomFigure();
                    //Game.frame.figure.type = figuresList[1];
                    Game.frame.figure.cells = {};
                    Game.frame.figure.style = blockStyle[getRandomInt(0, blockStyle.length-1)];
                    // случайный разворот
                    for (let i = 0, rotates = getRandomInt(1, 4); i < rotates; i++) {
                        Game.frame.figure.type = rotateFigure(Game.frame.figure.type);
                    }
                }

                // случайная следующая фигура
                Game.frame.figureNext.type = getRandomFigure();
                //Game.frame.figureNext.type = figuresList[1];
                Game.frame.figureNext.cells = {};
                Game.frame.figureNext.style = blockStyle[getRandomInt(0, blockStyle.length-1)];
                // случайный разворот
                for (let i = 0, rotates = getRandomInt(1, 4); i < rotates; i++) {
                    Game.frame.figureNext.type = rotateFigure(Game.frame.figureNext.type);
                }

                // отрисовка новой фигуры сверху
                clear(opt.bucketNextWrapperId);
                drawElement(opt.bucketNextWrapperId, Game.frame.figureNext.type, getCenter(4, Game.frame.figureNext.type.length), getCenter(5, Game.frame.figureNext.type[0].length), 0, 0, Game.frame.figureNext.style);
                // / случайная следующая фигура

                Game.frame.row = 1;
                Game.frame.col = getCenter(opt.col, Game.frame.figure.type[0].length);


                let offsets = drawInitOffset(Game.frame.figure.type);
                Game.frame.offsetRow = offsets.offsetRow;
                Game.frame.offsetCol = offsets.offsetCol;

                // отрисовка новой фигуры сверху
                if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                    eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                    Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.offsetRow, Game.frame.offsetCol, Game.frame.figure.style);
                }                
                nextFrame();
            }

        }, Math.round(opt.speed));
    }

    /**
     * Кадр
     */
    function nextFrame() {
        if (Game.frame.figure.type.length > 0) {
            Game.next = false;
            setTimeout(function() {
                //
                if(Game.pause) {
                    nextFrame();
                }

                else if(Game.interval.main && down()) {
                    nextFrame();
                }

                else {
                    if (Game.frame.speed < 50) {
                        _self.Sound.forceHit.play();
                    } else {
                        _self.Sound.slowHit.play();
                    }

                        // очки
                        Game.count.score += opt.score.figure[Game.frame.figure.type.length];
                        showScore();

                    // стирание заполненных линий
                    let count = 0;
                    for (let i = ((Game.frame.row - Game.frame.offsetRow) + Game.frame.figure.type.length) - 1; i >= Game.frame.row - Game.frame.offsetRow ; i--) {
                        if (typeof Game.fill[opt.bucketWrapperId][i-1] !== 'undefined' && !checkValueInObject(Game.fill[opt.bucketWrapperId][i-1], 0) ) {
                            lineDestroy(opt.bucketWrapperId, i);
                            i++;
                            count++;
                        }
                    }

                    if (count) {
                        _self.Sound.lineRemove.play();
                    }

                    Game.count.line += count;
                    Game.count.score += ((Game.count.level * opt.score.line) * count);
                    showLine();
                    showScore();

                    // следующая фигура
                    if (Game.frame.figure.type.length && Game.frame.row <= 2) {
                        gameOver();
                    } else {
                        Game.next = true;
                    }
                    return false
                }
            }, Math.round(Game.frame.speed));
        }
    }

    /**
     * Сброс игры
     */
    function gameReset() {

        // clear intervals
        if (Game.interval.main) {
            clearInterval(Game.interval.main);
            Game.interval.main = null;
        }
        if (Game.interval.timer) {
            clearInterval(Game.interval.timer);
            Game.interval.timer = null;
        }
        if (Game.interval.pause) {
            clearInterval(Game.interval.pause);
            Game.interval.pause = null;
        }

        Game.figures = [];

        // reset counter
        Game.count.element = 0;
        Game.count.line = 0;
        Game.count.timer = 0;
        Game.count.score = 0;
        Game.count.level = 1;

        // reset frame data
        Game.frame.row = 1;
        Game.frame.col = 1;
        Game.frame.figure.type = [];
        Game.frame.figure.cells = {};
        Game.frame.figureNext.type = [];
        Game.frame.figureNext.cells = {};
        Game.frame.speed = opt.speed;
        Game.frame.offsetRow = 0;
        Game.frame.offsetCol = 0;

        Game.pause = false;
        Game.next = true;
    }

    /**
     * gameOver
     */
    function gameOver() {
        Game.gameOver = true;
        let newHiScore = false;
        if (( localStorage.getItem(opt.highScoreVar) || 0) < Game.count.score ) {
            newHiScore = true;
            localStorage.setItem(opt.highScoreVar, Game.count.score);
        }
        showGameOver(newHiScore);
        gameReset();
    }

    _self.pause = function () {

        if (Game.gameOver) return;
        Game.pause = !Game.pause;
        _self.Sound.pause.play();
        if (!Game.pause) {
            _self.Sound.music.play();
            clearInterval(Game.interval.pause);
            document.querySelector('.pause').classList.remove('blink');
            document.querySelector('#bucketWrapper').classList.remove('blink');
        } else {
            _self.Sound.music.pause();
            document.querySelector('.pause').classList.add('blink');
            document.querySelector('#bucketWrapper').classList.add('blink');
            Game.interval.pause = setInterval(function(){
                document.querySelector('.pause').classList.toggle('blink');
                document.querySelector('#bucketWrapper').classList.toggle('blink');
            }, 300);
        }
    };

    /**
     * Init
     */
    _self.init = function (settings) {

        _self.Sound = new GAMES.tetrominos.audio();

        music = null;     

        document.onkeydown = controlDown;
        document.onkeyup = controlUp;
        document.onmousedown = disableclick;

        for (let op in settings) {
            if (opt.hasOwnProperty(op)) {
                opt[op] = settings[op];
            }
        }

        drawBucket(opt.bucketWrapperId, opt.row, opt.col);
        drawBucket(opt.bucketNextWrapperId, 4, 5);
    };

    /*
     ------------------SHOWS---------------
     */
    function showScore() {
        document.querySelector('#score .value').innerText = (('000000' + Game.count.score).slice(-6)).toString();
    }

    function showLevel() {
        document.querySelector('#level .value').innerText = ('00' + Game.count.level).slice(-3);
    }

    function showHighScore() {
        document.querySelector('#scoreHigh .value').innerText = ('000000' + (localStorage.getItem(opt.highScoreVar) || 0)).slice(-6);
    }

    function showLine() {
        document.querySelector('#line .value').innerText = ('000' + Game.count.line).slice(-4);
    }

    function showTime() {
        Game.count.timer++;
        let h = (Game.count.timer >= 3600) ? Math.floor(Game.count.timer / 3600) : 0;
        let m = (Game.count.timer >= 60) ? (Math.floor((Game.count.timer - h * 3600) / 60)) : 0;
        let s = Math.floor(Game.count.timer - (h * 3600 + m * 60));
        document.querySelector('#time .value').innerText = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
    }

    function showGameOver(newHiScore) {
        _self.Sound.music.stop();
        _self.Sound.gameover.play();
        if (newHiScore) {
            document.querySelector('#gameOver .value').innerText = localStorage.getItem(opt.highScoreVar);
            document.querySelector('#gameOver h5').style.display = 'block';
        }
        document.querySelector('#bucketWrapper table').style.opacity = 0.5;
        document.querySelector('#gameOver').style.display = 'block';
    }


    /*
     ------------------CONTROL events---------------
     */
    // key DOWN
    function controlDown(e) {
        e = e || window.event;
        if (e.keyCode == '40') {// down arrow
            e.preventDefault();
            down();
        }
        else if (e.keyCode == '38') {// up arrow
            e.preventDefault();
            rotate();
        }
        else if (e.keyCode == '37') {// left
            e.preventDefault();
            left();
        }
        else if (e.keyCode == '39') {// right
            e.preventDefault();
            right();
        }
        else if ((e.keyCode === 0 || e.keyCode === 32) && !Game.pause) {// space
            dropDown(e);
        }
        else if (e.keyCode == '80') {// right
            e.preventDefault();
            _self.pause();
        }
        else if (e.keyCode === 78 ) {// n
            _self.newGame();
        }
    }

    // key UP
    function controlUp(e) {}

    /*
     ------------------CONTROL actions---------------
     */
    /**
     * "Сброс" фигуры вниз
     */
    function dropDown(e) {
        e.preventDefault();
        down();
        Game.frame.speed = 30;
    }


    function disableclick(event) {
        if(event.button==2) {
            return false;
        }
    }

    return _self;

})();