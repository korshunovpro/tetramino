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
            figure: [0, 0, 4, 8, 6],
            line: 40
        },
        highScoreVar: 'tetrisHighScore',
        //
        speed: 500
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
        next: true,
        gameOver: false
    };

    /**
     * Список фигур
     * @type {[*]}
     */
    let figuresList = [
        [[1, 1], [1, 1]], // O

        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I

        [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
        [[0, 0, 0], [1, 1, 0], [0, 1, 1]], // Z

        [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // L
        [[0, 0, 0], [1, 1, 1], [0, 0, 1]], // J

        [[0, 0, 0], [1, 1, 1], [0, 1, 0]], // T
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
            Game.fill[bucketWrapperId][rowIndex][i] = 0;
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
     *
     * @returns {boolean}
     */
    function canDrawElement(bucketWrapperId, figure, row, col, currentFigureCells) {

        // rows
        for (let r = 0; r < figure.length; r++) {

            // row top/bottom
            if ((figure[r].indexOf(1) > -1 && (row + r) - Game.frame.offsetRow <= 0)
                || (figure[r].indexOf(1) > -1 && (row + r) - Game.frame.offsetRow > opt.row)
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
                if (figure[r][c] === 1 && Game.fill[bucketWrapperId][(row + r) - Game.frame.offsetRow][(col + c) - Game.frame.offsetCol] === 1
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
     * @returns {*}
     */
    function drawElement(bucketWrapperId, figure, row, col) {
        let cells = {};
        for (let r = 0; r < figure.length; r++) {
            // blocks
            for (let c = 0; c < figure[r].length; c++) {
                if (figure[r][c] === 1) {
                    draw(bucketWrapperId, (row + r) - Game.frame.offsetRow, (col + c) - Game.frame.offsetCol);

                    Game.fill[bucketWrapperId][(row + r) - Game.frame.offsetRow][(col + c) - Game.frame.offsetCol] = 1;

                    if (!cells[(row + r) - Game.frame.offsetRow]) cells[(row + r) - Game.frame.offsetRow] = {};
                    cells[(row + r) - Game.frame.offsetRow][(col + c) - Game.frame.offsetCol] = 1
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
        for (let r in cells) {
            for (let c in cells[r]) {
                document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + r + ')' + ' td:nth-child(' + c + ')').innerHTML = "";
                Game.fill[bucketWrapperId][r][c] = 0;
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
                document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + r + ')' + ' td:nth-child(' + c + ')').innerHTML = "";
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
    /**
     * Переворот фигуры
     */
    function rotate() {
        if (!Game.next) {
            let newRotate = rotateFigure(Game.frame.figure.type);
            if (canDrawElement(opt.bucketWrapperId, newRotate, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                Game.frame.figure.type = newRotate;
                Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
            }
        }

    }

    /**
     * Перемещение влево
     */
    function left() {
        if (!Game.next) {
            Game.frame.col--;
            if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
            } else {
                Game.frame.col++;
            }
        }
    }

    /**
     * Перемещение вправо
     */
    function right() {
        if (!Game.next) {
            Game.frame.col++;
            if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
            } else {
                Game.frame.col--;
            }
        }
    }

    /**
     * Перемещение вниз
     */
    function down() {
        Game.frame.row++;
        if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
            return true;
        } else {
            Game.frame.row--;
            return false;
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
     * Случайная фигура в случайной ротации
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

        // очистка поля
        clear(opt.bucketWrapperId);

        // set trigger
        Game.next = true;

        start();

    };


    /**
     * Start Game, основной цикл, начало новой фигуры
     */
    function start() {

        showHighScore();
        showTime();
        Game.interval.timer = setInterval(function(){
            if (!Game.pause) {
                showTime();
            }
        }, 1000);

        Game.interval.main = setInterval(function() {

            if (Game.next && !Game.pause && !Game.gameOver) {
                Game.frame.speed = opt.speed;

                // установка уровня
                showLevel();
                showLine();

                // установка текущей и следующей фигуры

                // случайная фигура
                Game.frame.figure.type = getRandomFigure();
                Game.frame.figure.cells = {};
                // случайный разворот
                for (let i = 0, rotates = getRandomInt(1, 4); i < rotates; i++) {
                    Game.frame.figure.type = rotateFigure(Game.frame.figure.type);
                }

                Game.frame.row = 1;
                Game.frame.col = getCenter(opt.col, Game.frame.figure.type.length);

                let offsets = drawInitOffset(Game.frame.figure.type);
                Game.frame.offsetRow = offsets.offsetRow;
                Game.frame.offsetCol = offsets.offsetCol;

                // отрисовка новой фигуры сферху
                if (canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col, Game.frame.figure.cells)) {
                    eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
                    Game.frame.figure.cells = drawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
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
                if(Game.pause) {
                    nextFrame();
                }
                if(down()) {
                    nextFrame();
                } else {
                    // очки
                    Game.count.score += opt.score.figure[Game.frame.figure.type.length];
                    showScore();

                    Game.next = true;
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
        Game.frame.offsetRow = 0;
        Game.frame.offsetCol = 0;

        Game.pause = false;
        Game.gameOver = false;
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
    function controlUp(e) {}

    /*
     ------------------CONTROL actions---------------
     */
    /**
     * "Сброс" фигуры вниз
     */
    function dropDown(e) {
        e.preventDefault();
        Game.frame.speed = 30;
    }

    return _self;

})();