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
var target = null;
var goToStar = null;

document.addEventListener( 'mousemove', onMouseMove, false );
document.addEventListener( 'mousewheel', onMouseWheel, false );
document.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
document.addEventListener( 'mousedown', onMouseDown, false );
document.addEventListener( 'mouseup', onMouseUp, false );
document.addEventListener( 'keydown', onKeyDown, false);

init();
render();

// load stars from web service and plot them
function init() {
    camera.position.z = 40;

    $.getJSON('http://starmap.whitten.org/api/stars?xmin=-40&xmax=40&ymin=-60&ymax=60&zmin=-20&zmax=20', function (data) {
        var t = data.data;
        var start = window.performance.now();
        for(var i = 0; i < data.length; i++) {
            var x = -t[i].Y;
            var y = t[i].X;
            var z = t[i].Z;
            var m = t[i].AbsMag;
            var spec = t[i].Spectrum.trim();
            for (var s = '', j = 0; j < 4 && (s == '' || s == 'D'); j++) {
                s = spec.substring(j,j+1).toUpperCase();
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

    var target_material = new THREE.LineBasicMaterial( { color: 0xaaddff } );
    var target_geometry = new THREE.CircleGeometry( 2, 32 );
    target_geometry.vertices.shift();
    target = new THREE.Line( target_geometry, target_material );
    target.visible = false;
    scene.add( target );

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
    var n = new Array();
    if(s.ProperName) {
        n.push(s.ProperName);
    } 
    if(s.BayerFlam) {
        if(s.BayerFlam.substring(3, 4) === " ") {
            n.push(s.BayerFlam.substring(0, 3) + ' ' + s.BayerFlam.substring(6));
        } else {
            n.push(s.BayerFlam.substring(3));
        }
    } 
    if(s.Gliese) {
        n.push(s.Gliese); 
    } 
    if(s.HR > 0) {
        n.push("HR " + s.HR.toString());
    } 
    if(s.HD > 0) {
        n.push("HD " + s.HD.toString());
    } 
    if(s.Hip > 0) {
        n.push("Hip " + s.Hip.toString()); 
    }
    n.push("HYG " + s.StarID.toString());

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
                star = t[0];
                updateHUD(star);
            });
        } else {
            updateHUD();
            $("#hud_selected").text("");
            $("#hud_selected_data").text("");
            target.visible = false;
            target.obj = null;
        }
    }
}


function onKeyDown(event) {
    var keyCode = event.which;

    // C
    if(keyCode = 67) {
        if(target.obj) {
            goToStar = target.obj;
        }
    }
}

function updateHUD(star) {
    $("#hud_x").text(camera.position.x.toFixed(2));
    $("#hud_y").text(camera.position.y.toFixed(2));

    // FIXME
    if(star) {
        var n = starName(star);
        var star_info = "<table class='table table-condensed'>";
        star_info += "<tr><td>Identifiers</td><td>" + n.join(", ") + "</td></tr>";
        star_info += "<tr><td>Spectral type</td><td>" + star.Spectrum + "</td></tr>";
        star_info += "<tr><td>Sky coordinates</td><td>" + star.RA + " hr / " + star.Declination + " deg</td></tr>";
        star_info += "<tr><td>Galactic coordinates</td><td>" + star.X + " / " + star.Y + " / " + star.Z + "</td></tr>";
        star_info += "<tr><td>Distance</td><td>" + star.Distance + " pc</td></tr>";
        star_info += "<tr><td>Apparent magnitude</td><td>" + star.Mag + "</td></tr>";
        star_info += "<tr><td>Absolute magnitude</td><td>" + star.AbsMag + "</td></tr>";
        star_info += "</table>";
        $("#hud_selected").text(n[0]);
        $("#hud_selected_data").html(star_info);
        target.obj = obj;
        target.position.x = obj.position.x;
        target.position.y = obj.position.y;
        target.position.z = obj.position.z;
        target.visible = true;
    }
}

function animate() {
    if(goToStar) {
        var a = new THREE.Vector2( goToStar.position.x, goToStar.position.y);
        var b = new THREE.Vector2( camera.position.x, camera.position.y);
        var c = a.sub(b);
        if(c.length() < 1) {
            camera.position.x = goToStar.position.x;
            camera.position.y = goToStar.position.y;
            goToStar = null;
        } else {
            c = c.normalize();
            var axis = new THREE.Vector3(c.x, c.y, 0);
            camera.translateOnAxis(axis, 1);
        }
    }
}

function render() {
    animate();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

