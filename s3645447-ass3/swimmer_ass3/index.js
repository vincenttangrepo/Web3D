"use strict";

var renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x111111);

document.body.appendChild(renderer.domElement);

window.addEventListener("resize", function() {

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

});


var scene = new THREE.Scene();

var aspect = renderer.domElement.width / renderer.domElement.height;
var camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 1000);

var controls = new THREE.OrbitControls(camera, renderer.domElement);

controls.screenSpacePanning = true;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = 0;

function createPolyhedron(sides, sizeX, sizeY, sizeZ, material) {

    var array = [];
    var normalArray = [];

    var uvs = [];

    var normal = new THREE.Vector3();

    for (var i = 0; i < sides; i++) {

        var j = i === (sides - 1) ? 0 : (i + 1);

        var x0 = Math.cos(i / sides * Math.PI * 2 + Math.PI / 2);
        var y0 = Math.sin(i / sides * Math.PI * 2 + Math.PI / 2);

        var x1 = Math.cos(j / sides * Math.PI * 2 + Math.PI / 2);
        var y1 = Math.sin(j / sides * Math.PI * 2 + Math.PI / 2);

        array.push(x0 * sizeX, y0 * sizeY, 0);
        array.push(x1 * sizeX, y1 * sizeY, 0);
        array.push(0, 0, sizeZ);

        array.push(x0 * sizeX, y0 * sizeY, 0);
        array.push(x1 * sizeX, y1 * sizeY, 0);
        array.push(0, 0, -sizeZ);

        uvs.push(x0 * 0.5 + 0.5, y0 * 0.5 + 0.5);
        uvs.push(x1 * 0.5 + 0.5, y1 * 0.5 + 0.5);
        uvs.push(0.5, 0.5);
        uvs.push(x0 * 0.5 + 0.5, y0 * 0.5 + 0.5);
        uvs.push(x1 * 0.5 + 0.5, y1 * 0.5 + 0.5);
        uvs.push(0.5, 0.5);

    }

    var bufferGeometry = new THREE.BufferGeometry();
    var attribute = new THREE.Float32BufferAttribute(array, 3);
    var uvAttribute = new THREE.Float32BufferAttribute(uvs, 2);

    bufferGeometry.setAttribute("position", attribute);
    bufferGeometry.setAttribute("uv", uvAttribute);

    var geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);

    return new THREE.Mesh(geometry, material);

}

function createTorso(material) {

    var sides = 5;
    var sizeX = 2.7;
    var sizeY = 2.7;
    var sizeZ = 1.25;

    var torso = createPolyhedron(sides, sizeX, sizeY, sizeZ, material);
    torso.name = 'Torso';

    var x = Math.cos(1 / 5 * Math.PI * 2 + Math.PI / 2) * sizeX;
    var y = Math.sin(1 / 5 * Math.PI * 2 + Math.PI / 2) * sizeY;

    var l_shoulder = createJoint("LShoulder");
    l_shoulder.position.x = x;
    l_shoulder.position.y = y;
    l_shoulder.rotation.y = Math.PI;
    torso.add(l_shoulder);

    var r_shoulder = createJoint("RShoulder");
    r_shoulder.position.x = -x;
    r_shoulder.position.y = y;
    torso.add(r_shoulder);

    var neck = createJoint("Neck");
    neck.position.x = 0;
    neck.position.y = sizeY;
    torso.add(neck);

    var xx = Math.cos(3 / 5 * Math.PI * 2 + Math.PI / 2) * sizeX
    var yy = Math.sin(3 / 5 * Math.PI * 2 + Math.PI / 2) * sizeY

    var l_hip = createJoint("LHip");
    l_hip.position.x = -xx;
    l_hip.position.y = yy;
    l_hip.rotation.y = -Math.PI;
    torso.add(l_hip);

    var r_hip = createJoint("RHip");
    r_hip.position.x = xx;
    r_hip.position.y = yy;
    r_hip.rotation.y = -Math.PI;
    torso.add(r_hip);

    return torso;

}

