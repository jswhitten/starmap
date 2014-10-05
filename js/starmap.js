var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function addStar(x, y, z, m, s) {
	var size = 0.2 - m * 0.01;
	var geometry = new THREE.SphereGeometry(size,32,32);
	var star_color = 0xffffff, halo_color = 0xaaaaaa;
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


	var material = new THREE.MeshBasicMaterial( { color: star_color } );
	var star = new THREE.Mesh( geometry, material );
	scene.add( star );
	star.position.set(x, y, z)

	var spriteMaterial = new THREE.SpriteMaterial( 
	{ 
		map: new THREE.ImageUtils.loadTexture( 'images/glow.png' ), 
		useScreenCoordinates: false, 
		color: halo_color, transparent: false, blending: THREE.AdditiveBlending
	});
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(size*15, size*15, size*15);
	star.add(sprite); // this centers the glow at the mesh
}

$.getJSON('http://starmap.whitten.org/api/stars?xmin=-20&xmax=20&ymin=-20&ymax=20&zmin=-15&zmax=15', function (data) {
    var t = data.data;
    for(i = 0; i < t.length; i++) {
        //console.log(JSON.stringify(t[i]));
	x = -t[i].Y;
	y = t[i].X;
	z = 0.1 * t[i].Z;
        m = t[i].AbsMag;
        for (var s = ' ', j = 0; j < 3 && (s == ' ' || s == 'D'); j++) {
            s = t[i].Spectrum.substring(0,1).toUpperCase();
        }
	if(s == ' ' && m > 8) {
            s = 'M'; // probably a red dwarf
        }
        
	addStar(x,y,z,m,s);
    }
});

camera.position.z = 15;

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}
render();
