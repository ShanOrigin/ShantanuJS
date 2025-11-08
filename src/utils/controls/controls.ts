/*
import Events from "../events/events.js";
import { Line , Polyline , Polygon , Path, Rect , Circle , Ellipse } from "../../shapes/provider/shapes.js";
import { Group  } from "../collection/Group.js";

type AllowedShapes = Line | Polyline | Polygon | Path | Rect | Circle | Ellipse | Group ;


export class Controls extends Events {
  #controlTypes! : string  ;
  #controls!: SVGElement[] ;
  #shape! : AllowedShapes ; 


	
		async #addControls( type : string ,  shape : AllowedShapes  ) {
      this.#controlTypes = type ;
			this.#shape = shape ;

			this.#controls[0]

			

			await this.#waitForParent();



			const parent = this.#shape.fig.parentNode as HTMLElement;
			const id = parent?.getAttribute('name');
			if (!id) return;
			parent.

			const controls = parent.querySelector(`#${id}controls`);
			controls.
			this.#controlsChannel = parent.querySelector(`#${id}thread`);

			const pathRect = this.#controlsChannel?.querySelector(`#${id}pathrect`);
			const pathLine = this.#controls?.querySelector(`#${id}connector`);

			const box = this.#shape.fig && this.#shape.fig.BBox();
			if (!box || !pathRect || !pathLine || !this.#controls) return;

			const {
				x,
				y,
				width: w,
				height: h
			} = box as {
				x: number;
				y: number;
				width: number;
				height: number;
			};

			const commonProps = {
				'stroke-width': 1,
				stroke: 'rgba(87, 233, 255, 0.8)',
				fill: 'none',
				visibility: 'visible'
			};
	
			const sw = commonProps['stroke-width'];
			const s = (this.#shape.style && this.#shape.style['stroke-width']) || 0;
			const [nx, ny, nw, nh] = [
				x - s / 2 - sw / 2,
				y - s / 2 - sw / 2,
				w + s + sw,
				h + s + sw
			];
			this.#setter(pathRect, {
				x: nx,
				y: ny,
				width: nw,
				height: nh,
				...commonProps
			});

			const bbox = pathRect.getBBox();
			if (!bbox) return;

			const {
				x: bx,
				y: by,
				width: bw,
				height: bh
			} = bbox as {
				x: number;
				y: number;
      width: number;
      height: number;
    };

    this.#setter(pathLine, {
      x1: bx + bw / 2,
      y1: by,
      x2: bx + bw / 2,
      y2: by - 10,
      ...commonProps
    });

    const side = 5;

    const rectPoints = [
      [bx - side / 2, by - side / 2],
      [bx - side / 2, by + bh / 2 - side / 2],
      [bx - side / 2, by + bh - side / 2],
      [bx + bw / 2 - side / 2, by + bh - side / 2],
      [bx + bw - side / 2, by + bh - side / 2],
      [bx + bw - side / 2, by + bh / 2 - side / 2],
      [bx + bw - side / 2, by - side / 2],
      [bx + bw / 2 - side / 2, by - side / 2],
      [bx + bw / 2 - side / 2, by - side / 2 - 10]
    ];

    rectPoints.forEach(([px, py], index) => {
      const controlRect = this.#shape.#controls!.querySelector(
        `#${id}control${index}`
      );
      this.#setter(controlRect, {
        x: px,
        y: py,
        width: side,
        height: side,
        ...commonProps
      });
    });

    parent.appendChild(this.#shape.#controls);
  }

  #setter(fig: SVGElement | null, Obj: Object): void {
    if (!fig) {
      console.warn('Setter called on null element', Obj);
      return;
    }
    Object.entries(Obj).forEach(([k, v]) => {
      fig.setAttribute(k, String(v));
    });
  }

  #waitForParent(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.#shape.fig.parentNode) {
          resolve();
        } else {
          setTimeout(check, 10); // check again after 10ms
        }
      };
      check(); // start checking
    });
  }


}

*/

/*
 *

import { Rect , Circle  } from "../../shapes/provider/shapes.js";

export class Control{
   #classObjectRef!: Rect | Circle ;	

	 constructor(type : string , command : string ="A" , props : Object ={}){
  



	 }
	 #createControls(type : string){
    

	 }

}




export class Controls {
  #shape: any;
  #controls: any;
  #controlsChannel: any;

  constructor(shape: any) {
    this.#shape = shape;
  }
  async #addControls() {
    await this.#waitForParent();

    const parent = this.#shape.fig.parentNode as HTMLElement;
    const id = parent?.getAttribute('name');
    if (!id) return;

    this.#controls = parent.querySelector(`#${id}controls`);
    this.#controlsChannel = parent.querySelector(`#${id}thread`);

    const pathRect = this.#controlsChannel?.querySelector(`#${id}pathrect`);
    const pathLine = this.#controls?.querySelector(`#${id}connector`);

    const box = this.#shape.fig && this.#shape.fig.BBox();
    if (!box || !pathRect || !pathLine || !this.#controls) return;

    const {
      x,
      y,
      width: w,
      height: h
    } = box as {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    const commonProps = {
      'stroke-width': 1,
      stroke: 'rgba(87, 233, 255, 0.8)',
      fill: 'none',
      visibility: 'visible'
    };

    const sw = commonProps['stroke-width'];
    const s = (this.#shape.style && this.#shape.style['stroke-width']) || 0;
    const [nx, ny, nw, nh] = [
      x - s / 2 - sw / 2,
      y - s / 2 - sw / 2,
      w + s + sw,
      h + s + sw
    ];
    this.#setter(pathRect, {
      x: nx,
      y: ny,
      width: nw,
      height: nh,
      ...commonProps
    });

    const bbox = pathRect.getBBox();
    if (!bbox) return;

    const {
      x: bx,
      y: by,
      width: bw,
      height: bh
    } = bbox as {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    this.#setter(pathLine, {
      x1: bx + bw / 2,
      y1: by,
      x2: bx + bw / 2,
      y2: by - 10,
      ...commonProps
    });

    const side = 5;

    const rectPoints = [
      [bx - side / 2, by - side / 2],
      [bx - side / 2, by + bh / 2 - side / 2],
      [bx - side / 2, by + bh - side / 2],
      [bx + bw / 2 - side / 2, by + bh - side / 2],
      [bx + bw - side / 2, by + bh - side / 2],
      [bx + bw - side / 2, by + bh / 2 - side / 2],
      [bx + bw - side / 2, by - side / 2],
      [bx + bw / 2 - side / 2, by - side / 2],
      [bx + bw / 2 - side / 2, by - side / 2 - 10]
    ];

    rectPoints.forEach(([px, py], index) => {
      const controlRect = this.#shape.#controls!.querySelector(
        `#${id}control${index}`
      );
      this.#setter(controlRect, {
        x: px,
        y: py,
        width: side,
        height: side,
        ...commonProps
      });
    });

    parent.appendChild(this.#shape.#controls);
  }

  #setter(fig: SVGElement | null, Obj: Object): void {
    if (!fig) {
      console.warn('Setter called on null element', Obj);
      return;
    }
    Object.entries(Obj).forEach(([k, v]) => {
      fig.setAttribute(k, String(v));
    });
  }

  #waitForParent(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.#shape.fig.parentNode) {
          resolve();
        } else {
          setTimeout(check, 10); // check again after 10ms
        }
      };
      check(); // start checking
    });
  }
}




*/