function createArm(material, dir) {

    var sides = 4;
    var sizeX = 0.7;
    var sizeY = 0.7;
    var sizeZ = 1.5;

    var prefix = dir === -1 ? "L" : "R";

    var mesh = createPolyhedron(sides, sizeX, sizeY, sizeZ, material);
    mesh.geometry.rotateY(Math.PI / 2);
    mesh.geometry.translate(sizeZ, 0, 0);

    var upper_arm = mesh.clone();
    upper_arm.name = prefix + "UpperArm";

    var elbow = createJoint(prefix + "Elbow");
    elbow.position.x = sizeZ * 2.0;
    upper_arm.add(elbow);

    var fore_arm = mesh.clone();
    fore_arm.name = prefix + "ForeArm";
    elbow.add(fore_arm);

    var wrist = createJoint(prefix + "Wrist");
    wrist.position.x = sizeZ * 2.0;
    fore_arm.add(wrist);

    var handGeometry = new THREE.ConeGeometry(sizeX * 1.15, sizeZ, 4);
    var hand = new THREE.Mesh(handGeometry, material);
    hand.geometry.computeFaceNormals();
    hand.geometry.rotateZ(Math.PI / 2);
    hand.geometry.translate(sizeZ / 2, 0, 0);

    hand.name = prefix + "Hand";
    wrist.add(hand);

    return upper_arm;

}

function createLeg(material, prefix) {

    var sides = 4;
    var sizeX = 0.7;
    var sizeY = 0.7;
    var sizeZ = 1.5;

    var mesh = createPolyhedron(sides, sizeX, sizeY, sizeZ, material);
    mesh.geometry.rotateX(Math.PI / 2);
    mesh.geometry.translate(0, -sizeZ, 0);

    var thigh = mesh.clone();
    thigh.name = prefix + "Thigh";

    var knee = createJoint(prefix + "Knee");
    knee.position.y = -sizeZ * 2.0;
    thigh.add(knee);

    var calf = mesh.clone();
    calf.name = prefix + "Calf";
    knee.add(calf);

    var ankle = createJoint(prefix + "Ankle");
    ankle.position.y = -sizeZ * 2.0;
    calf.add(ankle)

    var footGeometry = new THREE.ConeGeometry(sizeX * 1.15, sizeZ, 4);
    var foot = new THREE.Mesh(footGeometry, material);
    foot.geometry.computeFaceNormals();
    foot.geometry.translate(0, -sizeZ / 2, 0);

    ankle.add(foot);

    return thigh;

}

function createHead(material) {

    var sides = 4;
    var sizeX = 1.5;
    var sizeY = 1.5;
    var sizeZ = 1.5;

    var head = createPolyhedron(sides, sizeX, sizeY, sizeZ, material);
    head.name = "Head";
    head.geometry.rotateX(Math.PI / 2);
    head.geometry.translate(0, sizeZ, 0);

    var eyeGeometry = new THREE.PlaneBufferGeometry(0.4, 0.4);

    var eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000
    });

    var eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    var eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);

    eye1.position.set(-sizeX * 0.55, sizeY * 1.24, sizeZ * 0.3);
    eye2.position.set(sizeX * 0.55, sizeY * 1.24, sizeZ * 0.3);

    eye1.name = 'LEye';
    eye2.name = 'REye';

    head.add(eye1, eye2);

    return head;

}

function createJoint(name, size) {

    var joint = new THREE.AxesHelper(size);
    joint.name = name;
    return joint;

}

function createSwimmer(material, torsoMaterial) {

    var l_arm = createArm(material, -1);
    var r_arm = createArm(material, 1);

    var root = createJoint("Root", 2);

    var swimmer = createTorso(torsoMaterial);
    swimmer.children[0].add(l_arm);
    swimmer.children[1].add(r_arm);
    swimmer.position.z = -1.25;

    root.add(swimmer);

    swimmer.children[2].add(createHead(material));

    var l_leg = createLeg(material, "L");
    var r_leg = createLeg(material, "R");

    swimmer.children[3].add(l_leg);
    swimmer.children[4].add(r_leg);

    return root;

}

function createPlane(material, sizeX, sizeY, posX, posY, posZ, rotX, rotY, rotZ) {

    var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(sizeX, sizeY), material);
    plane.rotation.set(rotX, rotY, rotZ);
    plane.position.set(posX, posY, posZ);
    return plane;

} 

