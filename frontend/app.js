class StoryboardComposer {
    constructor() {
        this.shots = [];
        this.container = document.getElementById('scene-container');
        this.currentShotIndex = -1; // Track which shot is currently being edited
        this.setupThreeJs();
        this.setupEventListeners();
        this.animate();
    }

    setupThreeJs() {
        // Clear previous renderer if it exists
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Orbit controls setup
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add grid and axes helpers
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Store initial camera position for reset
        this.initialCameraPosition = this.camera.position.clone();
        this.initialCameraLookAt = new THREE.Vector3(0, 0, 0);
    }

    setupCanvas() {
        // Set canvas size to match its display size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
    }

    setupEventListeners() {
        // New shot button
        document.getElementById('newShot').addEventListener('click', () => {
            this.currentShotIndex = -1;
            this.saveShot();
            this.clearScene();
            document.getElementById('updateShot').style.display = 'none';
        });

        // Reset storyboard button
        document.getElementById('resetBoard').addEventListener('click', () => {
            this.resetStoryboard();
            this.currentShotIndex = -1;
            document.getElementById('updateShot').style.display = 'none';
        });

        // Parse JSON button
        document.getElementById('parseJson').addEventListener('click', () => {
            this.parseAndRenderJSON();
        });

        // Reset camera button
        document.getElementById('resetCamera').addEventListener('click', () => {
            this.resetCamera();
        });

        // Update shot button
        document.getElementById('updateShot').addEventListener('click', () => {
            if (this.currentShotIndex >= 0) {
                this.updateCurrentShot();
            }
        });

        // Initially hide update button
        document.getElementById('updateShot').style.display = 'none';

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    parseAndRenderJSON() {
        const jsonInput = document.getElementById('jsonInput').value;
        try {
            const sceneData = JSON.parse(jsonInput);
            this.clearScene();
            this.createSceneFromJSON(sceneData);
        } catch (error) {
            alert('Invalid JSON format: ' + error.message);
        }
    }

    createSceneFromJSON(data) {
        // Set camera position if specified
        if (data.camera) {
            const pos = data.camera.position;
            const lookAt = data.camera.lookAt;
            this.camera.position.set(pos[0], pos[1], pos[2]);
            this.camera.lookAt(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]));
        }

        // Create objects
        if (data.objects) {
            data.objects.forEach(obj => {
                let mesh;
                const material = new THREE.MeshStandardMaterial({ 
                    color: obj.color || 0xffffff,
                    side: THREE.DoubleSide // Enable double-sided rendering for planes
                });

                switch (obj.type.toLowerCase()) {
                    case 'cube':
                        const geometry = new THREE.BoxGeometry(1, 1, 1);
                        mesh = new THREE.Mesh(geometry, material);
                        if (obj.scale) {
                            mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                        }
                        break;

                    case 'sphere':
                        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
                        mesh = new THREE.Mesh(sphereGeometry, material);
                        if (obj.scale) {
                            mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                        }
                        break;

                    case 'plane':
                        const planeGeometry = new THREE.PlaneGeometry(1, 1);
                        mesh = new THREE.Mesh(planeGeometry, material);
                        if (obj.scale) {
                            mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                        }
                        break;

                    case 'cylinder':
                        const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                        mesh = new THREE.Mesh(cylinderGeometry, material);
                        if (obj.scale) {
                            mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                        }
                        break;

                    default:
                        console.warn(`Unknown object type: ${obj.type}`);
                        return;
                }

                if (obj.position) {
                    mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
                }

                if (obj.rotation) {
                    mesh.rotation.set(
                        THREE.MathUtils.degToRad(obj.rotation[0]),
                        THREE.MathUtils.degToRad(obj.rotation[1]),
                        THREE.MathUtils.degToRad(obj.rotation[2])
                    );
                }

                this.scene.add(mesh);
            });
        }
    }

    resetCamera() {
        this.camera.position.copy(this.initialCameraPosition);
        this.controls.target.copy(this.initialCameraLookAt);
        this.controls.update();
    }

    updateCurrentShot() {
        if (this.currentShotIndex >= 0 && this.currentShotIndex < this.shots.length) {
            // Create new thumbnail
            const thumbnail = document.createElement('canvas');
            thumbnail.width = 280;
            thumbnail.height = 150;
            const thumbRenderer = new THREE.WebGLRenderer({ canvas: thumbnail, antialias: true });
            thumbRenderer.setSize(280, 150);
            thumbRenderer.render(this.scene, this.camera);

            // Update shot data
            this.shots[this.currentShotIndex] = {
                ...this.shots[this.currentShotIndex],
                thumbnail: thumbnail.toDataURL(),
                cameraPosition: this.camera.position.clone(),
                cameraTarget: this.controls.target.clone()
            };

            this.updateShotsList();
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update(); // Update orbit controls
        this.renderer.render(this.scene, this.camera);
    }

    saveShot() {
        // Create thumbnail from current renderer
        const thumbnail = document.createElement('canvas');
        thumbnail.width = 280;
        thumbnail.height = 150;
        const thumbRenderer = new THREE.WebGLRenderer({ canvas: thumbnail, antialias: true });
        thumbRenderer.setSize(280, 150);
        thumbRenderer.render(this.scene, this.camera);
        
        const shot = {
            id: this.shots.length,
            thumbnail: thumbnail.toDataURL(),
            sceneData: document.getElementById('jsonInput').value,
            cameraPosition: this.camera.position.clone(),
            cameraTarget: this.controls.target.clone()
        };
        
        this.shots.push(shot);
        this.currentShotIndex = this.shots.length - 1;
        this.updateShotsList();
        document.getElementById('updateShot').style.display = 'inline-block';
    }

    updateShotsList() {
        const shotsList = document.getElementById('shotsList');
        shotsList.innerHTML = '';
        
        this.shots.forEach((shot, index) => {
            const container = document.createElement('div');
            container.className = 'shot-container';
            if (index === this.currentShotIndex) {
                container.classList.add('current-shot');
            }
            
            const img = document.createElement('img');
            img.src = shot.thumbnail;
            img.className = 'shot-thumbnail';
            img.onclick = () => this.loadShot(shot, index);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-shot';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteShot(index);
            };
            
            container.appendChild(img);
            container.appendChild(deleteBtn);
            shotsList.appendChild(container);
        });
    }

    deleteShot(index) {
        this.shots.splice(index, 1);
        this.updateShotsList();
    }

    resetStoryboard() {
        // Clear all shots
        this.shots = [];
        this.currentShotIndex = -1;
        
        // Clear the scene
        this.clearScene();
        
        // Clear the JSON input
        document.getElementById('jsonInput').value = '';
        
        // Reset camera to initial position
        this.resetCamera();
        
        // Update the shots list
        this.updateShotsList();
    }

    loadShot(shot, index) {
        this.currentShotIndex = index;
        document.getElementById('jsonInput').value = shot.sceneData;
        this.parseAndRenderJSON();
        
        // Restore camera position
        if (shot.cameraPosition && shot.cameraTarget) {
            this.camera.position.copy(shot.cameraPosition);
            this.controls.target.copy(shot.cameraTarget);
            this.controls.update();
        }

        // Show update button
        document.getElementById('updateShot').style.display = 'inline-block';
    }

    clearScene() {
        // Dispose of all geometries and materials
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });

        // Remove all objects except helpers and lights
        const toKeep = [];
        this.scene.children.forEach(object => {
            if (object instanceof THREE.GridHelper || 
                object instanceof THREE.AxesHelper || 
                object instanceof THREE.Light) {
                toKeep.push(object);
            }
        });

        this.scene.clear();
        
        // Re-add the helpers and lights
        toKeep.forEach(object => this.scene.add(object));
    }
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
    new StoryboardComposer();
});
