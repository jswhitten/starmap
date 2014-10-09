var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("map").appendChild( renderer.domElement );

var lastMouseX = 0;
var lastMouseY = 0;
var mouseDown = false;

document.addEventListener( 'mousemove', onMouseMove, false );
document.addEventListener( 'mousewheel', onMouseWheel, false );
document.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
document.addEventListener( 'mousedown', onMouseDown, false );
document.addEventListener( 'mouseup', onMouseUp, false );

init();
render();

// load stars from web service and plot them
function init() {
    camera.position.z = 40;

    $.getJSON('http://starmap.whitten.org/api/stars?xmin=-50&xmax=50&ymin=-100&ymax=100&zmin=-20&zmax=20', function (data) {
        var t = data.data;
        var start = window.performance.now();
        for(i = 0; i < t.length; i++) {
            x = -t[i].Y;
            y = t[i].X;
            z = t[i].Z;
            m = t[i].AbsMag;
            for (var s = ' ', j = 0; j < 3 && (s == ' ' || s == 'D'); j++) {
                s = t[i].Spectrum.substring(0,1).toUpperCase();
            }
            if(0 && s == ' ' && m > 8) {
                s = 'M'; // FIXME: probably a red dwarf, but it might be a white dwarf that will make Sirius look weird
            }
        
            addStar(x,y,z,m,s);
        }
        var end = window.performance.now();
        var time = end - start;
        console.log("Added " + i + " stars in " + time + " ms");
    });

    updateHUD();
}


// place a star
function addStar(x, y, z, m, s) {
    var size = 0.2 - m * 0.01;
    var star_color = 0xffffff, halo_color = 0xaaaaaa;

    // FIXME: do this better
    switch(s) {
        case "O":
            star_color = 0xaaccff;
            halo_color = 0x0000ff;
            break;
        case "B":
            star_color = 0xccccff;
            halo_color = 0x0000ff;
            break;
        case "A":
            star_color = 0xffffff;
            halo_color = 0xffffff;
            break;
        case "F":
            star_color = 0xffffff;
            halo_color = 0xffffcc;
            break;
        case "G":
            star_color = 0xffffcc;
            halo_color = 0xe6e61a;
            break;
        case "K":
            star_color = 0xffffcc;
            halo_color = 0xe6941a;
            break;
        case "M":
            star_color = 0xffddcc;
            halo_color = 0xff0000;
            break;
    }
    var segments = 32;
    var material = new THREE.MeshBasicMaterial( { color: star_color, side: THREE.DoubleSide } );
    var geometry = new THREE.CircleGeometry( size, segments );
    var star = new THREE.Mesh( geometry, material );

    // place the star
    scene.add( star );
    star.position.set(x, y, z)
    
    // place the star's halo
    // FIXME: can we do this without a sprite?
    var spriteMaterial = new THREE.SpriteMaterial( 
    { 
        map: new THREE.ImageUtils.loadTexture( 'images/glow.png' ), 
        useScreenCoordinates: false, 
        color: halo_color, transparent: true, blending: THREE.AdditiveBlending
    });
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(size*8, size*8, size*8);
    star.add(sprite);
}

function onMouseMove(event) {
    event.preventDefault();

    if(mouseDown) {
        var diffMouseX = (lastMouseX - event.clientX);
        var diffMouseY = (event.clientY - lastMouseY);

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        camera.position.x += 0.01 * (diffMouseX);
        camera.position.y += 0.01 * (diffMouseY);

        updateHUD();
    }
}

function onMouseWheel(event) {
    event.preventDefault();

    var delta = event.detail ? event.detail*(-120) : event.wheelDelta

    camera.position.z -= delta * 0.01;

    updateHUD();
}

function onMouseDown(event) {
    event.preventDefault();

    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function onMouseUp(event) {
    event.preventDefault();

    mouseDown = false;
}

function updateHUD() {
    $("#hud_x").text(camera.position.x.toFixed(2));
    $("#hud_y").text(camera.position.y.toFixed(2));
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

