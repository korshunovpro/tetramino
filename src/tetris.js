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
        fill:{},
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
            figure: {
                type: [],
                cells: []
            },
            figureNext: {
                type:[],
                cells:[]
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
        ['0000', '0110', '0110', '0000'],
        ['0000', '1111', '0000', '0000'],

        ['0000', '0011', '0110', '0000'],
        ['0000', '0110', '0011', '0000'],

        ['0000', '0111', '0100', '0000'],
        ['0000', '0111', '0001', '0000'],

        ['0000', '0111', '0010', '0000'],
    ];


    /*
     ------------DRAWS function------------
     */

    /**
     * Рисует таблицу-стакан
     * @param bucketWrapperId
     * @param row
     * @param col
     * @param fill
     * @returns {boolean}
     */
    function drawBucket(bucketWrapperId, row, col, fill) {
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
     * Рисует элемент в основном стакане
     * @param bucketWrapperId
     * @param cells
     * @returns {*}
     */
    function drawElement(bucketWrapperId, cells) {
        for (let row in cells) {
            if (cells.hasOwnProperty(row))  {
                if (cells[row]) {
                    for (let col of cells[row]) {
                        Game.fill[bucketWrapperId][row][col] = true;
                        draw(bucketWrapperId, row, col)
                    }
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
    function draw (bucketWrapperId, y, x) {
        let b = document.createElement('div');
        b.classList.add('block');
        document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + y + ')' + ' td:nth-child(' + x + ')').appendChild(b);
    }

    /**
     * Проверка возможности отрисовать элемент
     * @param bucketWrapperId
     * @param figure
     * @param row
     * @param col
     * @returns {*}
     */
    function canDrawElement(bucketWrapperId, figure, row, col) {

        let count = figure.length;

        //проверка линий снизу вверх, для отрисовки фигуры
        row = (row+figure.length-1 > opt.row) ? opt.row : row+figure.length-1;

        // if (figure[figure.length-1].indexOf('1') < 0) figure.pop();
        // Game.frame.figure.type = figure;

        let cells = {};
        for (let i = figure.length-1; i >= 0; i--) {
            let rowCol = col;
            if (row > opt.row) return false;

            let line = figure[i];
            line = line.split('');

            cells[row] = [];
            for (let bl of line) {
                if (rowCol > opt.col || rowCol < 1) return false;

                if (bl == 1) {
                    if (
                        ( (typeof Game.frame.figure.cells[row] === "undefined") || Game.frame.figure.cells[row][rowCol] === false)
                        && (typeof Game.fill[bucketWrapperId][row] !== "undefined" && Game.fill[bucketWrapperId][row][rowCol] === true)
                    ) {
                        cells = null;
                        return false;
                    }
                    cells[row].push(rowCol);
                }
                rowCol++;
            }
            row--;
        }
        return cells;
    }

    /**
     * Удаление блоков фигуры из ячейки
     * @param bucketWrapperId
     * @param cells
     */
    function eraseElement(bucketWrapperId, cells) {
        for (let row in cells) {
            if (cells.hasOwnProperty(row))  {
                if (cells[row]) {
                    for (let col of cells[row]) {
                        Game.fill[bucketWrapperId][row][col] = false;
                        document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + row + ')' + ' td:nth-child(' + col + ')').innerHTML = "";
                    }
                }
            }
        }
        return cells;
    }

    /**
     * Переворачивает фигуру count раз
     * @param figure
     * @returns {*}
     */
    function rotateFigure(figure) {

        let col = figure[0].length;
        let row = figure.length;
        let rotateFigure = [];

        for (let r = row-1; r >= 0 ; r--) {
            for (let c = 0; c < col; c++) {
                let line = figure[r].split('');
                if (row == 4) {
                    let l = line.shift();
                    line.push(l);
                }
                (!rotateFigure[c]) ? rotateFigure[c] = line[c].toString() : rotateFigure[c] += line[c].toString();
            }
        }
        return rotateFigure;
    }

    /*
     ------------------draw helpers---------------
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
        if (mode != 'classic') {
            Game.figures = Game.figures.concat(figuresListExt);
        }

        // set trigger
        Game.next = true;
        Game.frame.figure.type = getRandomFigure();

        // Game.frame.row++;
        // Game.frame.col++;

        if (Game.frame.figure.cells = canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col)) {
            drawElement(opt.bucketWrapperId, Game.frame.figure.cells);
        }

        //start();
    };


    /**
     * Start Game
     */
    function start() {}

    function nextFrame() {}

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
            if(opt.hasOwnProperty(op)) {
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
        let h = (Game.count.timer > 3599) ? Math.round(Game.count.timer/3600) : 0;
        let m = (Game.count.timer > 59) ? (Math.round((Game.count.timer - h*3600)/60)) : 0;
        let s = Math.round(((Game.count.timer - h*3600) - m*60));
        document.querySelector('#time .value').innerText = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':'+ ('0' + s).slice(-2) ;
    }


    /*
     ------------------CONTROL events---------------
     */
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
        else if ( (e.keyCode === 0 || e.keyCode === 32) && !Game.pause) {// space
            dropDown(e);
        }
    }

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


    function left() {
        Game.frame.col--;

        let cells = canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
        if (cells) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            Game.frame.figure.cells = cells;
            drawElement(opt.bucketWrapperId, Game.frame.figure.cells);
        } else {
            Game.frame.col++
        }
    }

    function right() {
        Game.frame.col++;
        let cells = canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
        if (cells) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            Game.frame.figure.cells = cells;
            drawElement(opt.bucketWrapperId, Game.frame.figure.cells);
        } else {
            Game.frame.col--
        }
    }

    function down() {
        Game.frame.row++;
        if (Game.frame.row > opt.row) {
            Game.frame.row = opt.row;
        }
        let cells = canDrawElement(opt.bucketWrapperId, Game.frame.figure.type, Game.frame.row, Game.frame.col);
        if (cells) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            Game.frame.figure.cells = cells;
            drawElement(opt.bucketWrapperId, Game.frame.figure.cells);
        } else {
            Game.frame.row--
        }
    }

    /**
     * Rotate
     */
    function rotate() {
        if (Game.frame.row < 2 && Game.frame.figure.type[0].indexOf('111') >= 0) return false;

        let rotate = rotateFigure(Game.frame.figure.type, 1);

        let cells = canDrawElement(opt.bucketWrapperId, rotate, Game.frame.row, Game.frame.col);
        if (cells) {
            Game.frame.figure.type = rotate;
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            Game.frame.figure.cells = cells;
            drawElement(opt.bucketWrapperId, Game.frame.figure.cells);
        }
    }

    return _self;

})();