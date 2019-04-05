import { LatLong } from './latlong';

export interface Node {
  id: string;
  latlong: LatLong;
  data?: any;
}

interface Edge {
  dest: Node;
  distance: number;
}

export class LocationGraph {
  private adjList = new Map<Node, Edge[]>();
  nodes: Node[] = [];

  constructor() { }

  addNode(node: Node) {
    this.nodes.push(node);
    this.adjList.set(node, []);
    this.addEdges(node);
  }

  getEdges(node: Node): Edge[] {
    return this.adjList.get(node);
  }

  private addEdges(src: Node) {
    this.adjList.forEach((edges, node) => {
      if (node !== src) {
        const dist = this.getDistBetweenInKm(node.latlong, src.latlong);
        edges.push({
          dest: src,
          distance: dist
        });
        this.adjList.get(src).push({
          dest: node,
          distance: dist,
        });
      }
    });
  }

  sortEdges(src: Node): void {
    this.adjList.get(src).sort((edge1, edge2) => edge1.distance < edge2.distance ? -1 : 1);
  }

  /**
   * Calculates the distance between two coordinates using the Haversine Formula
   * Adapted from "Chuck" @ stackoverflow.com/questions/27928/calculate-distance
   *                        -between-two-latitude-longitude-points-haversine-formula
   * @param coord1 first coordinate
   * @param coord2 second coordinate
   */
  private getDistBetweenInKm(coord1: LatLong, coord2: LatLong): number {
    const R = 6371; // Radius of the earth in km
    const deltaRad = new LatLong(
      this.deg2rad(coord2.lat - coord1.lat),
      this.deg2rad(coord2.long - coord1.long)
    );
    const a =
      Math.sin(deltaRad.lat / 2) * Math.sin(deltaRad.lat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) *
      Math.sin(deltaRad.long / 2) * Math.sin(deltaRad.long / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
