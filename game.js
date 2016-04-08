
var width = 1200;
var height = 800;

var snapX = 50;
var snapY = 50;

var tilePatterns = [
    { width: 4, height: 1, pattern: "xxxx" },
    { width: 3, height: 2, pattern: "xx  xx"},
    { width: 3, height: 2, pattern: " xxxx "},
    { width: 2, height: 2, pattern: "xxxx" },
    { width: 3, height: 2, pattern: "xxxx  "},
    { width: 3, height: 2, pattern: "xxx  x"},
    { width: 3, height: 2, pattern: "xxx x "}
];

var digits = {};
var rts = {};

var style = { font: "36px Arial", fill: "#ffffff", align: "center", fontWeight: "bold" };
var styleSmall = { font: "8px Arial", fill: "#5555ff", align: "center" };

var rotationDetails = {};
var grid = {};
var tiles = [];
var gridBounds = [ 3, 3, 19, 11 ];
var scoreText;

var distance = 400;
var speed = 3;
var star;
var texture1;
var texture2;

var bgIncrement = 0.0;

var max = 100;
var xx = [];
var yy = [];
var zz = [];
var sprites = [];
var backgroundSprite;
var line;
window.onload = function() {
    var game = new Phaser.Game(width, height, Phaser.AUTO, 'Sudokris', { preload: preload,
        create: create, update: update });

    function preload () {
        game.load.image('logo', 'phaser.png');
        game.load.image('tinystar', 'star2.png');
        //game.load.image('star', 'star2.png');
    }

    function create () {
        star = game.make.sprite(0, 0, 'tinystar');
        texture1 = game.add.renderTexture(width, height, 'texture1');
        texture2 = game.add.renderTexture(width, height, 'texture2');

        backgroundSprite = game.add.sprite(width/2, height/2, texture1);
        backgroundSprite.alpha = 0.91;
        backgroundSprite.scaleX = backgroundSprite.scaleY = 1.0;
        backgroundSprite.anchor.x = 0.5;
        backgroundSprite.anchor.y = 0.5;




        //backgroundSprite.alphs = 0.5;
        //backgroundSprite.angle = 1.1;


        for (var i = 0; i < max; i++)
        {
            xx[i] = Math.floor(Math.random() * width) - width/2;
            yy[i] = Math.floor(Math.random() * height) - height/2;
            zz[i] = Math.floor(Math.random() * 1700) - 100;
            sprites[ i ] = game.make.sprite(3, 3, 'tinystar') ;
            sprites[i].tint = Math.random() * 0xffffff
            sprites[i].scale.setTo( 0.5 + 2*Math.random() );
        }

        var logo = game.add.sprite(50, 50, 'logo');
        logo.anchor.setTo(0, 0);
        logo.inputEnabled = true;
        logo.events.onInputDown.add( jump, logo );
        logo.scale.setTo( 0.25 );

        var data = [ 'E' ]; // 333 ', ' 777 ', 'E333E', ' 333 ', ' 3 3 ' ];
        var bob = game.create.texture('bob', data);

        scoreText = game.add.text( width*0.45, 40, "0", style );


        var sx = gridBounds[0]*snapX;
        var sy = gridBounds[1]*snapY;
        var ex = (gridBounds[2])*snapX - snapX/2;
        var ey = (gridBounds[3]-1)*snapY;
        var graphics = game.add.graphics(0,0);
        graphics.lineStyle(2, 0x0000FF, 1);
        graphics.drawRect(sx,sy,ex,ey);


    }

    function updateBackground(score) {

        var tmp = texture1;
        texture1 = texture2;
        texture2 = tmp;
        backgroundSprite.setTexture(texture1);
        //texture2.renderXY( backgroundSprite, width/2, height/2 );

        bgIncrement += 0.002;
        backgroundSprite.scale.x = backgroundSprite.scale.y  = 1.0040 + Math.sin(bgIncrement) * 0.0035;
        backgroundSprite.rotation = Math.cos(bgIncrement/3.0) * 0.0021;
        for (var i = 0; i < max; i++) {
            var perspective = distance / (distance - zz[i]);
            var x = game.world.centerX + xx[i] * perspective;
            var y = game.world.centerY + yy[i] * perspective;

            zz[i] += speed;

            if (zz[i] > 300) {
                xx[i] = Math.random()*width - width/2;
                yy[i] = Math.random()*height - height/2;
                zz[i] -= 600;
            }

            texture1.renderXY( sprites[i], x, y );

        } //for


        texture2.renderXY( backgroundSprite, width/2, height/2, true );
        //texture2.renderXY( backgroundSprite, width*Math.sin(bgIncrement), width*Math.cos(bgIncrement), false);
        texture2.renderXY( backgroundSprite, width/2, height/2, false);
        //outputSprite.setTexture(texture);
    }

    function rotateTile(item,obj) {
        console.log("rotateTile: ", item, obj);
        item.angle -= 90;
        if ( checkCollision(item, item.x, item.y ) ) {
            item.angle += 90;
            return;
        } //

        clearGrid( item );

        for ( var childIndex in item.children ) {
            var child = item.children[ childIndex ];
            child.angle += 90;
        } //for

        updateGrid(item);
    }

    function jump(event) {
        var tile = makeNumberTile( game.rnd.pick(tilePatterns) );
        tile.x = width/2;
        tile.y = snapY;
    }

    function startDrag(item) {
        item.dragStartX = item.x;
        item.dragStartY = item.y;
    }

    function fixLocation(item) {
        var dx = item.x - item.dragStartX;
        var dy = item.y - item.dragStartY;

        if ( (dx*dx + dy*dy) < 10 ) {
            item.x = snapX*(Math.round(item.dragStartX/snapX));
            item.y = snapY*(Math.round(item.dragStartY/snapY));
            rotateTile(item,dx);
            return;
        } //

        var xp = Math.round(item.x/snapX);
        var yp = Math.round(item.y/snapY);

        var fixedX = snapX*(Math.round(item.x/snapX));
        var fixedY = snapY*(Math.round(item.y/snapY));

        var sb = false;
        for ( var childIndex in item.children ) {
            var child = item.children[ childIndex ];
            var pox = getRealPos( child );
            console.log( "pox: ", pox );
            var tx = pox.x/snapX;
            if ( tx < gridBounds[0] || tx > gridBounds[2] ) sb = true;

            var ty = pox.y/snapY;
            if ( ty < gridBounds[1] || ty > gridBounds[3] ) sb = true;
        } //for




        if ( !sb && checkCollision( item, fixedX, fixedY ) ) sb = true;

        if ( sb ) {
            fixedX = item.dragStartX;
            fixedY = item.dragStartY;
        } //

        if ( !sb ) clearGrid(item );

        if ( sb ) moveItem( item, fixedX, fixedY, item.x, item.y );
        else {//else moveItem( item, fixedX, fixedY, item.x, item.y );
            item.x = fixedX;
            item.y = fixedY;
        } //
        if ( !sb ) updateGrid(item);
        console.log( "x-y: ", fixedX + "," + fixedY );
    }

    function moveItem( item, tx, ty, sx, sy ) {
        item.x = sx;
        item.y = sy;
        game.add.tween(item).to( { x: tx }, 200, "Linear", true);
        game.add.tween(item).to( { y: ty }, 200, "Linear", true);
    } //

    function getRealPos( item ) {
        var matrix = new Phaser.Matrix( Math.cos(item.parent.rotation), Math.sin(item.parent.rotation),
            -Math.sin(item.parent.rotation), Math.cos(item.parent.rotation),
        item.parent.x, item.parent.y );
        transformedChildPosition = matrix.apply( item.position );
        return transformedChildPosition;
    }

    function checkCollision( item, xp, yp ) {
        xp = Math.round(xp/snapX);
        yp = Math.round(yp/snapY);
        var sb = false;
        var matrix = new Phaser.Matrix( Math.cos(item.rotation), Math.sin(item.rotation),
            -Math.sin(item.rotation), Math.cos(item.rotation) );
        for ( var childIndex in item.children ) {
            var child = item.children[childIndex];
            var transformedChildPosition = matrix.apply( child.position );
            var cxp = xp + Math.round((transformedChildPosition.x)/snapX); //child.tilePos.x;
            var cyp = yp + Math.round((transformedChildPosition.y)/snapY); //child.tilePos.y;

            if ( grid[cxp]  && grid[cxp][cyp] != null ) {
                if ( grid[cxp][cyp].tile && grid[cxp][cyp].tile.parent !== item ) {
                    sb = true;
                }
            }
        } //for childIndex
        return sb;

    }

    function updateGrid( item ) {
        var xp = Math.round(item.x/snapX);
        var yp = Math.round(item.y/snapY);
        var matrix = new Phaser.Matrix( Math.cos(item.rotation), Math.sin(item.rotation),
            -Math.sin(item.rotation), Math.cos(item.rotation) );
        for (var childIndex in item.children) {
            var child = item.children[childIndex];
            var transformedChildPosition = matrix.apply( child.position );
            var cxp = xp + Math.round((transformedChildPosition.x)/snapX); //child.tilePos.x;
            var cyp = yp + Math.round((transformedChildPosition.y)/snapY); //child.tilePos.y;
            if (!grid[cxp]) grid[cxp] = {};
            if (!grid[cxp][cyp]) grid[cxp][cyp] = {};
            grid[cxp][cyp].tile = child;
        } //
    } //

    function clearGrid(item ) {
        for ( var gxi in grid ) {
            for ( var gyi in grid[gxi] ) {
                var gp = grid[gxi][gyi];
                if ( !gp || !gp.tile || !gp.tile.parent ) continue;

                if ( gp.tile.parent === item) {
                    gp.tile = undefined;
                } //if
            } //for
        } //for
    }

    function update() {
        var score = 0;
        for ( var i = gridBounds[0]; i < gridBounds[2]; i++ ) {
            for ( var j = gridBounds[1]; j < gridBounds[3]; j++ ) {
                var gp = undefined;
                if ( !grid[i] ) grid[i] = {};
                if ( !grid[i][j] ) grid[i][j] = {};
                gp = grid[i][j];

                if ( gp ) {
                    gp.score = 0.0;
                    if (gp.tile) {
                        //gp.display.text = gp.tile.text;
                        gp.score = scoreTile( i, j, gp.tile );
                        score += gp.score;

                        var adjScore = 4 - gp.score;

                        if ( adjScore < 0 && !gp.tile.shake ) {
                            gp.tile.shake = {x:gp.tile.x,y:gp.tile.y};
                        } else if ( adjScore >= 0 && gp.tile.shake ) {
                            gp.tile.x = gp.tile.shake.x;
                            gp.tile.y = gp.tile.shake.y;
                            gp.tile.shake = undefined;
                        } //else if
                        //
                        //
                        if ( gp.tile.shake ) {
                            //gp.tile.x = gp.tile.shakeX + (Math.random()*adjScore - adjScore/2);
                        } //if

                    } //
                } //if
            } //
        } //
        if ( scoreText ) scoreText.text = score;
        updateBackground( score );
    } //



    function scoreTile( x, y, tile ) {
        if ( x < gridBounds[0] || x > gridBounds[2] ) return 0;
        if ( y < gridBounds[1] || y > gridBounds[3] ) return 0;

        var score = 0;
        //check the row
        for ( var i = -8; i <= 8; i++ ) {
            var cx = x + i;

            if ( cx < gridBounds[0] || cx > gridBounds[2] ) continue;

            if ( i == 0 || !grid[cx]  || !grid[cx][y] || !grid[cx][y].tile ) continue;


            ds = ( grid[cx][y].tile.text == tile.text ) ? -(10 - Math.abs(i)) : 1;

            score += ds; //**Math.sign(ds);

        } //

        //check the column
        for ( var i = -8; i <= 8; i++ ) {
            var cy = y + i;

            if ( cy < gridBounds[1] || cy > gridBounds[3] ) continue;

            if ( i == 0 || !grid[x]  || !grid[x][cy] || !grid[x][cy].tile ) continue;

            ds = ( grid[x][cy].tile.text == tile.text ) ? -(10 - Math.abs(i)) : 1;

            score += ds; //*ds*Math.sign(ds);

        } //

        //check the cell
        for ( var i = -2; i <= 2; i++ ) {
            var cx = x + i;
            if ( cx < gridBounds[0] || cx > gridBounds[2] ) continue;
            for ( var j = -2; j <= 2; j++ ) {
                if ( i == 0 && j == 0 ) continue;
                var cy = y + j;
                if ( cy < gridBounds[1] || cy > gridBounds[3] ) continue;
                if ( !grid[cx]  || !grid[cx][cy] || !grid[cx][cy].tile ) continue;

                var distance = Math.sqrt( i*i + j*j );

                var ds = ( grid[cx][cy].tile.text == tile.text ) ? -2*(10-distance) : 2;

                score += Math.round(ds);
            }
        }

        return score;
    } //

    function makeNumberTile(pattern) {
        var object = game.add.sprite( width/2, 50, 'bob' );
        object.alpha = 0.8;
        object.inputEnabled = true;
        object.input.enableDrag(false, true);
        object.input.useHandCursor = true;
        object.input.priorityID = 10;
        object.events.onDragStart.add( startDrag );
        object.events.onDragStop.add( fixLocation );

        object.anchor.x = 0.0;
        object.anchor.y = 0.0;
        var result = "";

        style["backgroundColor"] = createDarkColor();

        var bag = randomBag(1,9);

        console.log( "bag: ", bag );

        for ( var i = 0; i < pattern.pattern.length; i++ ) {
            var c = pattern.pattern.charAt(i);
            var yp = Math.floor(i/pattern.width); // - Math.floor(pattern.width/2);
            var xp = i % pattern.width; // - Math.floor(pattern.height/2);
            if ( c == ' ' ) continue;

            var text = game.make.text( xp*snapX, yp*snapY, "" + bag.pop(), style );
            text.tilePos = {};
            text.tilePos.x = xp;
            text.tilePos.y = yp;
            text.parent = object;
            text.priority = 10;
            text.anchor.x = 0.0;
            text.anchor.y = 0.0;
            object.addChild( text );
        } //

        object.backgroundColor = 0x3344DD;

        return object;
    }

    function randomBag(start,end) {
        var result = [];

        for ( var i = start; i <= end; i++ ) {
            result.push(i);
        } //

        for ( var i = 1; i < (end-start)*3; i++ ) {
            var i1 = rr( 0, end-start );
            var i2 = rr( 0, end-start );
            var tmp = result[i1];
            result[i1] = result[i2];
            result[i2] = tmp;
        } //for

        return result;
    }

    function rr(start,end) {
        return start + Math.round(Math.random()*(end-start));
    }

    function createDarkColor() {
        var cc = "#";

        for ( var i = 0; i < 6; i++ ) {

            var ce = 2 + Math.round(Math.random()*6);
            cc += ce;
        } //
        return cc;
    }
};


