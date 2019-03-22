import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Coordinate } from './coordinate';

import * as p5 from "p5";

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.sass']
})
export class GlobeComponent implements OnInit {
  @ViewChild('canvas') canvas: ElementRef;
  private sketch: p5;
  private earthTexture: p5.Image;

  constructor() { }

  ngOnInit() {
    this.sketch = new p5(this.draw, this.canvas.nativeElement);
    console.log("created a sketch");
    console.log(this.sketch);
  }

  testEvent() {
    console.log("received click event from p5");
    console.log(this);
    console.log(this.sketch);
  }

  private onWindowResize() {
    this.sketch.resizeCanvas(this.sketch.windowWidth, this.sketch.windowHeight);
  }

  // TODO: fix any type for p
  private draw(p: any) {
    p.r = 250;
    p.coordinates = [
      { lat: -33.8688, long: 151.2093 }, // Sydney, Australia
      { lat: 35.6762, long: 139.6503 },  // Tokyo, Japan
      { lat: 40.7128, long: -74.0060 },  // New York, USA
      { lat: 26.8206, long: 30.8025 }    // Somewhere, Egypt
    ];

    p.preload = () => {
      p.img = p.loadImage('../assets/img/earthDark.jpg');
    }

    p.setup = () => {
      const cnv = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      // work around needed to remove weird 30px offset
      cnv.canvas.style.display = 'block';
    }

    p.draw = () => {
      p.background(0);
      p.camera(0, 0, 600, 0, 0, 0, 0, 1, 0);
      p.rotateY(p.frameCount * -0.001);
      p.noStroke();
      p.texture(p.img);
      p.sphere(250);

      p.drawCoordinates();
    }

    p.drawCoordinates = () => {
      for (let coordinate of p.coordinates) {
        const lat = p.radians(coordinate.lat);
        const long = p.radians(coordinate.long);

        //convert to cartesian coordinates
        var x = p.r * Math.cos(lat) * Math.sin(long + p.radians(180));
        var y = p.r * Math.sin(-lat);
        var z = p.r * Math.cos(lat) * Math.cos(long + p.radians(180));

        // draw coordiante
        p.push();
        p.translate(x, y, z);
        p.fill("red");
        p.sphere(5, 5, 5);
        p.pop();
      }
    }
  }

}
