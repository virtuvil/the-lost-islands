import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { heightAt, rim } from './navigation';
import {RIVER, RIVER_HALF_WIDTH} from './surfaces';
export const palette = { grass: 0x648b68, lightGrass: 0x87a276, stone: 0x858e7c, cream: 0xeee0bd, plaster: 0xd8bc91, roof: 0xb9694c, tile: 0xc9845f, wood: 0x957048, darkWood: 0x425c4e, water: 0x247f89, coral: 0xb9694c, gold: 0xe8b85e, leaf: 0x567f5f };
const materials = new Map<number, T.MeshStandardMaterial>();
export function mat(color: number) {
    if (!materials.has(color))
        materials.set(color, new T.MeshStandardMaterial({ color, roughness: .88 }));
    return materials.get(color)!;
}
export function mesh(g: T.BufferGeometry, c: number, parent: T.Object3D, pos = [0, 0, 0]) {
    const m = new T.Mesh(g, mat(c));
    m.position.set(...pos as [
        number,
        number,
        number
    ]);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
}
export function rounded(w: number, h: number, d: number, r = .1) { const s = new T.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); const g = new T.ExtrudeGeometry(s, { depth: Math.max(.02, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r * .5, bevelSegments: 2, steps: 1, curveSegments: 4 }); g.translate(0, 0, -d / 2 + r); return g; }
export function box(p: T.Object3D, w: number, h: number, d: number, c: number, x = 0, y = 0, z = 0, r = .05) { return mesh(rounded(w, h, d, r), c, p, [x, y, z]); }
export function ellipsoid(p: T.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, c: number) { const m = mesh(new T.SphereGeometry(1, 16, 12), c, p, [x, y, z]); m.scale.set(sx, sy, sz); return m; }
function tube(p: T.Object3D, points: T.Vector3[], radius: number, c: number) { return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 12, radius, 7, false), c, p); }
function archShape(w: number, h: number) { const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, 0); return s; }
export function arch(p: T.Object3D, w: number, h: number, d: number, c: number, x: number, y: number, z: number) { const g = new T.ExtrudeGeometry(archShape(w, h), { depth: d, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 12 }); return mesh(g, c, p, [x, y, z]); }
export function makeTerrain() {
    const root = new T.Group(), N = 144, R = 64, verts: number[] = [], colors: number[] = [], indices: number[] = [];
    const a = new T.Color(), b = new T.Color();
    for (let j = 0; j <= R; j++)
        for (let i = 0; i <= N; i++) {
            const theta = i / N * Math.PI * 2, r = j / R, edge = rim(theta), x = Math.cos(theta) * 8.7 * edge * r, z = Math.sin(theta) * 6.3 * edge * r;
            verts.push(x, heightAt(x, z) - (r > .94 ? (r - .94) * 1.3 : 0), z);
            a.setHex(0x63836a);
            b.setHex(0x95a67b);
            a.lerp(b, .3 + .24 * Math.sin(x * .5 + z * .6));
            colors.push(a.r, a.g, a.b);
            if (j < R && i < N) {
                const k = j * (N + 1) + i;
                indices.push(k, k + N + 1, k + 1, k + 1, k + N + 1, k + N + 2);
            }
        }
    const top = new T.BufferGeometry();
    top.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
    top.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    top.setIndex(indices);
    top.computeVertexNormals();
    const surface = new T.Mesh(top, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: T.DoubleSide }));
    surface.receiveShadow = true;
    root.add(surface);
    const v: number[] = [], c: number[] = [], idx: number[] = [];
    const rings = [{ r: 1, y: .12 }, { r: 1.015, y: -.3 }, { r: .95, y: -1.2 }, { r: .73, y: -2.65 }, { r: .38, y: -3.5 }, { r: .05, y: -3.9 }];
    rings.forEach((ring, j) => {
        for (let i = 0; i <= N; i++) {
            const t = i / N * Math.PI * 2, rad = rim(t) * (ring.r + (j > 1 ? .035 * Math.sin(i * 1.7 + j) : 0));
            v.push(Math.cos(t) * 8.7 * rad, ring.y + (j > 1 ? .20 * Math.sin(i * .8) : 0), Math.sin(t) * 6.3 * rad);
            a.setHex(j === 0 ? 0xd8bc91 : j === 1 ? 0xab9677 : j < 4 ? 0x7c8578 : 0x516e68);
            a.multiplyScalar(.94 + .08 * Math.sin(i * 2 + j));
            c.push(a.r, a.g, a.b);
            if (j < rings.length - 1 && i < N) {
                const k = j * (N + 1) + i;
                idx.push(k, k + 1, k + N + 1, k + 1, k + N + 2, k + N + 1);
            }
        }
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const cliff = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: T.DoubleSide }));
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    root.add(cliff);
    return { root, surface };
}
export function pathRibbon(p: T.Object3D, points: [
    number,
    number
][], width: number, color = 0xdfd1ad) {
    const curve = new T.CatmullRomCurve3(points.map(([x, z]) => new T.Vector3(x, 0, z))), v: number[] = [], idx: number[] = [];
    for (let i = 0; i <= 100; i++) {
        const t = i / 100, q = curve.getPoint(t), tan = curve.getTangent(t);
        for (const side of [-1, 1]) {
            const x = q.x + tan.z * width / 2 * side, z = q.z - tan.x * width / 2 * side;
            v.push(x, heightAt(x, z) + .035, z);
        }
        if (i < 100) {
            const k = i * 2;
            idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = mesh(g, color, p);
    (m.material as T.Material).side = T.DoubleSide;
    return m;
}
export function tree(x: number, z: number, scale: number, variant = 0) {
    const root = new T.Group();
    root.position.set(x, heightAt(x, z), z);
    root.scale.setScalar(scale);
    tube(root, [new T.Vector3(), new T.Vector3(.04, .9, 0), new T.Vector3(-.12, 1.85, .05)], .15, 0x8d8b6d);
    tube(root, [new T.Vector3(0, 1, 0), new T.Vector3(.4, 1.45, 0), new T.Vector3(.65, 1.8, .1)], .07, 0x8d8b6d);
    const leaves = new T.Group();
    root.add(leaves);
    for (let i = 0; i < 5; i++) {
        const g = new T.SphereGeometry(1, 16, 12), pos = g.getAttribute('position');
        for (let j = 0; j < pos.count; j++) {
            const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j), s = 1 + .075 * Math.sin(x * 7 + z * 5 + i);
            pos.setXYZ(j, x * s, y * s, z * s);
        }
        g.computeVertexNormals();
        const m = mesh(g, [0x65806a, 0x7c9172, 0x8c9b79][(variant + i) % 3], leaves, [Math.sin(i * 2.4) * .55, 1.85 + (i === 0 ? .8 : .25), Math.cos(i * 2.4) * .5]);
        m.scale.set(i === 0 ? .88 : .75, i === 0 ? 1 : .65, .78);
        m.rotation.set(.1 * i, i, .05 * i);
    }
    return { root, leaves };
}
export function building(kind: 'archive' | 'cottage') {
    const root = new T.Group(), w = kind === 'archive' ? 3.25 : 2.7, d = kind === 'archive' ? 2.7 : 2.3, h = kind === 'archive' ? 2.25 : 1.9;
    box(root, w, h, d, palette.plaster, 0, h / 2, 0, .13);
    box(root, w + .18, .2, d + .16, 0xc2b999, 0, .08, 0, .07);
    box(root, w + .07, .12, d + .05, palette.cream, 0, h - .07, 0);
    // A shaped, gently sagging terracotta roof with individually laid overlapping tiles.
    const roof = new T.Shape();
    roof.moveTo(-w * .64, 0);
    roof.quadraticCurveTo(-w * .38, .4, 0, 1.4);
    roof.quadraticCurveTo(w * .38, .4, w * .64, 0);
    roof.lineTo(w * .64, -.14);
    roof.quadraticCurveTo(w * .35, .22, 0, 1.23);
    roof.quadraticCurveTo(-w * .35, .22, -w * .64, -.14);
    roof.closePath();
    const rg = new T.ExtrudeGeometry(roof, { depth: d + .6, bevelEnabled: true, bevelThickness: .05, bevelSize: .03, bevelSegments: 2, curveSegments: 12 });
    mesh(rg, palette.roof, root, [0, h, -d / 2 - .3]);
    for (const side of [-1, 1])
        for (let row = 0; row < 5; row++)
            for (let col = 0; col < 8; col++) {
                const u = (row + .3) / 5, x = side * u * w * .62, y = h + 1.4 * (1 - u) ** 1.3;
                const tile = box(root, w * .145, .07, (d + .64) / 8 * .98, (row + col) % 4 === 0 ? 0xdca28a : 0xcf967d, x, y + .035, -d / 2 - .15 + col * (d + .3) / 8, .035);
                tile.rotation.z = side * -.7;
            }
    box(root, .22, .18, d + .7, 0xe4af91, 0, h + 1.42, 0, .08);
    // Front door, window recesses, frames, a small porch and three worn steps.
    arch(root, .93, 1.65, .10, 0xeedfc2, -.55, .08, d / 2 + .015);
    arch(root, .71, 1.43, .09, palette.darkWood, -.55, .1, d / 2 + .11);
    box(root, .05, 1.1, .03, 0x82937c, -.55, .69, d / 2 + .22);
    ellipsoid(root, -.32, .73, d / 2 + .25, .045, .045, .035, palette.gold);
    const windows: T.Mesh[] = [];
    for (const x of [w * .29, -w * .33]) {
        const front = x > 0;
        const wx = front ? x : -w / 2 - .035, wz = front ? d / 2 + .015 : .0;
        const frame = arch(root, .74, .98, .08, palette.cream, wx, .82, wz);
        const glass = arch(root, .55, .77, .035, 0x739d91, wx, .89, wz + .09);
        if (!front) {
            frame.rotation.y = -Math.PI / 2;
            glass.rotation.y = -Math.PI / 2;
            glass.position.x -= .08;
        }
        else {
            box(root, .045, .75, .04, palette.cream, wx, 1.26, wz + .15);
            box(root, .55, .045, .04, palette.cream, wx, 1.19, wz + .15);
        }
        glass.material = new T.MeshStandardMaterial({ color: 0x739d91, emissive: 0xecc681, emissiveIntensity: 0, roughness: .6 });
        windows.push(glass);
    }
    box(root, 1.6, .12, .8, 0xbeb18b, -.55, .04, d / 2 + .4);
    for (let i = 0; i < 3; i++)
        box(root, 1.3, .13, .25, 0xc8bd9d, -.55, -.02 - i * .07, d / 2 + .88 + i * .2);
    box(root, .45, 1, .44, palette.cream, w * .28, h + .65, -d * .2);
    box(root, .58, .16, .57, 0xb9ae8e, w * .28, h + 1.19, -d * .2);
    // Shaped archive sign, hanging from two small bronze pins.
    box(root, kind === 'archive' ? 1.5 : 1.1, .35, .1, 0xf4e8cc, 0, h - .1, d / 2 + .23, .08);
    if (kind === 'archive') {
        for (let i = 0; i < 5; i++)
            box(root, .08, .15, .02, 0x8c9679, -.4 + i * .2, h - .1, d / 2 + .3);
        arch(root, .50, .60, .06, 0xe7c787, 0, h + .35, d / 2 + .31);
    }
    else {
        for (const xx of [-.95, .95]) {
            box(root, .1, 1.9, .1, palette.wood, xx, .85, d / 2 + .65);
        }
        ;
        box(root, 2.35, .13, .9, palette.darkWood, 0, 1.8, d / 2 + .4);
    }
    return { root, windows };
}
export function bridge() {
    const root = new T.Group();
    const shape = new T.Shape();
    shape.moveTo(-1.45, 0);
    shape.quadraticCurveTo(0, .75, 1.45, 0);
    shape.lineTo(1.45, -.45);
    shape.quadraticCurveTo(0, .14, -1.45, -.45);
    shape.closePath();
    const g = new T.ExtrudeGeometry(shape, { depth: 1.3, bevelEnabled: true, bevelThickness: .07, bevelSize: .04, bevelSegments: 2, curveSegments: 18 });
    mesh(g, 0xc1bea1, root, [0, .08, -.65]);
    for (const side of [-1, 1]) {
        for (let i = 0; i < 7; i++) {
            const x = -1.3 + i * .43, y = .55 + .34 * (1 - (x / 1.4) ** 2);
            box(root, .21, .45, .18, 0xc8c8ad, x, y, side * .63, .06);
        }
        tube(root, [new T.Vector3(-1.45, .65, side * .63), new T.Vector3(0, 1.05, side * .63), new T.Vector3(1.45, .65, side * .63)], .095, 0xd7d2b6);
    }
    return root;
}
export function sign() {
    const root = new T.Group();
    box(root, .13, 1.1, .13, palette.wood, 0, .5, 0);
    box(root, 1.35, .8, .16, palette.cream, 0, 1.05, 0, .08);
    for (let i = 0; i < 2; i++) {
        box(root, .75, .055, .02, 0x9ca487, -.1, 1.22 - i * .25, .1);
        box(root, .15, .12, .025, palette.coral, .43, 1.22 - i * .25, .1);
    }
    return root;
}
export function lantern() {
    const root = new T.Group();
    box(root, .08, 1.3, .08, palette.wood, 0, .6, 0);
    box(root, .38, .47, .32, 0xeacb87, 0, 1.3, 0);
    box(root, .5, .12, .45, palette.darkWood, 0, 1.58, 0);
    box(root, .4, .08, .36, palette.darkWood, 0, 1.03, 0);
    for (const x of [-.17, .17])
        box(root, .04, .52, .035, palette.darkWood, x, 1.3, .16);
    return root;
}
export function explorer() {
    const root = new T.Group(), body = new T.Group(), leftLeg = new T.Group(), rightLeg = new T.Group(), leftArm = new T.Group(), rightArm = new T.Group(), head = new T.Group();
    root.add(body);
    body.add(leftLeg, rightLeg, leftArm, rightArm, head);
    leftLeg.position.set(-.13, .32, 0);
    rightLeg.position.set(.13, .32, 0);
    for (const [leg, x] of [[leftLeg, 0], [rightLeg, 0]] as const) {
        mesh(new T.CapsuleGeometry(.095, .17, 4, 8), 0x526d64, leg, [x, -.12, 0]);
        ellipsoid(leg, 0, -.29, .06, .12, .08, .18, 0x595d52);
    }
    const coat = new T.LatheGeometry([new T.Vector2(.21, .29), new T.Vector2(.26, .4), new T.Vector2(.25, .68), new T.Vector2(.16, .78)], 20);
    mesh(coat, 0xd8ad85, body);
    leftArm.position.set(-.27, .67, 0);
    rightArm.position.set(.27, .67, 0);
    for (const arm of [leftArm, rightArm]) {
        mesh(new T.CapsuleGeometry(.09, .20, 4, 8), 0xd4a47e, arm, [0, -.14, 0]);
        ellipsoid(arm, 0, -.3, .02, .075, .09, .075, 0xeac9a0);
    }
    head.position.y = .99;
    ellipsoid(head, 0, 0, 0, .27, .28, .25, 0xf0d2aa);
    ellipsoid(head, 0, -.07, .23, .065, .055, .065, 0xe3b990);
    for (const x of [-.105, .105]) {
        ellipsoid(head, x, .015, .23, .025, .035, .022, 0x3b5149);
        box(head, .07, .014, .025, 0x997c5d, x, .09, .22);
    }
    const hat = new T.LatheGeometry([new T.Vector2(0, .27), new T.Vector2(.36, .27), new T.Vector2(.38, .29), new T.Vector2(.27, .33), new T.Vector2(.23, .34), new T.Vector2(.22, .53), new T.Vector2(.17, .57), new T.Vector2(0, .58)], 28);
    mesh(hat, 0xe7cc9d, head, [0, -.03, 0]);
    mesh(new T.TorusGeometry(.225, .032, 6, 28), 0x7d9b85, head, [0, .33, 0]).rotation.x = Math.PI / 2;
    mesh(new T.TorusGeometry(.18, .065, 8, 20), palette.coral, body, [0, .76, 0]).rotation.x = Math.PI / 2;
    const scarf = box(body, .13, .31, .065, 0xc77d63, .19, .58, -.19, .04);
    scarf.rotation.z = -.25;
    const bag = box(body, .20, .28, .15, 0x6f8d75, -.27, .45, -.12, .05);
    box(body, .2, .06, .16, 0x8da38a, -.27, .55, -.1);
    tube(body, [new T.Vector3(-.24, .62, -.15), new T.Vector3(0, .79, .07), new T.Vector3(.22, .57, .13)], .025, 0x70806c);
    return { root, body, leftLeg, rightLeg, leftArm, rightArm, head, scarf, bag };
}
export function pelican() {
    const root = new T.Group(), body = new T.Group(), head = new T.Group(), wingL = new T.Group(), wingR = new T.Group();
    root.add(body);
    ellipsoid(body, 0, .52, 0, .34, .45, .30, 0xf4edda);
    ellipsoid(body, 0, .43, .22, .26, .28, .16, 0xe0e4d4);
    tube(body, [new T.Vector3(0, .65, 0), new T.Vector3(0, 1.08, -.08), new T.Vector3(0, 1.33, .05)], .13, 0xf6efdb);
    head.position.set(0, 1.35, .06);
    body.add(head);
    ellipsoid(head, 0, 0, 0, .2, .23, .19, 0xf8f0dc);
    const beak = new T.Shape();
    beak.moveTo(-.14, 0);
    beak.lineTo(.14, 0);
    beak.quadraticCurveTo(.13, .45, 0, .58);
    beak.quadraticCurveTo(-.13, .45, -.14, 0);
    const bg = new T.ExtrudeGeometry(beak, { depth: .08, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 2 });
    const bm = mesh(bg, 0xd6ad68, head, [0, -.03, .13]);
    bm.rotation.x = Math.PI / 2;
    ellipsoid(head, 0, -.12, .37, .14, .12, .26, 0xe2bf7c);
    for (const x of [-.13, .13]) {
        ellipsoid(head, x, .04, .15, .028, .035, .025, 0x344e47);
    }
    const hat = new T.LatheGeometry([new T.Vector2(0, 0), new T.Vector2(.24, 0), new T.Vector2(.26, .04), new T.Vector2(.19, .07), new T.Vector2(.17, .18), new T.Vector2(0, .18)], 20);
    mesh(hat, palette.darkWood, head, [0, .18, 0]);
    box(head, .08, .07, .025, palette.gold, 0, .28, .19);
    for (const [wing, side] of [[wingL, -1], [wingR, 1]] as const) {
        wing.position.set(side * .28, .68, 0);
        body.add(wing);
        const m = ellipsoid(wing, side * .035, -.16, -.015, .12, .28, .24, 0xd6dfd1);
        m.rotation.z = side * -.18;
    }
    for (const x of [-.15, .15]) {
        mesh(new T.CylinderGeometry(.035, .035, .2, 6), 0xc69957, root, [x, .15, 0]);
        const foot = ellipsoid(root, x, .04, .1, .13, .035, .19, 0xd4ac67);
        foot.rotation.y = x < 0 ? -.2 : .2;
    }
    mesh(new T.TorusGeometry(.15, .045, 6, 16), palette.coral, body, [0, .86, .03]).rotation.x = Math.PI / 2;
    box(body, .28, .23, .1, 0x879c7c, -.2, .45, .23);
    return { root, body, head, wingL, wingR };
}
export function flower(p: T.Object3D, x: number, z: number, color: number) {
    const y = heightAt(x, z);
    const root = new T.Group();
    root.position.set(x, y, z);
    mesh(new T.CylinderGeometry(.013, .018, .23, 4), 0x6e936b, root, [0, .1, 0]);
    for (let i = 0; i < 5; i++) {
        const t = i / 5 * Math.PI * 2;
        ellipsoid(root, Math.cos(t) * .06, .23, Math.sin(t) * .06, .055, .025, .055, color);
    }
    ellipsoid(root, 0, .25, 0, .035, .025, .035, 0xd5b875);
    p.add(root);
    return root;
}
/** Static scenery is merged by material, keeping animated actors separate. */
export function batchStatic(root: T.Group) {
    root.updateMatrixWorld(true);
    const map = new Map<T.Material, T.BufferGeometry[]>();
    root.traverse(o => {
        if (o instanceof T.Mesh && o.material instanceof T.Material) {
            const g = o.geometry.clone();
            g.applyMatrix4(o.matrixWorld);
            if (!g.getAttribute('normal'))
                g.computeVertexNormals();
            const list = map.get(o.material) || [];
            list.push(g);
            map.set(o.material, list);
        }
    });
    const result = new T.Group();
    for (const [material, geoms] of map) {
        const g = mergeGeometries(geoms.map(x => x.index ? x.toNonIndexed() : x));
        if (g) {
            const m = new T.Mesh(g, material);
            m.castShadow = true;
            m.receiveShadow = true;
            result.add(m);
        }
        for (const g of geoms)
            g.dispose();
    }
    return result;
}

export function riverMesh(){const root=new T.Group();for(let i=1;i<RIVER.length;i++){const a=RIVER[i-1],b=RIVER[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len;for(const [width,color,y] of [[RIVER_HALF_WIDTH*2+.07,0x809d91,.06],[RIVER_HALF_WIDTH*2,0x547f83,.075],[RIVER_HALF_WIDTH*.9,0x3d6972,.077]]){const v=[];for(const p of [a,b])for(const side of [-1,1])v.push(p.x+nx*width/2*side,y,p.z+nz*width/2*side);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();const m=mesh(g,color,root);m.castShadow=false;(m.material as T.MeshStandardMaterial).side=T.DoubleSide;}}return root;}
