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
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
            }));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);


    
       
        this._LoadModel('./resources/farmhouse_free.glb', 20, 0 , 0 , 0); //scale & xyz pos for house
        this._LoadModel('./resources/cat_lowpoly.glb', 20, 30, 0, -100); //scale & xyz pos for cat

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

            gltf.scene.position.set(x, y, z);

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


/*class CatController
{
    constructor(params)
    { 
        this._input = new CatControllerInput();
        this,_stateMachine = new FiniteStateMachine( new CatControllerProx(this));

        this._LoadModels();
    }

    _Init(params)
    {
        this._params = params;
        this._move = 
        {
            forward: false,
            backward: false,
            left: false,
            right: false,
        };
        this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.ACESFilmicToneMapping.Vector3(1, 0.25, 50);
        this._velocity = new THREE.Vector3(0,0,0);

        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    }

    _onKeyDown(event)
    {
        switch(event.keyCode)
        {
            case 87: // w
                this._move.forward = true;
                break;
            case 65: // a
                this._move.left = true;
                break;
            case 83: // s
                this._move.backward = true;
                break;
            case 68: // d
                this._move.right = true;
                break;
            case 38: //up
            case 37: //left
            case 40: //down
            case 39: //right
                break;
        }
    }



    _onKeyUp(event)
    {
        switch(event.keyCode)
        {
            case 87: // w
                this._move.forward = false;
                break;
            case 65: // a
                this._move.left = false;
                break;
            case 83: // s
                this._move.backward = false;
                break;
            case 68: // d
                this._move.right = false;
                break;
            case 38: //up
            case 37: //left
            case 40: //down
            case 39: //right
                break;
        }
    }

    Update(timeInSeconds)
    {
        const velocity = this._velocity;
        const frameDecceleration = new THREE.Vector3
        {
            velocity.x * this._decceleration.x,
            velocity.y * this._decceleration.y,
            velocity.z * this._decceleration.z
        };
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

        velocity.add(frameDecceleration);
        const controlObject = this._params.target;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = new THREE.Quaternion.clone();

        if(this._move.forward)
            velocity.z += this._acceleration.z * timeInSeconds;
        if(this._move.backward)
            velocity.z -= this._acceleration.z * timeInSeconds;
        if(this._move.left)
            velocity.x -= this._acceleration.x * timeInSeconds;
        if(this._move.right)
            velocity.x += this._acceleration.x * timeInSeconds;

    }

}*/


  
let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
    _APP = new KiciaWorld();
});

