"use strict";

var renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x111111);

window.addEventListener("resize", function() {

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

});

document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(70,
    renderer.domElement.width / renderer.domElement.height, 0.1, 1000);
var controls = new THREE.TrackballControls(camera, renderer.domElement);

controls.staticMoving = true;

camera.position.set(0, 0, 20);
controls.update();

var materialOptions = {

    color: "yellow",
    side: THREE.DoubleSide

};

var defaultMaterial = new THREE.MeshLambertMaterial(materialOptions);
var basicMaterial = new THREE.MeshBasicMaterial(materialOptions);

var pointLight = new THREE.PointLight("#fff", 0.6);
pointLight.position.set(2, 1, 3);
scene.add(pointLight);

var ambientLight = new THREE.AmbientLight("#fff", 0.4);
scene.add(ambientLight);

function createPolyhedron(sides, sizeX, sizeY, sizeZ, material) {

    var array = [];
    var normalArray = [];

    var normal = new THREE.Vector3();

    for (var i = 0; i < sides; i++) {

        var j = i === (sides - 1) ? 0 : (i + 1);

        var x0 = Math.cos(i / sides * Math.PI * 2 + Math.PI / 2) * sizeX;
        var y0 = Math.sin(i / sides * Math.PI * 2 + Math.PI / 2) * sizeY;

        var x1 = Math.cos(j / sides * Math.PI * 2 + Math.PI / 2) * sizeX;
        var y1 = Math.sin(j / sides * Math.PI * 2 + Math.PI / 2) * sizeY;

        array.push(x0, y0, 0);
        array.push(x1, y1, 0);
        array.push(0, 0, sizeZ);

        array.push(x0, y0, 0);
        array.push(x1, y1, 0);
        array.push(0, 0, -sizeZ);

    }

    var bufferGeometry = new THREE.BufferGeometry();
    var attribute = new THREE.Float32BufferAttribute(array, 3);
    bufferGeometry.setAttribute("position", attribute);

    var geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);

    return new THREE.Mesh(geometry, material);

}

function createTorso(material) {

    var sides = 5;
    var sizeX = 2.7;
    var sizeY = 2.7;
    var sizeZ = 1.25;

    var torso = createPolyhedron(sides, sizeX, sizeY, sizeZ, material);

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

    var points = new Float32Array([

        -sizeX * 0.55, sizeY * 1.24, sizeZ * 0.3,
        sizeX * 0.55, sizeY * 1.24, sizeZ * 0.3,

    ]);

    var pointGeometry = new THREE.BufferGeometry();
    var attribute = new THREE.BufferAttribute(points, 3);
    pointGeometry.setAttribute("position", attribute);

    var eyes = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
        color: "red",
        sizeAttenuation: false,
        size: 10
    }));

    head.add(eyes);

    return head;

}

function createSwimmer(material) {

    var l_arm = createArm(material, -1);
    var r_arm = createArm(material, 1);

    var root = createJoint("Root", 2);

    var swimmer = createTorso(material);
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

function createJoint(name, size) {

    var joint = new THREE.AxesHelper(size);
    joint.name = name;
    return joint;

}

var swimmer = createSwimmer(defaultMaterial);

scene.add(swimmer);

var prefix = "L";

var currentJoint = null;
var currentKey = null;

var keyJointHashMap = {

    "s": {
        name: "Shoulder",
        min: -Math.PI / 2,
        max: Math.PI / 2,
        axis: "z"
    },

    "e": {
        name: "Elbow",
        min: 0,
        max: Math.PI,
        axis: "z"
    },

    "w": {
        name: "Wrist",
        min: -Math.PI / 2,
        max: Math.PI / 2,
        axis: "z"
    },

    "h": {
        name: "Hip",
        min: -Math.PI / 2,
        max: Math.PI / 2,
        axis: "x"
    },

    "k": {
        name: "Knee",
        min: -Math.PI / 2,
        max: 0,
        axis: "x"
    },

    "a": {
        name: "Ankle",
        min: 0,
        max: Math.PI / 2,
        axis: "x"
    },

    "n": {
        name: "Neck",
        min: -Math.PI / 2,
        max: Math.PI / 2,
        axis: "y"
    }

};

var isUpArrowDown = false;
var isDownArrowDown = false;

window.addEventListener("keydown", function(evt) {

    if (evt.keyCode === 37) {

        prefix = "L";

        if (currentKey) {

            var name = keyJointHashMap[currentKey].name;
            if (currentKey != "n") {
                name = prefix + name;
            }

            currentJoint = swimmer.getObjectByName(name);

        }

    } else if (evt.keyCode === 39) {

        prefix = "R";

        if (currentKey) {

            var name = keyJointHashMap[currentKey].name;
            if (currentKey != "n") {
                name = prefix + name;
            }

            currentJoint = swimmer.getObjectByName(name);

        }

    } else if (evt.keyCode === 38) {

        isUpArrowDown = true;

    } else if (evt.keyCode === 40) {

        isDownArrowDown = true;

    } else if (evt.key.toLowerCase() in keyJointHashMap) {

        currentKey = evt.key.toLowerCase();

        var name = keyJointHashMap[currentKey].name;
        if (currentKey != "n") {
            name = prefix + name;
        }

        currentJoint = swimmer.getObjectByName(name);

    } else {

        switch (evt.key.toUpperCase()) {

            case "M":
                defaultMaterial.wireframe = !defaultMaterial.wireframe;
                basicMaterial.wireframe = !basicMaterial.wireframe;
                break;

            case "I":

                swimmer.traverse(function(node) {

                    if (node.isMesh) {
                        if (node.material == basicMaterial) {
                            node.material = defaultMaterial;
                        } else {
                            node.material = basicMaterial;
                        }
                    }

                });

                break;

            case "X":

                swimmer.traverse(function(node) {

                    if (node.constructor == THREE.AxesHelper) {

                        node.material.visible = !node.material.visible;

                    }

                });

                break;

        }

    }

}, false);

window.addEventListener("keyup", function(evt) {

    if (evt.keyCode === 38) {

        isUpArrowDown = false;

    } else if (evt.keyCode === 40) {

        isDownArrowDown = false;

    }

});

var speed = 0.05;

function animate(t) {

    if (currentJoint && isUpArrowDown) {

        currentJoint.rotation[keyJointHashMap[currentKey].axis] += speed;
        currentJoint.rotation[keyJointHashMap[currentKey].axis] = Math.min(
            keyJointHashMap[currentKey].max,
            currentJoint.rotation[keyJointHashMap[currentKey].axis]
        );

    }

    if (currentJoint && isDownArrowDown) {

        currentJoint.rotation[keyJointHashMap[currentKey].axis] -= speed;
        currentJoint.rotation[keyJointHashMap[currentKey].axis] = Math.max(
            keyJointHashMap[currentKey].min,
            currentJoint.rotation[keyJointHashMap[currentKey].axis]
        );

    }

    controls.update();

    renderer.render(scene, camera);

    window.requestAnimationFrame(animate);

}

animate();