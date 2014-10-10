var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("map").appendChild( renderer.domElement );

var lastMouseX = 0;
var lastMouseY = 0;
var mouseDown = false;
var lastMouseDown = 0;
var projector = new THREE.Projector();
var objects = [];

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
        for(var i = 0; i < data.length; i++) {
            var x = -t[i].Y;
            var y = t[i].X;
            var z = t[i].Z;
            var m = t[i].AbsMag;
            var spec = t[i].Spectrum.trim();
            for (var s = '', j = 0; j < 4 && (s == '' || s == 'D'); j++) {
                s = spec.substring(j,1).toUpperCase();
            }
            if(0 && s == '' && m > 8) {
                s = 'M'; // FIXME: probably a red dwarf, but it might be a white dwarf that will make Sirius look weird
            }

            var id = t[i].StarId;

            addStar(x,y,z,m,s,id);
        }
        var end = window.performance.now();
        var time = end - start;
        console.log("Added " + i + " stars in " + time + " ms");
    });

    updateHUD();
}


// place a star
function addStar(x, y, z, m, s, i) {
    var size = 0.35 - m * 0.025;
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
    star.position.set(x, y, z);
    star.name = i;
    objects.push( star );
    
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

function starName(s) {
    var n = "Unknown";
    if(s.ProperName) {
        n = s.ProperName;
    } else if(s.BayerFlam) {
        if(s.BayerFlam.substring(2, 1) == ' ') {
            n = s.BayerFlam.substring(0, 2) + ' ' + s.BayerFlam.substring(6);
        } else {
            n = s.BayerFlam.substring(3);
        }
    } else if(s.Gliese) {
        n = s.Gliese; 
    } else if(s.HR > 0) {
        n = "HR " + s.HR.toString();
    } else if(s.HD > 0) {
        n = "HD " + s.HD.toString();
    } else if(s.Hip > 0) {
        n = "Hip " + s.Hip.toString(); 
    } else {
        n = "HYG " + s.StarId;
    }
    return n;

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
    lastMouseDown = window.performance.now();
}


function onMouseUp(event) {
    event.preventDefault();

    mouseDown = false;

    if(window.performance.now() - lastMouseDown < 500) {
        // select the star that was clicked on
        var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
        projector.unprojectVector( vector, camera );
        var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
        var intersects = raycaster.intersectObjects( objects );

        if ( intersects.length > 0 ) {
            obj = intersects[0].object;
            console.log("Clicked object: ", obj.name);
            $.getJSON('http://starmap.whitten.org/api/stars/'+obj.name, function (data) {
                var t = data.data;
                $("#hud_selected").text(starName(t[0]));
                $("#hud_selected_data").text(JSON.stringify(t[0], null, "  "));
            });
        } else {
            $("#hud_selected").text("");
            $("#hud_selected_data").text("");
        }
    }
}

function updateHUD() {
    $("#hud_x").text(camera.position.x.toFixed(2));
    $("#hud_y").text(camera.position.y.toFixed(2));
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