var textureLoader = new THREE.TextureLoader();

var materialOptions = {
    color: "yellow",
    side: THREE.DoubleSide
};

var defaultMaterial = new THREE.MeshLambertMaterial(materialOptions);
var basicMaterial = new THREE.MeshBasicMaterial(materialOptions);

var pointLight = new THREE.PointLight("#fff", 1.5);
pointLight.position.set(0, 0, 5);
scene.add(pointLight);

var ambientLight = new THREE.AmbientLight("#fff", 0.8);
scene.add(ambientLight);

// pool

var w = 20;
var h = 50;
var d = 2.5;

camera.position.set(0, -h / 2 - 12, 10);
camera.lookAt(0, 0, 0);
controls.update();

var poolBackMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load('textures/tiles.jpg'),
    side: THREE.DoubleSide
});
poolBackMaterial.map.wrapT = THREE.RepeatWrapping;
poolBackMaterial.map.wrapS = THREE.RepeatWrapping;
poolBackMaterial.map.repeat.y = 2;

var poolSideMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load('textures/tiles.jpg'),
    side: THREE.DoubleSide
});
poolSideMaterial.map.wrapT = THREE.RepeatWrapping;
poolSideMaterial.map.wrapS = THREE.RepeatWrapping;
poolSideMaterial.map.repeat.y = 2;
poolSideMaterial.map.repeat.x = 0.1;

var poolTopMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load('textures/tiles.jpg'),
    side: THREE.DoubleSide
});
poolTopMaterial.map.wrapT = THREE.RepeatWrapping;
poolTopMaterial.map.wrapS = THREE.RepeatWrapping;
poolTopMaterial.map.repeat.y = 0.25;
poolTopMaterial.map.repeat.x = 1;

var waterMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: '#0f5e9c',
    opacity: 0.7
});

var waterGap = d * 0.05;

var pool = createJoint('pool', w / 5);
pool.add(createPlane(poolBackMaterial, w, h, 0, 0, - d, 0, 0, 0 ));
pool.add(createPlane(poolSideMaterial, d, h, - w / 2, 0, - d / 2, 0, Math.PI / 2, 0));
pool.add(createPlane(poolSideMaterial, d, h, w / 2, 0, - d / 2, 0, Math.PI / 2, 0));
pool.add(createPlane(poolTopMaterial, w, d, 0, - h / 2, - d / 2, Math.PI / 2, 0, 0));
pool.add(createPlane(poolTopMaterial, w, d, 0, h / 2, - d / 2, Math.PI / 2, 0, 0));
pool.add(createPlane(waterMaterial, w, h, 0, 0, - waterGap, 0, 0, 0));

scene.add(pool);

// add swimmers and the ropes

var numSwimmers = 8;
var swimmerHalfHeight = 2.5;

var cylinderMaterial = new THREE.MeshLambertMaterial( { color: 'gold' } );
var r = w * 0.005;
var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h), cylinderMaterial);

var degToRadian = Math.PI / 180;

var swimmers = [];

for ( var i = 0; i < numSwimmers; i ++ ) {

    if (i !== 0) {

        var clone = cylinder.clone();
        clone.position.x = - w / 2 + (i / numSwimmers) * w;
        pool.add(clone);

    }

    var color = 'rgb(255, ' + (Math.floor(Math.random() * 206) + 50) + ', 255)';

    var swimmer = createSwimmer( new THREE.MeshLambertMaterial({
        color: color,
        side: THREE.DoubleSide,
    }));

    swimmer.getObjectByName('Torso').material = new THREE.MeshLambertMaterial({
        color: color,
        map: textureLoader.load('textures/swim-suits/style' + i + '.png'),
        side: THREE.DoubleSide
    });
    
    swimmer.scale.setScalar( 1 / 5 );
    swimmer.scale.z *= -1;
    if (Math.random() > 0.2) swimmer.scale.x *= -1;
    swimmer.position.x = - w / 2 + (w / numSwimmers / 2) + (i / numSwimmers) * w;
    swimmer.position.y = - h / 2 + swimmerHalfHeight;
    swimmer.position.z = -waterGap - 0.2;
    swimmer.speed = Math.random() * 0.05 + 0.02;
    swimmer.direction = 1;
    swimmer.finished = false;

    swimmer.getObjectByName('LShoulder').rotation.z += 80 * degToRadian;
    swimmer.getObjectByName('RShoulder').rotation.z += 80 * degToRadian;
    swimmer.getObjectByName('LElbow').rotation.y += 20 * degToRadian;
    swimmer.getObjectByName('RElbow').rotation.y -= 20 * degToRadian;
    swimmer.getObjectByName('LWrist').rotation.y += 20 * degToRadian;
    swimmer.getObjectByName('RWrist').rotation.y -= 20 * degToRadian;

    swimmers.push(swimmer);
    pool.add(swimmer);

}

