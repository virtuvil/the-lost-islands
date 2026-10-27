import * as T from 'three';
import { riverMesh, batchStatic, box, bridge, building, ellipsoid, explorer, flower, lantern, makeTerrain, mat, mesh, palette, pathRibbon, pelican, sign, tree } from './assets';
import { findPath, heightAt, walkingHeight, landmarks, moveSafely, START, type Landmark, type Point } from './navigation';
import {coastalPassage} from './coastal-passage';
import {classifySurface,walkable} from './navigation';
import {islandKit } from './island-themes';
import { finalePhase,boardingPose,alongPath,FINALE_DURATION,type FinalePhase } from './voyage';
import { zoro } from './character-assets';
import { pirateHarbor } from './harbor-assets';
import { coastalMilestone } from './coastal-headlands';
import type { Comfort } from './save';
import {ISLANDS} from './adventure';
export type WorldCallbacks = {
    interact: (id: Landmark) => void;
    prompt: (id: Landmark | null) => void;
    ready: () => void;
    error: (message: string) => void;
    story?: (phase:FinalePhase|'crossing'|'ferry-boarding'|'sailing'|'arrival')=>void;
};
export class GameWorld {
    readonly scene = new T.Scene();
    readonly camera = new T.OrthographicCamera();
    readonly renderer: T.WebGLRenderer;
    readonly player = zoro();
    readonly harbor = pirateHarbor();
    private coastal = coastalMilestone();
    private passage=coastalPassage();
    private routeOpen=false;
    private notice:HTMLElement;
    private touch={x:0,y:0};
    private navigationContext(){const sailing=this.routeWalk&&!this.routeWalk.final&&this.routeWalk.elapsed>=5;return {island:this.islandIndex,routeOpen:this.routeOpen,harbor:this.islandIndex===3,ferryX:sailing?this.passage.ferry.position.x:undefined,arrival:!!sailing};}
    private inspection: 'explore'|'front'|'side'|'back'|'harbor'|'luffy' = 'explore';
    private islandIndex=0;
    private voyageComplete=false;
    private aboard=false;
    private sequenceHeight:number|null=null;
    private arrivalDock=new T.Group();
    private localRoutes:T.Group[]=[];
    private lastStory='';
    readonly pip = pelican();
    private architecture = new T.Group();
    private sceneryKit=new T.Group();
    private extraKit = new T.Group();
    private routeWalk: {
        elapsed: number;
        from: Point;
        final: boolean;
        points: Point[];
        resolve: () => void;
    } | null = null;
    private progressLights: T.Mesh[] = [];
    private durations: number[] = [];
    private ground: T.Mesh;
    private clock = new T.Clock();
    private keys = new Set<string>();
    private path: Point[] = [];
    private arrival: Landmark | null = null;
    private position: Point = { ...START };
    private active = false;
    private panel = '';
    private frame = 0;
    private disposed = false;
    private observer: ResizeObserver;
    private comfort: Comfort;
    private target = new T.Vector3(0, .2, 0);
    private cameraTarget = new T.Vector3();
    private ray = new T.Raycaster();
    private pointer = new T.Vector2();
    private hitTargets: T.Mesh[] = [];
    private foliage: {
        leaves: T.Group;
        phase: number;
    }[] = [];
    private clouds: T.Group[] = [];
    private birds: T.Group[] = [];
    private water: T.Mesh[] = [];
    private windows: T.Mesh[] = [];
    private flowers = new T.Group();
    private route = new T.Group();
    private beacon = new T.Group();
    private beaconGlass: T.Mesh;
    private motes: T.Points;
    private sunlight: T.DirectionalLight;
    private gait = 0;
    private gaitPhase = 0;
    private restored = 0;
    private restoring = false;
    private restoreElapsed = 0;
    private restoreResolve: (() => void) | null = null;
    private currentPrompt: Landmark | null = null;
    private celebration = 0;
    private stats = { drawCalls: 0, triangles: 0, frames: 0, elapsed: 0 };
    constructor(private container: HTMLElement, private callbacks: WorldCallbacks, comfort: Comfort) {
        this.comfort = comfort;
        this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setClearColor(0, 0);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, comfort.quality === 'low' ? 1 : 1.75));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = T.PCFSoftShadowMap;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = .95;
        this.renderer.outputColorSpace = T.SRGBColorSpace;
        this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D Whispering Cove. Use WASD or arrows to walk, E to interact, or click a destination.');
        this.renderer.domElement.setAttribute('tabindex', '0');
        container.append(this.renderer.domElement);
        this.notice=document.createElement('div');this.notice.className='navigation-notice';this.notice.setAttribute('role','status');container.append(this.notice);
        this.scene.fog = new T.Fog(0xdbe7df, 38, 85);
        this.scene.add(new T.HemisphereLight(0xe0e6e0, 0x4c5148, 1.8));
        this.sunlight = new T.DirectionalLight(0xffecd3, 1.65);
        this.sunlight.position.set(-8, 18, 10);
        this.sunlight.castShadow = true;
        this.sunlight.shadow.mapSize.set(2048, 2048);
        Object.assign(this.sunlight.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: .5, far: 45 });
        this.sunlight.shadow.bias = -.0003;
        this.sunlight.shadow.normalBias = .035;
        this.sunlight.shadow.radius = 4;
        this.scene.add(this.sunlight);
        const skyFill=new T.DirectionalLight(0xd6e8ed,.65);skyFill.position.set(10,8,-12);this.scene.add(skyFill);
        const terrain = makeTerrain();
        this.ground = terrain.surface;
        this.scene.add(terrain.root);
        const kit = new T.Group();
        pathRibbon(kit, [[-5, 4.6], [-4, 3.3], [-4.8, 1.9], [-3.4, .4], [-1.3, .5], [-.9,1.5],[2.8,1.5], [3.3, .3], [3.3, -.5]], 1.05);
        pathRibbon(kit, [[-3.4, .4], [-4.6, -.3], [-4.5, -1.1]], .8);
        pathRibbon(kit, [[-1.2, .5], [-.6, -1.3], [-.25, -3.4]], .6);
        pathRibbon(kit, [[3.4, .5], [4.5, 1.7], [6, 2.5]], .65);
        const archive = building('archive');
        archive.root.position.set(3.3, heightAt(3.3, -2.2), -2.2);
        this.architecture.add(archive.root);
        this.windows.push(...archive.windows);
        const cottage = building('cottage');
        cottage.root.position.set(-4.5, heightAt(-4.5, -2.6), -2.6);
        cottage.root.rotation.y = .12;
        this.architecture.add(cottage.root);
        this.windows.push(...cottage.windows);
        for (const [x, z, s] of [[-6.7, -1.4, 1.2], [-5.9, -3.8, 1.1], [-2.7, -4.4, 1.15], [5.6, -3.6, 1.25], [6.5, -1.1, .95], [-6, 2.5, .85], [4.6, 3.7, .75], [-.7, -4.6, .8]] as const) {
            const t = tree(x, z, s, this.foliage.length);
            this.scene.add(t.root);
            this.foliage.push({ leaves: t.leaves, phase: this.foliage.length * 1.9 });
        }
        // A real water channel, stepped pool and translucent falling water.
        kit.add(riverMesh());
        const b = bridge();
        b.position.set(1.05, .22, 1.5);
        kit.add(b);
        const waterfall = mesh(new T.PlaneGeometry(.62, 3.9, 4, 18), palette.water, this.scene, [2, -1.65, 5.55]);
        waterfall.material = new T.MeshStandardMaterial({ color: 0x97d5ce, transparent: true, opacity: .62, roughness: .3, side: T.DoubleSide });
        this.water.push(waterfall);
        for (let i = 0; i < 4; i++) {
            const strip = mesh(new T.PlaneGeometry(.035, 3.7), 0xd1eee0, this.scene, [1.78 + i * .14, -1.7, 5.57]);
            strip.material = new T.MeshStandardMaterial({ color: 0xdaefe0, transparent: true, opacity: .35, side: T.DoubleSide });
            this.water.push(strip);
        }
        // Arrival dock, complete with posts, rope and mooring rings.
        const dock = new T.Group();
        dock.position.set(-5, heightAt(-5, 4.6) + .05, 4.6);
        for (let i = 0; i < 9; i++)
            box(dock, 1.55, .12, .23, 0xb4a484, 0, .03, i * .24 - .5);
        for (const x of [-.75, .75])
            for (const z of [-.6, 1.5]) {
                box(dock, .12, .95, .12, 0x85947b, x, .1, z);
                mesh(new T.TorusGeometry(.09, .025, 5, 12), palette.gold, dock, [x, .45, z]).rotation.x = Math.PI / 2;
            }
        this.arrivalDock=dock;this.scene.add(dock);
        const board = sign();
        board.position.set(-4.8, heightAt(-4.8, 1.9), 1.9);
        board.rotation.y = .35;
        kit.add(board);
        for (const [x, z] of [[-3.6, 2.8], [2.5, -.5], [5.8, 2.8], [-5.9, -.5]]) {
            const lamp = lantern();
            lamp.scale.setScalar(.7);
            lamp.position.set(x, heightAt(x, z), z);
            kit.add(lamp);
        }
        // Curated stones, shrubs, grass and small planted beds.
        for (let i = 0; i < 8; i++) {
            const a = i * 2.399, r = .78 + (i % 3) * .055, x = Math.cos(a) * 8 * r, z = Math.sin(a) * 5.7 * r;
            if(Math.hypot(x-START.x,z-START.z)<1.1)continue;
            const rock = mesh(new T.DodecahedronGeometry(.2 + (i % 3) * .09, 0), i % 2 ? 0xa8b29b : 0xc5c5a9, kit, [x, heightAt(x, z) + .06, z]);
            rock.scale.set(1.5, .65, 1);
            rock.rotation.set(.15 * i, i, .2);
        }
        for (let i = 0; i < 46; i++) {
            const a = i * 2.399, r = Math.sqrt((i + .5) / 46) * .88, x = Math.cos(a) * 7.8 * r, z = Math.sin(a) * 5.4 * r;
            if (Math.abs(z) < 1.3 || Math.abs(x - 1) < .9)
                continue;
            for (let k = 0; k < 3; k++) {
                const blade = mesh(new T.ConeGeometry(.035, .23 + (i % 3) * .05, 3), 0x819e78, kit, [x + k * .07, heightAt(x, z) + .12, z + k * .04]);
                blade.rotation.z = (k - 1) * .3;
            }
        }
        // Observation bench and a brass telescope.
        box(kit, 1.3, .12, .4, 0xb09f7d, 6.1, .7, 2.9);
        for (const x of [5.65, 6.55])
            box(kit, .09, .45, .35, 0x83917a, x, .47, 2.9);
        const telescope = new T.Group();
        telescope.position.set(6.4, heightAt(6.4, 2.1), 2.1);
        mesh(new T.CylinderGeometry(.07, .1, .8, 8), palette.wood, telescope, [0, .4, 0]);
        mesh(new T.CylinderGeometry(.15, .12, .75, 12), palette.gold, telescope, [0, 1.02, .18]).rotation.x = Math.PI * .38;
        kit.add(telescope);
        // The tide beacon is the island's quiet restoration landmark.
        this.beacon.position.set(.2, heightAt(.2, -3.9), -3.9);
        mesh(new T.CylinderGeometry(.68, .82, .24, 8), 0xc5bea1, this.beacon, [0, .12, 0]);
        mesh(new T.CylinderGeometry(.26, .38, 1.1, 8), 0xd6d0b1, this.beacon, [0, .72, 0]);
        this.beaconGlass = mesh(new T.OctahedronGeometry(.28, 0), palette.gold, this.beacon, [0, 1.54, 0]);
        this.beaconGlass.material = new T.MeshStandardMaterial({ color: 0xb8c6ac, emissive: 0xe9c57c, emissiveIntensity: 0, roughness: .3 });
        this.scene.add(this.beacon);
        this.sceneryKit=batchStatic(kit);this.scene.add(this.sceneryKit);
        this.scene.add(this.architecture);
        this.scene.add(this.harbor.root, this.coastal,this.passage.root);
        for (let i = 0; i < 5; i++) {
            const marker = mesh(new T.OctahedronGeometry(.13, 0), 0x8b9c96, this.scene, [-2 + i * 1.05, heightAt(-2 + i * 1.05, 2.65) + .4, 2.65]);
            marker.material = mat(0x8b9c96).clone();
            this.progressLights.push(marker);
            const element=new T.Group();for(let k=0;k<3;k++)box(element,.27,.08,.38,0xb7a179,-2+i*1.05,.08+heightAt(-2+i*1.05,2.65),2.3+k*.19,.025);element.visible=false;this.localRoutes.push(element);this.scene.add(element);
        }
        for (let i = 0; i < 36; i++) {
            const x = -6.7 + (i * 1.37) % 13, z = -3.7 + (i * 2.19) % 7.1;
            if (Math.abs(z) < .7 || Math.abs(x - 1) < .7)
                continue;
            flower(this.flowers, x, z, i % 3 === 0 ? 0xe8bfa8 : i % 3 === 1 ? 0xf2d8a1 : 0xece7c9);
        }
        const bloom = batchStatic(this.flowers);
        this.flowers = bloom;
        this.flowers.visible = false;
        this.scene.add(bloom);
        // A newly reconnected route, revealed after restoring the archive.
        this.route.position.set(6.8, .2, 1.2);
        for (let i = 0; i < 12; i++) {
            box(this.route, .25, .1, .55, palette.wood, i * .3, 0, 0);
            if (i % 2 === 0)
                box(this.route, .08, .45, .08, palette.gold, i * .3, .2, .3);
        }
        this.route.visible = false;
        this.scene.add(this.route);
        this.player.root.position.set(START.x, heightAt(START.x, START.z), START.z);
        this.scene.add(this.player.root);
        this.pip.root.position.set(-2.6, heightAt(-2.6, -.05), -.05);
        this.pip.root.rotation.y = .45;
        this.scene.add(this.pip.root);
        for (const id of Object.keys(landmarks) as Landmark[]) {
            const pos = landmarks[id], target = new T.Mesh(new T.BoxGeometry(id === 'archive' ? 3.5 : 1.3, id === 'archive' ? 3.5 : 1.8, id === 'archive' ? 3 : 1.3), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
            target.position.set(pos.x, id === 'archive' ? 1.8 : .9, id === 'archive' ? -2.2 : pos.z);
            target.userData.landmark = id;
            this.scene.add(target);
            this.hitTargets.push(target);
        }
        // Distant cloud banks and islands create actual atmospheric depth.
        for (let i = 0; i < 9; i++) {
            const cloud = new T.Group();
            const a = i * 2.4;
            cloud.position.set(Math.sin(a) * 24, -6 - (i % 3) * 1.7, Math.cos(a) * 20);
            for (let j = 0; j < 5; j++)
                ellipsoid(cloud, (j - 2) * 1.7, Math.sin(j) * .3, Math.cos(j) * .4, 2.2, 1, 1.6, 0xf1f3e9);
            cloud.scale.setScalar(.55 + (i % 3) * .18);
            this.clouds.push(cloud);
            this.scene.add(cloud);
        }
        for (const [x, z, s] of [[-20, -16, .42], [22, -19, .3], [-27, 8, .2]]) {
            const distant = makeTerrain().root;
            distant.scale.setScalar(s);
            distant.position.set(x, -1, z);
            const tr = tree(0, 0, 1);
            distant.add(tr.root);
            this.scene.add(distant);
        }
        for (let i = 0; i < 3; i++) {
            const bird = new T.Group();
            const l = mesh(new T.TorusGeometry(.2, .018, 3, 10, Math.PI), 0x73958a, bird, [-.18, 0, 0]);
            l.rotation.x = Math.PI / 2;
            const r = l.clone();
            r.position.x = .18;
            bird.add(r);
            bird.position.set(-6 + i * 4, 5 + i * .4, -9);
            this.birds.push(bird);
            this.scene.add(bird);
        }
        const dust = new Float32Array(36 * 3);
        for (let i = 0; i < 36; i++) {
            dust[i * 3] = Math.sin(i * 4.17) * 8;
            dust[i * 3 + 1] = .5 + (i % 7) * .4;
            dust[i * 3 + 2] = Math.cos(i * 2.39) * 5;
        }
        const dg = new T.BufferGeometry();
        dg.setAttribute('position', new T.BufferAttribute(dust, 3));
        this.motes = new T.Points(dg, new T.PointsMaterial({ color: 0xf7e8bd, size: .045, transparent: true, opacity: .55, sizeAttenuation: true }));
        this.scene.add(this.motes);
        this.camera.position.set(14, 17, 22);
        this.camera.lookAt(this.target);
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(container);
        this.resize();
        this.setComfort(comfort);
        window.addEventListener('keydown', this.keydown);
        window.addEventListener('keyup', this.keyup);
        window.addEventListener('blur', this.blur);
        this.renderer.domElement.addEventListener('pointerdown', this.click);
        this.renderer.domElement.addEventListener('webglcontextlost', this.contextLost);
        this.loop();
        callbacks.ready();
    }
    private resize() { const w = this.container.clientWidth, h = this.container.clientHeight, aspect = w / h; const size = aspect < .75 ? Math.max(12.7, 10.4 / aspect) : aspect < 1.3 ? 10.6 : 9.1; this.camera.left = -size * aspect; this.camera.right = size * aspect; this.camera.top = size; this.camera.bottom = -size; this.camera.near = .1; this.camera.far = 150; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); }
    setComfort(c: Comfort) {
        this.comfort=c;this.renderer.setPixelRatio(Math.min(devicePixelRatio,c.quality==='low'?1:1.75));
        const shadowSize=c.quality==='low'?1024:2048;
        if(this.sunlight.shadow.map&&this.sunlight.shadow.map.width!==shadowSize){this.sunlight.shadow.map.dispose();this.sunlight.shadow.map=null;}
        this.sunlight.shadow.mapSize.setScalar(shadowSize);this.motes.visible=c.quality==='high';this.resize();
    }
    setTouch(x:number,y:number){this.touch={x,y};}
    setMode(active: boolean, panel: string) {
        this.touch={x:0,y:0};
        this.active = active;
        this.panel = panel;
        this.keys.clear();
        if (panel || !active)
            this.callbacks.prompt(null);
    }
    setRestored(value: boolean) { this.restored = value ? 1 : 0; this.applyRestoration(); }
    reset() { this.inspect('explore'); this.cancelRoute(); this.aboard=false;this.sequenceHeight=null;this.path = []; this.arrival = null; this.position = { ...START }; this.player.root.position.set(START.x, heightAt(START.x, START.z), START.z); this.player.root.rotation.y = 0; this.finishRestoration(); this.setRestored(false); this.target.set(0, .2, 0); this.celebration = 0; }
    inspect(view:'explore'|'front'|'side'|'back'|'harbor'|'luffy') {
        this.inspection=view;this.keys.clear();this.touch={x:0,y:0};
        if(view!=='explore'){this.path=[];this.arrival=null;}
        const close=['front','side','back','luffy'].includes(view);
        const actor=view==='luffy'?this.harbor.friend.root:this.player.root;
        this.target.copy(close?actor.position.clone().add(new T.Vector3(0,1.12,0)):view==='harbor'||this.aboard?new T.Vector3(-4.4,1.25,7.6):new T.Vector3(this.position.x*.075,.25,1.5+this.position.z*.05));
        this.camera.zoom=close?this.camera.top/1.9:view==='harbor'||this.aboard?1.75:1;
        this.camera.updateProjectionMatrix();
    }
    goTo(id: Landmark) {
        this.inspect('explore');if(this.aboard){this.aboard=false;this.sequenceHeight=null;this.position={...START};}
        const p = landmarks[id];
        this.path = findPath(this.position, p,this.navigationContext());
        this.arrival = id;
        if (!this.path.length && Math.hypot(this.position.x - p.x, this.position.z - p.z) < 1.8)
            this.callbacks.interact(id);
    }
    interact() {
        let closest: Landmark | null = null, d = 1.9;
        for (const id of Object.keys(landmarks) as Landmark[]) {
            const p = landmarks[id], n = Math.hypot(this.position.x - p.x, this.position.z - p.z);
            if (n < d) {
                d = n;
                closest = id;
            }
        }
        if (closest)
            this.callbacks.interact(closest);
    }
    celebrate() { this.celebration = 1; }
    async restore() {
        if (this.restoring)
            return;
        this.restoring = true;
        this.restoreElapsed = 0;
        this.restored = 0;
        this.path = [];
        this.keys.clear();
        return new Promise<void>(resolve => { this.restoreResolve = resolve; });
    }
    skipRestoration() {
        if (this.restoring)
            this.finishRestoration();
    }
    private finishRestoration() {
        if (!this.restoring)
            return;
        this.restoring = false;
        this.restored = 1;
        this.applyRestoration();
        this.celebrate();
        this.restoreResolve?.();
        this.restoreResolve = null;
    }
    private applyRestoration() {
        this.flowers.visible = this.restored > .38;
        this.flowers.scale.set(1, Math.max(.001, this.restored), 1);
        this.route.visible = false;
        this.route.position.y = .2 - (1 - this.restored) * .4;
        for (const w of this.windows)
            (w.material as T.MeshStandardMaterial).emissiveIntensity = this.restored * .7;
        (this.beaconGlass.material as T.MeshStandardMaterial).emissiveIntensity = this.restored * 1.8;
        (this.beaconGlass.material as T.MeshStandardMaterial).color.setHex(this.restored > .5 ? 0xe8ca82 : 0xb8c6ac);
        this.sunlight.color.setHex(this.restored > .5 ? 0xffe5c4 : 0xffecd3);
    }
    private keydown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]') || this.panel || !this.active || this.restoring || this.inspection !== 'explore')
            return;
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)) {
            if (key.startsWith('arrow'))
                e.preventDefault();
            this.keys.add(key);
            if (key === 'e' && !e.repeat)
                this.interact();
        }
    };
    private keyup = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    private blur = () => this.keys.clear();
    private contextLost = (e: Event) => { e.preventDefault(); this.disposed = true; cancelAnimationFrame(this.frame); this.callbacks.error('The 3D graphics connection was interrupted. Reload to restore your saved journey, or close other graphics-heavy tabs.'); };
    private click = (e: PointerEvent) => {
        if (!this.active || this.panel || this.restoring || this.inspection !== 'explore')
            return;
        const r = this.renderer.domElement.getBoundingClientRect();
        this.pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
        this.ray.setFromCamera(this.pointer, this.camera);
        const hit = this.ray.intersectObjects(this.hitTargets)[0];
        if (hit) {
            this.goTo(hit.object.userData.landmark as Landmark);
            return;
        }
        const plane=new T.Plane(new T.Vector3(0,1,0),-.3),point=new T.Vector3();this.ray.ray.intersectPlane(plane,point);
        const ground = this.ray.intersectObject(this.ground)[0]??(classifySurface({x:point.x,z:point.z},this.navigationContext())==='dock'?{point}:undefined);
        if (!ground) this.notice.textContent='Open water is not a walking destination. Use a dock, bridge or ferry.';
        if (ground) {
            const destination={x:ground.point.x,z:ground.point.z};
            if(!walkable(destination,this.navigationContext())){this.notice.textContent='Water and obstacles cannot be crossed. Choose a bank or use the stone bridge.';return;}
            this.notice.textContent='';this.path = findPath(this.position,destination,this.navigationContext());
            this.arrival = null;
        }
    };
    private loop = () => {
        if (this.disposed)
            return;
        this.frame = requestAnimationFrame(this.loop);
        const rawDelta = this.clock.getDelta(), dt = Math.min(rawDelta, .05), time = this.clock.elapsedTime;
        if (this.active && !document.hidden) {
            this.durations.push(rawDelta * 1000);
            if (this.durations.length > 600)
                this.durations.shift();
        }
        let speed = 0;
        if (this.active && !this.panel && !this.restoring && !this.routeWalk && this.inspection === 'explore') {
            const dx = this.touch.x+Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')), dy = this.touch.y+Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
            let vx = 0, vz = 0;
            if (dx || dy) {
                const n = Math.hypot(dx, dy);
                vx = (dx * .844 + dy * .537) / n;
                vz = (-dx * .537 + dy * .844) / n;
                this.path = [];
                this.arrival = null;
            }
            else if (this.path.length) {
                const q = this.path[0], d = Math.hypot(q.x - this.position.x, q.z - this.position.z);
                if (d < .12)
                    this.path.shift();
                else {
                    vx = (q.x - this.position.x) / d;
                    vz = (q.z - this.position.z) / d;
                }
            }
            if (vx || vz) {
                this.sequenceHeight=null;
                const next = moveSafely(this.position, { x: this.position.x + vx * dt * 2.7, z: this.position.z + vz * dt * 2.7 },this.navigationContext());
                speed = Math.hypot(next.x - this.position.x, next.z - this.position.z) / Math.max(dt, .001);
                this.position = next;
                if(this.aboard&&this.position.z<7)this.aboard=false;
                const angle = Math.atan2(vx, vz);
                this.player.root.rotation.y += Math.atan2(Math.sin(angle - this.player.root.rotation.y), Math.cos(angle - this.player.root.rotation.y)) * Math.min(1, dt * 15);
            }
            if (!this.path.length && this.arrival) {
                const id = this.arrival;
                this.arrival = null;
                const q = landmarks[id];
                if (Math.hypot(q.x - this.position.x, q.z - this.position.z) < 1.8)
                    this.callbacks.interact(id);
            }
            let nearest: Landmark | null = null, best = 1.8;
            for (const id of Object.keys(landmarks) as Landmark[]) {
                const q = landmarks[id], d = Math.hypot(q.x - this.position.x, q.z - this.position.z);
                if (d < best) {
                    best = d;
                    nearest = id;
                }
            }
            if (nearest !== this.currentPrompt) {
                this.currentPrompt = nearest;
                this.callbacks.prompt(nearest);
            }
        }
        else
            this.currentPrompt = null;
        if (this.routeWalk) {
            const r=this.routeWalk,before={...this.position};r.elapsed+=dt;
            const phase=r.final?finalePhase(r.elapsed):r.elapsed<5?'crossing':r.elapsed<7?'ferry-boarding':r.elapsed<12?'sailing':'arrival';
            if(phase!==this.lastStory){this.lastStory=phase;this.callbacks.story?.(phase);}
            if(r.elapsed<5){const pose=alongPath(r.points,Math.min(1,r.elapsed/5));this.position={x:pose.x,z:pose.z};this.player.root.rotation.y=pose.angle;this.sequenceHeight=!r.final&&pose.x>6.3?.32:null;}
            else if(!r.final){this.passage.sail((r.elapsed-7)/5);const step=Math.max(0,Math.min(1,(r.elapsed-12)/2));this.position={x:this.passage.ferry.position.x-.2+step*1.5,z:1.4};this.sequenceHeight=.32-step*.2;this.player.root.rotation.y=Math.PI/2;speed=0;}
            else if(r.elapsed<10){this.position={x:-5,z:5.9};this.sequenceHeight=.34;this.player.root.rotation.y=.25;}
            else {const pose=boardingPose(r.elapsed);this.position={x:pose.player.x,z:pose.player.z};this.sequenceHeight=pose.player.y;this.player.root.rotation.y=r.elapsed>=18?Math.PI*.94:0;}
            speed=!r.final&&r.elapsed>=5&&!(r.elapsed>=12&&r.elapsed<14)?0:Math.hypot(before.x-this.position.x,before.z-this.position.z)/Math.max(.001,dt);
            if(r.elapsed>=(r.final?FINALE_DURATION:16))this.skipRoute();
        }
        const moving = speed > .1;
        this.gait = T.MathUtils.damp(this.gait, moving ? 1 : 0, 12, dt);
        this.gaitPhase += speed * dt * 4;
        const stride = Math.sin(this.gaitPhase) * .6 * this.gait;
        this.player.rightArm.rotation.z = T.MathUtils.damp(this.player.rightArm.rotation.z, this.panel ? -.3 : 0, 6, dt);
        this.player.leftLeg.rotation.x = stride;
        this.player.rightLeg.rotation.x = -stride;
        this.player.leftArm.rotation.x = -stride * .42;
        this.player.rightArm.rotation.x = stride * .30;
        this.celebration = Math.max(0, this.celebration - dt * .3);
        this.player.body.position.y = this.comfort.quiet ? 0 : (moving ? Math.abs(Math.sin(time * 10)) * .025 : Math.sin(time * 2) * .012) + Math.abs(Math.sin(this.celebration * Math.PI * 3)) * .12 * this.celebration;
        this.player.head.rotation.y = this.comfort.quiet || moving ? 0 : Math.sin(time * .65) * .09;
        this.player.sashTail.rotation.x = this.comfort.quiet ? 0 : Math.sin(time * 3) * .045;
        this.harbor.animate(time,this.comfort.quiet);
        this.player.root.position.set(this.position.x, this.sequenceHeight??walkingHeight(this.position.x, this.position.z,this.navigationContext()), this.position.z);
        const seq=this.routeWalk;
        this.harbor.setDestinationVisible(this.islandIndex===3||this.inspection==='harbor'||this.inspection==='luffy');
        if(seq?.final){
            const pose=boardingPose(seq.elapsed);this.harbor.friend.root.position.set(pose.friend.x,pose.friend.y,pose.friend.z);
            this.harbor.friend.root.rotation.y=seq.elapsed<10?Math.PI*.95:seq.elapsed>=18?Math.PI*.93:0;
            if(seq.elapsed>=5&&seq.elapsed<10){this.harbor.friend.rightArm.rotation.z=1.95+Math.sin(time*5)*.13;this.harbor.friend.rightArm.rotation.x=-.15;}
            if(seq.elapsed>=13.5&&seq.elapsed<18){const gait=Math.sin((seq.elapsed-13.5)*10)*.32;this.harbor.friend.leftLeg.rotation.x=gait;this.harbor.friend.rightLeg.rotation.x=-gait;}
        }else{
            const finished=this.voyageComplete&&this.islandIndex===3;this.harbor.friend.root.position.set(finished?-4.9:-4.55,finished?.55:.34,finished?8.9:6.6);this.harbor.friend.root.rotation.y=finished?Math.PI*.93:Math.PI*.88;
            this.harbor.friend.leftLeg.rotation.x=0;this.harbor.friend.rightLeg.rotation.x=0;
        }
        if (!this.comfort.quiet) {
            this.pip.body.rotation.z = Math.sin(time * 1.7) * .025;
            this.pip.head.rotation.y = Math.sin(time * .7) * .18;
            this.pip.wingL.rotation.z = Math.sin(time * 2) * .04 - this.celebration * .5;
            this.pip.wingR.rotation.z = -Math.sin(time * 2) * .04 + this.celebration * .5;
            for (const t of this.foliage)
                t.leaves.rotation.z = Math.sin(time * .6 + t.phase) * .018;
            this.clouds.forEach((c, i) => c.position.x += Math.sin(time * .05 + i) * dt * .05);
            this.birds.forEach((b, i) => { b.position.x = Math.sin(time * .07 + i * 2) * 12; b.position.y = 5 + Math.sin(time * .6 + i) * .15; b.rotation.z = Math.sin(time * 3 + i) * .05; });
            this.motes.rotation.y = time * .008;
            this.water.forEach((w, i) => { w.scale.x = 1 + Math.sin(time * 1.5 + i) * .035; });
        }
        if (this.restoring) {
            this.restoreElapsed += dt;
            this.restored = Math.min(1, this.restoreElapsed / 5.8);
            this.applyRestoration();
            if (this.restoreElapsed >= 6.2)
                this.finishRestoration();
        }
        const closeView=['front','side','back','luffy'].includes(this.inspection), actor=this.inspection==='luffy'?this.harbor.friend.root:this.player.root;
        this.harbor.cutaway(closeView);
        this.player.root.visible=this.inspection!=='luffy';
        this.harbor.friend.root.visible=(this.islandIndex===3||this.inspection==='harbor'||this.inspection==='luffy')&&(!closeView||this.inspection==='luffy');
        this.architecture.visible=this.islandIndex===0&&!closeView;
        this.extraKit.visible=!closeView;this.coastal.visible=!closeView;this.sceneryKit.visible=!closeView;
        this.passage.root.visible=this.islandIndex!==3&&!closeView;
        this.foliage.forEach((t,i)=>t.leaves.parent!.visible=!closeView&&(this.islandIndex<2||(this.islandIndex===2&&i%2===0)));
        const focus = this.routeWalk&&!this.routeWalk.final?new T.Vector3(this.position.x*.55+3, .5,1.4):closeView ? actor.position.clone().add(new T.Vector3(0,1.12,0)) : this.routeWalk?.final||this.aboard ? new T.Vector3(-4.4,1.25,7.6) : this.inspection==='harbor' ? new T.Vector3(-4.3,1.1,7.4) : this.restoring ? new T.Vector3(1, .7, -1) : this.panel === 'Archive puzzle' || this.panel === 'Guided repair' ? new T.Vector3(2, 1, -1) : new T.Vector3(this.position.x * .075, .25, 1.5+this.position.z * .05);
        this.target.lerp(focus, this.comfort.quiet ? 1 : 1 - Math.exp(-dt * 1.5));
        const sway = 0;
        this.cameraTarget.set(this.target.x + 14 + sway, this.target.y + 17, this.target.z + 22);
        if(closeView){const angle=actor.rotation.y+(this.inspection==='side'?Math.PI*.38:this.inspection==='back'?Math.PI:0);this.cameraTarget.copy(this.target).add(new T.Vector3(Math.sin(angle)*1.6,.35,Math.cos(angle)*1.6));}
        if(!closeView&&(this.inspection==='harbor'||this.routeWalk?.final||this.aboard))this.cameraTarget.copy(this.target).add(new T.Vector3(11,11,-16));
        this.camera.position.copy(this.cameraTarget);
        this.camera.lookAt(this.target);
        const desiredZoom=closeView?this.camera.top/1.9:this.inspection==='harbor'||this.routeWalk?.final||this.aboard?1.75:this.panel==='Archive puzzle'?1.06:1;
        this.camera.zoom = this.comfort.quiet?desiredZoom:T.MathUtils.damp(this.camera.zoom,desiredZoom,4,dt);
        this.camera.updateProjectionMatrix();
        this.renderer.domElement.dataset.position=JSON.stringify(this.position);this.renderer.domElement.dataset.surface=classifySurface(this.position,this.navigationContext());
        this.renderer.render(this.scene, this.camera);
        this.renderer.domElement.dataset.shadowSize=String(this.sunlight.shadow.map?.width??0);
        this.renderer.domElement.dataset.pixelRatio=String(this.renderer.getPixelRatio());
        this.stats = { drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, frames: this.stats.frames + 1, elapsed: this.stats.elapsed + rawDelta };
        if (this.stats.frames % 120 === 0) {
            this.renderer.domElement.dataset.frameMedianMs = String([...this.durations].sort((a, b) => a - b)[Math.floor(this.durations.length / 2)] || 0);
            this.renderer.domElement.dataset.frameP95Ms = String([...this.durations].sort((a, b) => a - b)[Math.floor(this.durations.length * .95)] || 0);
            this.renderer.domElement.dataset.samples = String(this.durations.length);
            this.renderer.domElement.dataset.drawCalls = String(this.stats.drawCalls);
            this.renderer.domElement.dataset.triangles = String(this.stats.triangles);
        }
    };
    setIsland(index: number, count: number, completed=Array.from({length:5},(_,i)=>i<count)) {
        this.renderer.domElement.setAttribute('aria-label',`Interactive 3D ${ISLANDS[index]}. Use WASD or arrows to walk, E to interact, or click a destination.`);
        this.islandIndex=index;this.passage.reset();this.routeOpen=count===5;this.passage.root.visible=index!==3;this.passage.setProgress(completed,count===5);this.arrivalDock.visible=index!==3;this.harbor.setDestinationVisible(index===3);
        this.extraKit.traverse(o => { if (o instanceof T.Mesh)
            o.geometry.dispose(); });
        this.scene.remove(this.extraKit);
        this.extraKit = islandKit(index);
        this.scene.add(this.extraKit);
        this.architecture.visible = index === 0;
        this.coastal.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});this.scene.remove(this.coastal);this.coastal=coastalMilestone(index);this.scene.add(this.coastal);this.passage.setTheme(index);
        this.scene.fog = new T.Fog(0xa8b5b2, 65,125);
        this.scene.background = new T.Color(0x99adb1);
        (this.ground.material as T.Material).dispose();
        this.ground.material = new T.MeshStandardMaterial({ color: [0xffffff,0xf0f4e6,0xf2e5d1,0xe2ebeb][index], vertexColors:true, roughness: 1, side: T.DoubleSide });
        this.setRestored(count === 5);
        this.progressLights.forEach((m, i) => (m.material as T.MeshStandardMaterial).color.setHex(completed[i] ? 0x79c5a4 : 0x718b89));
        this.localRoutes.forEach(r=>r.visible=false);
        this.foliage.forEach((t,i)=>{t.leaves.parent!.visible=index===0||index===1||(index===2&&i%2===0);});
    }
    setVoyageComplete(value:boolean){this.voyageComplete=value;}
    showAboard(){this.voyageComplete=true;this.aboard=true;const p=boardingPose(FINALE_DURATION).player;this.position={x:p.x,z:p.z};this.sequenceHeight=p.y;this.player.root.rotation.y=Math.PI*.94;}
    followRoute(final=false){this.inspect('explore');this.aboard=false;this.path=[];this.arrival=null;this.keys.clear();this.lastStory='';return new Promise<void>(resolve=>{this.routeWalk={elapsed:0,from:{...this.position},final,points:[{...this.position},...findPath(this.position,final?{x:-5,z:5.9}:{x:9.8,z:1.4},{routeOpen:true,harbor:final,island:this.islandIndex})],resolve};});}
    cancelRoute(){this.path=[];this.arrival=null;this.keys.clear();if(!this.routeWalk)return;const r=this.routeWalk;this.routeWalk=null;this.position={...r.from};this.sequenceHeight=null;this.aboard=false;this.lastStory='';this.passage.reset();r.resolve();}
    skipRoute(){if(!this.routeWalk)return;const r=this.routeWalk;this.routeWalk=null;if(r.final){this.showAboard();this.callbacks.story?.('aboard');}else{this.position={x:9.8,z:1.4};this.sequenceHeight=.32;}r.resolve();}
    diagnostics() { return { ...this.stats, webgl: true, position: { ...this.position }, restored: this.restored, dpr: this.renderer.getPixelRatio() }; }
    dispose() {
        this.disposed = true;
        cancelAnimationFrame(this.frame);
        this.observer.disconnect();
        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('keyup', this.keyup);
        window.removeEventListener('blur', this.blur);
        this.renderer.dispose();
        this.scene.traverse(o => {
            if (o instanceof T.Mesh)
                o.geometry.dispose();
        });
    }
}


