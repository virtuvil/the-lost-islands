import * as T from 'three';
import { box, mesh, mat, building, batchStatic, flower, palette } from './assets';
import { heightAt } from './navigation';
export function islandKit(index: number) {
    const root = new T.Group();
    if (index === 1) {
        // Open-sided message pavilion, pergola and planted beds replace the archive.
        const p = new T.Group();
        p.position.set(3.3, heightAt(3.3, -2.2), -2.2);
        box(p, 3.5, .2, 3, 0x9aab9a, 0, .1, 0);
        for (const x of [-1.4, 1.4])
            for (const z of [-1.15, 1.15])
                box(p, .18, 2.3, .18, 0xc8c6a5, x, 1.2, z);
        for (let i = 0; i < 9; i++)
            box(p, 3.7, .16, .16, 0x7f9780, 0, 2.4, -1.3 + i * .33);
        box(p, 2.1, 1.1, .12, 0x375e5d, 0, 1.2, -1.1);
        root.add(p);
        const pergola = new T.Group();
        pergola.position.set(-4.5, heightAt(-4.5, -2.6), -2.6);
        for (const x of [-1.1, 1.1])
            for (const z of [-.9, .9])
                box(pergola, .15, 2, .15, 0xafb498, x, 1, z);
        for (let i = 0; i < 7; i++)
            box(pergola, 2.7, .13, .18, 0x7f967b, 0, 2.05, -1 + i * .33);
        root.add(pergola);
        for (let i = 0; i < 16; i++)
            flower(root, -6 + (i * 1.7) % 12, -3.8 + (i * 2.1) % 6.8, i % 2 ? 0xd69dba : 0xe8cba5);
    }
    else if (index === 2) {
        for (const [x, z] of [[3.3, -2.2], [-4.5, -2.6]]) {
            const b = building('archive');
            b.root.position.set(x, heightAt(x, z), z);
            root.add(b.root);
        }
        const crane = new T.Group();
        crane.position.set(-6.2, .4, -.7);
        box(crane, .3, 4, .3, 0x5f7b7b, 0, 2, 0);
        box(crane, 3.6, .25, .24, 0x788c80, 1.4, 4, 0);
        box(crane, .035, 1.8, .035, 0x65787d, 2.8, 3, 0);
        box(crane, .5, .18, .5, 0xc2a67b, 2.8, 2.05, 0);
        root.add(crane);
        for (let i = 0; i < 9; i++)
            box(root, .5, .5, .55, i % 2 ? 0xb79265 : 0x9b7654, 5.7 + (i % 3) * .45, .5 + Math.floor(i / 3) * .45, -3.2, .04);
    }
    else if (index === 3) {
        const observatory = new T.Group();
        observatory.position.set(3.3, heightAt(3.3, -2.2), -2.2);
        mesh(new T.CylinderGeometry(1.5, 1.65, 2.2, 20), 0x92a6af, observatory, [0, 1.1, 0]);
        const dome = mesh(new T.SphereGeometry(1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), 0x536f88, observatory, [0, 2.2, 0]);
        box(observatory, .22, .15, 3.3, 0xb0bec1, 0, 2.45, 0);
        mesh(new T.CylinderGeometry(.2, .3, 1.7, 12), 0xcbb381, observatory, [.5, 2.8, .7]).rotation.x = 1;
        box(observatory, .7, 1.3, .12, 0x365969, 0, .7, 1.6);
        root.add(observatory);
        const lighthouse = new T.Group();
        lighthouse.position.set(-4.5, heightAt(-4.5, -2.6), -2.6);
        mesh(new T.CylinderGeometry(.55, .95, 4.5, 12), 0xb8c4c7, lighthouse, [0, 2.2, 0]);
        mesh(new T.CylinderGeometry(.85, .85, .65, 12), 0xd7c48b, lighthouse, [0, 4.6, 0]);
        mesh(new T.ConeGeometry(1.05, .65, 12), 0x5d7d91, lighthouse, [0, 5.25, 0]);
        root.add(lighthouse);
        for (let i = 0; i < 3; i++) {
            mesh(new T.CylinderGeometry(.18, .25, 1.1, 8), 0x7f98a1, root, [-1.7 + i * .65, .8, -3.7]);
            mesh(new T.TorusGeometry(.25, .045, 6, 16), 0xd1b97e, root, [-1.7 + i * .65, 1.6, -3.7]);
        }
    }
    return batchStatic(root);
}
export function boat() { const root = new T.Group(); root.position.set(-5, -.05, 6.15); const s = new T.Shape(); s.moveTo(-.7, 0); s.quadraticCurveTo(-.8, 1.4, 0, 1.9); s.quadraticCurveTo(.8, 1.4, .7, 0); s.closePath(); const hull = mesh(new T.ExtrudeGeometry(s, { depth: .35, bevelEnabled: true, bevelSize: .14, bevelThickness: .12, bevelSegments: 3 }), 0x876747, root); hull.rotation.x = Math.PI / 2; hull.position.z = -.5; box(root, .08, 2.2, .08, 0x8c795b, 0, 1, 0); const sail = new T.Shape(); sail.moveTo(0, 0); sail.lineTo(0, 1.7); sail.quadraticCurveTo(1, .5, .65, 0); sail.closePath(); mesh(new T.ShapeGeometry(sail), 0xeee1be, root, [.07, .4, 0]).material.side = T.DoubleSide; box(root, 1.05, .08, .2, 0xc9ad7b, 0, .17, .2); return root; }
export function swords(player: T.Group) { for (const side of [-1, 1]) {
    const sword = new T.Group();
    sword.position.set(side * .27, .45, -.19);
    sword.rotation.z = side * .45;
    box(sword, .07, .85, .07, 0x304b53, 0, -.15, 0);
    box(sword, .3, .055, .12, palette.gold, 0, .29, 0);
    box(sword, .065, .3, .07, 0x7e493c, 0, .45, 0);
    player.add(sword);
} player.scale.setScalar(1.22); }
