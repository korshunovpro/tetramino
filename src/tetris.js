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
        ['11', '11'], // O
        ['0000', '1111', '0000', '0000'], // I

        ['011', '110', '000'], // S
        ['000', '110', '011'], // Z

        ['100', '111', '000'], // L
        ['000', '111', '001'], // J

        ['000', '111', '010'], // T
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
     * "Призрак" нарисованной фигуры, если находится в краях, то пустые клетки- в минус
     * @param figure
     * @param row
     * @param col
     *
     * @todo: внимательно посмотреть и переписать!
     *
     * @returns {{}}
     */
    function drawPrototype(figure, row, col) {
        let cells = {};
        let fillRow = false;
        let fillCol = 0;
        for (let i = 0, j = 2; i < figure.length; i++) {

            let blockRow = row;
            let blockRowCol = col;
            let line = figure[i].split('');

            if (row < 2 && !fillRow && figure[i].indexOf('1') < 0) {
                blockRow = row - j;
                j++;
            } else {
                fillRow = true;
                blockRow = row;
                row++;
            }

            blockRow = quote(blockRow);
            cells[blockRow] = {};

            for (let bl of line) {
                if (bl == 1) {
                    fillCol = true;
                    cells[blockRow][blockRowCol] = 1;
                }
                else {
                    cells[blockRow][blockRowCol] = 0;
                }
                blockRowCol++;
            }
        }

        // sort by keys
        let sortKeys = Object.keys(cells).sort(keySort);
        let sortCells = {};
        for (let k of sortKeys) {
            sortCells[k] = cells[k];
        }
        return sortCells;
    }

    /**
     *
     * @param bucketWrapperId
     * @param cells
     * @param currentCells
     * @returns {boolean}
     */
    function canDrawElement(bucketWrapperId, cells, currentCells) {
        if (Game.frame.col < 1) return false;
        for (let row in cells) {
            for (let col in cells[row]) {
                let rowInt = unquote(row);
                let colInt = unquote(col);
                if (rowInt >= 1 && colInt >= 1 && cells[row][col] === 1) {
                    if (rowInt <= opt.row || colInt < opt.col) {
                        if ( Game.fill[bucketWrapperId][rowInt][colInt] === false || (Game.fill[bucketWrapperId][rowInt][colInt] !== false && currentCells[row][col] === 1) ) {
                            continue;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Рисует элемент в основном стакане
     * @param bucketWrapperId
     * @param cells
     * @returns {*}
     */
    function drawElement(bucketWrapperId, cells) {
        for (let row in cells) {
            for (let col in cells[row]) {
                let rowInt = unquote(row);
                let colInt = unquote(col);

                if (rowInt >= 1 && colInt >= 1 && cells[row][col] === 1) {
                    Game.fill[bucketWrapperId][rowInt][colInt] = true;
                    draw(bucketWrapperId, rowInt, colInt);
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
        for (let row in cells) {
            for (let col in cells[row]) {
                let rowInt = unquote(row);
                let colInt = unquote(col);

                if (rowInt >= 1 && colInt >=1) {
                    Game.fill[bucketWrapperId][rowInt][colInt] = false;
                    document.querySelector('#' + bucketWrapperId + ' tr:nth-child(' + rowInt + ')' + ' td:nth-child(' + colInt + ')').innerHTML = "";
                }
            }
        }
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
        let rotateFigure = figure;

        for (let l = 0; l < 1; l++) {
            rotateFigure = [];
            for (let r = row-1; r >= 0 ; r--) {
                for (let c = 0; c < col; c++) {
                    let line = figure[r].split('');
                    (!rotateFigure[c]) ? rotateFigure[c] = line[c].toString() : rotateFigure[c] += line[c];
                }
            }
        }
        return rotateFigure;
    }

    /*
     ----------- MOVE -----------
     */
    function rotate() {
        let rotate = rotateFigure(Game.frame.figure.type);
        let cells = drawPrototype(rotate, Game.frame.row, Game.frame.col);
        if(canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells)) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            drawElement(opt.bucketWrapperId, cells);
            Game.frame.figure.type = rotate;
            Game.frame.figure.cells = cells;
        } else {
            Game.frame.col++;
        }
    }

    function left() {
        Game.frame.col--;
        let cells = drawPrototype(Game.frame.figure.type, Game.frame.row, Game.frame.col);
        if(canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells)) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            drawElement(opt.bucketWrapperId, cells);
            Game.frame.figure.cells = cells;
        } else {
            Game.frame.col++;
        }
    }

    function right() {
        Game.frame.col++;
        let cells = drawPrototype(Game.frame.figure.type, Game.frame.row, Game.frame.col);
        if(canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells)) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            drawElement(opt.bucketWrapperId, cells);
            Game.frame.figure.cells = cells;
        } else {
            Game.frame.col--;
        }
    }

    function down() {
        Game.frame.row++;
        let cells = drawPrototype(Game.frame.figure.type, Game.frame.row, Game.frame.col);
        if(canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells)) {
            eraseElement(opt.bucketWrapperId, Game.frame.figure.cells);
            drawElement(opt.bucketWrapperId, cells);
            Game.frame.figure.cells = cells;
        } else {
            Game.frame.row--;
        }
    }

    /*
     ----------- / MOVE -----------
     */

    /*
     ------------------draw helpers---------------
     */

    function keySort(a, b) {
        return unquote(a) > unquote(b);
    }

    function quote(val) {
        return '"' + val + '"';
    }

    function unquote(val) {
        return parseInt(val.replace(/\"/gi, ''))
    }

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
        Game.frame.figure.type = figuresList[0];//Game.figures[getRandomInt(0,1)];// getRandomFigure();
        //Game.frame.figure.type = getRandomFigure();

        console.log(Game.frame.figure.type);
        console.log(rotateFigure(Game.frame.figure.type));
        console.log(rotateFigure(rotateFigure(Game.frame.figure.type)));
        console.log(rotateFigure(rotateFigure(rotateFigure(Game.frame.figure.type))));
        console.log(rotateFigure(rotateFigure(rotateFigure(rotateFigure(Game.frame.figure.type)))));

        return;




        let cells = drawPrototype(Game.frame.figure.type, Game.frame.row, Game.frame.col);
        console.log(cells)
        if(canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells)) {
            Game.frame.figure.cells = cells;
            drawElement(opt.bucketWrapperId, cells);
        }



        //Game.frame.figure.type = rotateFigure(Game.frame.figure.type);


        cells = rotateFigure(cells);

        if(canDrawElement(opt.bucketWrapperId, cells, Game.frame.figure.cells)) {
            drawElement(opt.bucketWrapperId, cells);
            Game.frame.figure.cells = cells;
        }

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