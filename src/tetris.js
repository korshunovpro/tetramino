/**
 * @todo: привести типы в ячейках и проверке на заполнение в единый вид или bool или int
 */

let GAME = (function () {

    let _self = this;

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
            figure: 5,
            line: 30
        },
        highScoreVar: 'tetrisHighScore',
        //
        speed: 300
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
                cells: {}
            },
            figureNext: {
                type: [],
                cells: {}
            }
        },
        pause: false,
        next: true
    };

    /**
     * Список фигур
     * @type {[*]}
     */
    let figuresList = [
        [[1,1], [1,1]], // O

        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I

        [[0,1,1], [1,1,0], [0,0,0]], // S
        [[0,0,0], [1,1,0], [0,1,1]], // Z

        [[1,0,0], [1,1,1], [0,0,0]], // L
        [[0,0,0], [1,1,1], [0,0,1]], // J

        [[0,0,0], [1,1,1], [0,1,0]], // T
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
            Game.fill[bucketWrapperId] = {};
            let bucket = document.createElement('table');
            bucket.className = opt.bucketClassName;
            for (let i = 1; i <= row; i++) {
                Game.fill[bucketWrapperId][i] = {};
                lineAdd(bucketWrapperId, bucket, col, i);
            }
            document.getElementById(bucketWrapperId).appendChild(bucket);
            return true;
        }
        return false;
    }

    /**
     * Добавляет линию в таблицу, перед первым элементом
     * @param bucketWrapperId
     * @param table
     * @param col
     * @param rowIndex
     */
    function lineAdd(bucketWrapperId, table, col, rowIndex) {
        let row = document.createElement('tr');
        for (let i = 1; i <= col; i++) {
            Game.fill[bucketWrapperId][rowIndex][i] = false;
            let td = document.createElement('td');
            row.appendChild(td);
        }
        table.insertBefore(row, table.firstChild);
    }

    /**
     * Удаляет линию
     * @param table
     * @param el
     */
    function lineRemove(table, el) {
        table.removeChild(el);
    }

    /**
     * Удаляет и добавляет линию
     * @param table
     * @param el
     */
    function lineDestroy(table, el) {
        lineRemove(table, el);
        lineAdd(table, opt.col);
    }

    /**
     * Пустые строки сверху и столбцы слева при первой отрисовке фигуры
     * @param figure
     */
    function drawInitOffset(figure) {

        let setOffsetRow = false;
        let setOffsetCol = false;

        let offset = {
            offsetRow:0,
            offsetCol:0
        };

        // rows
        for (let i = 0; i < figure.length; i++) {
            // row offset
            if (figure[i].indexOf(1) >= 0 && !setOffsetRow && Game.frame.offsetRow < 1) {
                setOffsetRow = true;
                offset.offsetRow = i;
            }

            // cols
            for (let j = 0; j < figure[i].length; j++ ) {
                // col offset
                if (figure[i][j] == 1 && !setOffsetCol && Game.frame.offsetCol < 1) {
                    setOffsetCol = true;
                    offset.offsetCol = j;
                }
            }
        }
        return offset;
    }

    /**
     * @param bucketWrapperId
     * @param figure
     *
     * @todo: Проверка что новая позиция не попадает на клетки занятые текущей фигурой
     *
     * @returns {boolean}
     */
    function canDrawElement(bucketWrapperId, figure, row, col) {

        return true;
    }

    /**
     * Рисует элемент в основном стакане
     * @param bucketWrapperId
     * @param cells
     * @returns {*}
     */
    function drawElement(bucketWrapperId, cells) {

        return cells;
    }

    /**
     *
     * @param bucketWrapperId
     * @param y
     * @param x
     */
    function draw(bucketWrapperId, y, x) {
        let b = document.createElement('div');
        b.classList.add('block');
        document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + y + ')' + ' td:nth-child(' + x + ')').appendChild(b);
    }

    /**
     * Удаление блоков фигуры из ячейки
     * @param bucketWrapperId
     * @param cells
     */
    function eraseElement(bucketWrapperId, cells) {

        return cells;
    }

    /**
     * Поворачивает фигуру
     * @param figure
     * @returns {*}
     */
    function rotateFigure(figure) {
        /*SRS - rotation system, http://strategywiki.org/wiki/File:Tetris_rotation_super.png*/
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
    function rotate() {

    }

    function left() {

    }

    function right() {

    }

    function down() {

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
        return (count / 2 - Math.round(length / 2)) + 1;
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
     * Случайная фигура
     * @returns {*}
     */
    function getRandomFigure() {
        return Game.figures[getRandomInt(0, (Game.figures.length - 1))];
    }

    /*
     ------------/ DRAWS function------------
     */

    /**
     * Старт новой игры
     * @param mode
     */
    _self.newGame = function (mode) {

        gameReset();

        // figures
        Game.figures = Game.figures.concat(figuresList);

        // set trigger
        Game.next = true;
        Game.frame.figure.type = figuresList[1];//Game.figures[getRandomInt(0,1)];// getRandomFigure();
        //Game.frame.figure.type = rotateFigure(Game.frame.figure.type);

        //Game.frame.row++;
        //Game.frame.col++;

        // offsets(пустые строки сверху и столбцы слева, так как рисуем слева-направо и сверху-вниз) для новой фигуры
        console.log(Game.frame.row, Game.frame.col);
        console.log(Game.frame.figure.type);
        console.log(drawInitOffset(Game.frame.figure.type));

        //console.log(canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col))

        return;

        console.log(Game.frame.figure.type);
        console.log(cells);
        console.log(Game.frame.drawRowOffset);
        console.log(Game.frame.drawColOffset);
        console.log(canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells));

        if (canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells)) {
            drawElement(opt.bucketWrapperId,cells);
        }

        return;

        //start();
    };


    /**
     * Start Game
     */
    function start() {
    }

    function nextFrame() {
    }

    /**
     * Сброс игры
     */
    function gameReset() {

        // clear intervals
        if (Game.interval.main) {
            clearInterval(Game.interval.main);
        }
        if (Game.interval.timer) {
            clearInterval(Game.interval.timer);
        }
        if (Game.interval.pause) {
            clearInterval(Game.interval.pause);
        }

        // reset counter
        Game.count.element = 0;
        Game.count.line = 0;
        Game.count.timer = 0;
        Game.count.score = 0;

        // reset frame data
        Game.frame.row = 1;
        Game.frame.col = 1;
        Game.frame.figure.type = [];
        Game.frame.figure.cells = [];
        Game.frame.figureNext.type = [];
        Game.frame.figureNext.cells = [];
        Game.frame.speed = opt.speed;

        Game.pause = false;
    }

    function gameOver() {
        if ((localStorage.getItem(opt.highScoreVar) || 0) < Game.count.score) {
            localStorage.setItem(opt.highScoreVar, Game.count.score);
        }
    }

    /**
     * Init
     */
    _self.init = function (settings) {

        document.onkeydown = controlDown;
        document.onkeyup = controlUp;

        for (let op in settings) {
            if (opt.hasOwnProperty(op)) {
                opt[op] = settings[op];
            }
        }

        drawBucket(opt.bucketWrapperId, opt.row, opt.col);
        drawBucket(opt.bucketNextWrapperId, 4, 4);
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
        let h = (Game.count.timer > 3599) ? Math.round(Game.count.timer / 3600) : 0;
        let m = (Game.count.timer > 59) ? (Math.round((Game.count.timer - h * 3600) / 60)) : 0;
        let s = Math.round(((Game.count.timer - h * 3600) - m * 60));
        document.querySelector('#time .value').innerText = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
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
    }

    // key UP
    function controlUp(e) {
        e = e || window.event;
        if (e.keyCode == '40') {// down arrow
            speedNormal(e);
        }
    }

    /*
     ------------------CONTROL actions---------------
     */
    function dropDown(e) {
        e.preventDefault();
        Game.frame.speed = 30;
    }

    function speedNormal(e) {
        e.preventDefault();
        Game.frame.speed = opt.speed;
    }

    function speedUp(e) {
        e.preventDefault();
        if (Game.frame.speed > 50 && !Game.pause) {
            Game.frame.speed = Game.frame.speed / 4;
        }
    }

    return _self;

})();