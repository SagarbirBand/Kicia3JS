import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';

class KiciaWorld
{

     //let's initialize
    constructor() 
    { 
        this._Initialize(); 
    
        this._keys = {};
        this._moveSpeed = 3;
        this._moveDirection = new THREE.Vector3();
        
        window.addEventListener('keydown', (event) => {
            this._keys[event.key] = true;
        });
        window.addEventListener('keyup', (event) => {
            this._keys[event.key] = false;
        });
    }
  
    _Initialize()
    {
         //remove jagged edges
        this._threejs = new THREE.WebGLRenderer({ antialias: true, });

        //Keep track of rays for shadows
        this._threejs.shadowMap.enabled = true; 
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;



        //fit to user window
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this._threejs.domElement);


        //disallow user resize
        window.addEventListener('resize', () => {
        this._OnWindowResize();
        }, false);

        ///field of view & instantiate camera
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(-2, 40, -181);
        this._scene = new THREE.Scene();


        //necessary for shadows to appear
        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(20, 100, 10);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        this._scene.add(light);

        //extraneous lighting
        light = new THREE.AmbientLight(0x101010);
        this._scene.add(light);

        //HOUSE LIGHTS FOR CURRENT SCALE OF 50
        let l1 = new THREE.PointLight(0x101010, 20, 100);
        l1.position.set(98.56, 207.18, 188.89);
        let l2 = new THREE.PointLight(0x101010, 5, 100);
        l2.position.set(61.35, -9.17, 33.52);
        let l3 = new THREE.PointLight(0x101010, 5, 100);
        l3.position.set(4.58, -9.70, 46.02); 
        let l4 = new THREE.PointLight(0x101010, 5, 100);
        l4.position.set(11.78, -9.53, 19.13);
        let l5 = new THREE.PointLight(0x101010, 5, 100);
        l5.position.set(-18.74, -9.06, -85.15);
        let l6 = new THREE.PointLight(0x101010, 5, 100);
        l6.position.set(61.32, -13.84, 22.82);
        let l7 = new THREE.PointLight(0x101010, 5, 100);
        l7.position.set(38.68, -16.16, -11.45);
        let l8 = new THREE.PointLight(0x101010, 10, 100);
        l8.position.set(40.11, -17.02, 0.37);
        this._scene.add(l1);
        this._scene.add(l2);
        this._scene.add(l3);
        this._scene.add(l4);
        this._scene.add(l5);
        this._scene.add(l6);
        this._scene.add(l7);
        this._scene.add(l8);


        //enables camera to move with right click pan & scroll zoom
        const controls = new OrbitControls(
        this._camera, this._threejs.domElement);

        //controls.target.set(0, 20, 0);
        controls.screenSpacePanning = true;
        controls.zoomToCursor = false;
        controls.update();

        const cameraInfo = document.createElement('div');
        cameraInfo.style.position = 'absolute';
        cameraInfo.style.top = '10px';
        cameraInfo.style.left = '10px';
        cameraInfo.style.color = 'white';
        cameraInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        cameraInfo.style.padding = '5px';
        document.body.appendChild(cameraInfo);

        // Update the position on 'change' event
        controls.addEventListener('change', () => {
            cameraInfo.textContent = `Camera Position: x=${this._camera.position.x.toFixed(2)}, y=${this._camera.position.y.toFixed(2)}, z=${this._camera.position.z.toFixed(2)}`;
        });

        //create a scene around the plane with jpg imgs
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            './resources/posx.jpg',
            './resources/negx.jpg',
            './resources/posy.jpg',
            './resources/negy.jpg',
            './resources/posz.jpg',
            './resources/negz.jpg',
        ]);
        this._scene.background = texture;


        //create a plane for blender objects to stay on
        /*const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
            }));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);*/


    
       
        this._LoadModel('./resources/dom.glb', 50, 0 , 0 , 0); //scale & xyz pos for house
        //this._LoadModel('./resources/cat_lowpoly.glb', 20, 30, 0, -100); //scale & xyz pos for cat

        this._RAF();
    }


    _UpdateCamera() 
    {
        // Reset movement direction
        this._moveDirection.set(0, 0, 0);
        
        // Get camera's forward direction (excluding y component for ground movement)
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this._camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        // Get camera's right direction
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this._camera.quaternion);
        right.y = 0;
        right.normalize();
        
        // Update movement direction based on keys
        if (this._keys['w']) {
            this._moveDirection.add(forward);
        }
        if (this._keys['s']) {
            this._moveDirection.sub(forward);
        }
        if (this._keys['a']) {
            this._moveDirection.sub(right);
        }
        if (this._keys['d']) {
            this._moveDirection.add(right);
        }
        if (this._keys[' ']) { 
            this._moveDirection.y += 1;
        }
        if (this._keys['Shift']) {
            this._moveDirection.y -= 1;
        }
        
        // Normalize movement direction to maintain consistent speed in all directions
        if (this._moveDirection.lengthSq() > 0) {
            this._moveDirection.normalize();
            this._moveDirection.multiplyScalar(this._moveSpeed);
            
            // Update camera position
            this._camera.position.add(this._moveDirection);
        }
    }


    _LoadModel(file, scale, x, y, z)
    {
        const loader = new GLTFLoader();
        loader.load(file, (gltf) => {
            gltf.scene.traverse( c=> {
                c.castShadow = true;
            });

            const scaleFactor = scale; // Adjust this value as needed
            gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

            gltf.scene.position.set(x, y+5, z);

            this._scene.add(gltf.scene);
        });
    }


  
    _OnWindowResize()
    {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }
  
    _RAF()
    {
        requestAnimationFrame(() => {
        this._UpdateCamera();
        this._threejs.render(this._scene, this._camera);
        this._RAF();
        });
    }
}
  
let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
    _APP = new KiciaWorld();
});




/*
TODO:
1. Change plane color as necessary
2. Insert appropriate models
3. Add lighting points as necessary around the house.
4. Camera panning & model for walking if can be implemented.
5/ Rename
*/
