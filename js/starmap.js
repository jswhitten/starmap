var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function addStar(x, y, z, m) {
	var size = 0.2 - m * 0.01;
	var geometry = new THREE.SphereGeometry(size,32,32);
	var material = new THREE.MeshBasicMaterial( { color: 0x00aaff } );
	var star = new THREE.Mesh( geometry, material );
	scene.add( star );
	star.position.set(x, y, z)

	var spriteMaterial = new THREE.SpriteMaterial( 
	{ 
		map: new THREE.ImageUtils.loadTexture( 'images/glow.png' ), 
		useScreenCoordinates: false, 
		color: 0x0000ff, transparent: false, blending: THREE.AdditiveBlending
	});
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(size*15, size*15, size*15);
	star.add(sprite); // this centers the glow at the mesh
}

$.getJSON('http://starmap.whitten.org/api/stars?xmin=-15&xmax=15&ymin=-15&ymax=15&zmin=-15&zmax=15', function (data) {
    var t = data.data;
    for(i = 0; i < t.length; i++) {
        console.log(JSON.stringify(t[i]));
	x = -t[i].Y;
	y = t[i].X;
	z = 0.1 * t[i].Z;
        m = t[i].AbsMag;
	addStar(x,y,z,m);
    }
});

camera.position.z = 15;

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}
render();
