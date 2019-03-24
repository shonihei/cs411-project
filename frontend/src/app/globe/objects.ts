import * as THREE from 'three';

export class LatLong {
    constructor(public lat: number, public long: number) { }
}

export class Article {
    public mesh: THREE.Mesh;
    public material: THREE.MeshBasicMaterial;
    private geometry: THREE.CircleGeometry;

    constructor(readonly latlong: LatLong) {
        this.geometry = new THREE.CircleGeometry(5, 32);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        // this.mesh.add(new THREE.AxesHelper(100));
    };

    public get latlongRad(): LatLong {
        return new LatLong(
            this.latlong.lat * (Math.PI / 180),
            -this.latlong.long * (Math.PI / 180)
        )
    }

    public setPosition(pos: THREE.Vector3) {
        this.mesh.position.set(pos.x, pos.y, pos.z);
    }

    public lookAwayFrom(target: THREE.Mesh) {
        const v = new THREE.Vector3();
        v.subVectors(this.mesh.position, target.position).add(this.mesh.position);
        this.mesh.lookAt(v);
    }
}

export class Globe {
    public mesh: THREE.Mesh;

    constructor(readonly RADIUS: number, readonly SEGMENTS: number, readonly RINGS: number,
        readonly TEXTURE: THREE.Texture, private scene: THREE.Scene) {
        const sphereGeometry = new THREE.SphereGeometry(this.RADIUS, this.SEGMENTS, this.RINGS);
        const material = new THREE.MeshBasicMaterial({ map: this.TEXTURE });
        // const material = new THREE.MeshBasicMaterial({ color: "yellow", wireframe: true});
        this.mesh = new THREE.Mesh(sphereGeometry, material);
    }

    public addToScene() {
        this.scene.add(this.mesh);
        this.scene.add(new THREE.AxesHelper(1000));
    }

    public addArticle(article: Article) {
        const latlongRad = article.latlongRad;
        const cartesianCoord = this.convertToCartesian(latlongRad);
        article.setPosition(cartesianCoord);
        article.lookAwayFrom(this.mesh);
        this.scene.add(article.mesh);
    }

    /**
     * converts geographic coordinate (in radians) to 3-dimensional cartesian coordinate
     * @param latlong latitude and longitude in radians
     */
    private convertToCartesian(latlong: LatLong): THREE.Vector3 {
        // convert degrees to radians
        return new THREE.Vector3(
            Math.cos(latlong.lat) * Math.cos(latlong.long) * this.RADIUS,
            Math.sin(latlong.lat) * this.RADIUS,
            Math.cos(latlong.lat) * Math.sin(latlong.long) * this.RADIUS
        );
    }
}