var raceStarted = false;

window.addEventListener('keydown', function(event) {

    if (event.key.toLowerCase() == 'g') {
        raceStarted = true;
    }

});

// animation

function lerp(k1, v1, k2, v2, k) {

    return  v1 + (v2 - v1) * (k - k1) / (k2 - k1);

}

function findInterval(keys, k) {

    for (var i = 0; i < keys.length; i++) {

        if (keys[i] > k) return i;

    }

}

function interpolate(keys, values, k) {

    var index = findInterval(keys, k);

    var k1 = keys[index - 1];
    var v1 = values[index - 1];
    var k2 = keys[index];
    var v2 = values[index];

    return lerp(k1, v1, k2, v2, k);

}

var t = 0;

var clock = new THREE.Clock();

var duration = 4.0;
var torsoAngle = 15;
var legAngle = 20;

var legAnimation = {
    keys: [0, duration / 2, duration],
    values: [legAngle * degToRadian, -legAngle * degToRadian, legAngle * degToRadian]
};

var armAnimation = {
    keys: [0, duration],
    values: [0, Math.PI * 2]
}

var torsoAnimation = {
    keys: [0, duration / 2.0, duration],
    values: [torsoAngle * degToRadian, -torsoAngle * degToRadian, torsoAngle * degToRadian]
};

function animate() {

    if (raceStarted) {

        t += clock.getDelta();
        if (t > duration) t = 0;

        var armRotation = interpolate(armAnimation.keys, armAnimation.values, t);
        var legRotation = interpolate(legAnimation.keys, legAnimation.values, t);
        var torsoRotation = interpolate(torsoAnimation.keys, torsoAnimation.values, t);

        for (var i = 0; i < swimmers.length; i++) {

            var swimmer = swimmers[i];

            if (!swimmer.finished) {
                swimmer.getObjectByName('LShoulder').rotation.x = Math.PI + armRotation;
                swimmer.getObjectByName('RShoulder').rotation.x = armRotation;
                swimmer.getObjectByName('LHip').rotation.x = legRotation;
                swimmer.getObjectByName('RHip').rotation.x = -legRotation;
                swimmer.getObjectByName('Torso').rotation.y = torsoRotation;

                swimmer.position.y += swimmer.direction * swimmer.speed;
            } else {
                swimmer.getObjectByName('LShoulder').rotation.x = 0;
                swimmer.getObjectByName('RShoulder').rotation.x = 0;
                swimmer.getObjectByName('LHip').rotation.x = 0;
                swimmer.getObjectByName('RHip').rotation.x = 0;
                swimmer.getObjectByName('Torso').rotation.y = 0;
                continue;
            }


            if (swimmer.direction === 1) {

                if (swimmer.position.y > h / 2 - swimmerHalfHeight) {
                    swimmer.direction = -1;
                    swimmer.scale.y = -Math.abs(swimmer.scale.y);
                }

            } else if (swimmer.direction === -1) {

                if (swimmer.position.y < - h / 2 + swimmerHalfHeight && !swimmer.finished) {
                    swimmer.direction = 0;
                    swimmer.finished = true;
                    //swimmer.scale.y = Math.abs(swimmer.scale.y);
                }

            }

        }

    }

    controls.update();
    renderer.render(scene, camera);

    window.requestAnimationFrame(animate);

}

animate();

/*

// testing

var keys = [0, 2, 4, 6];
var values = [0, 30, 10, 40];

for (var k = 0; k < 6; k += 0.1) {

    console.log(interpolate(keys, values, k));

}*/
