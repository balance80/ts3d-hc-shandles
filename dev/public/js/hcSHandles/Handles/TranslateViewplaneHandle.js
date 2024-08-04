import { StandardHandle, handleType } from './StandardHandle.js';
import * as utility from '../utility.js';

export class TranslateViewplaneHandle extends StandardHandle {
  constructor(group, color) {
    super(group);
    this._type = handleType.translateViewplane;
    this._color = color;
  }

  async show() {
    let viewer = this._group.getViewer();
    this._nodeid = viewer.model.createNode(this._group._topNode, 'translateViewplaneHandle');

    if (!this._group.getManager()._sphereMesh) {
      this._group.getManager()._sphereMesh = await utility.createSphereMesh(viewer);
    }

    let myMeshInstanceData = new Communicator.MeshInstanceData(this._group.getManager()._sphereMesh);
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);

    let scalematrix = new Communicator.Matrix();
    scalematrix.setScaleComponent(0.015, 0.015, 0.015);
    await viewer.model.setNodeMatrix(this._nodeid, scalematrix);
    viewer.model.setNodesFaceColor([this._nodeid], this._color);
    await super.show();
  }

  async handleMouseMove(event) {
    let viewer = this._group.getViewer();

    let cameraplane = utility.getCameraPlane(viewer, this._startPosition);
    let ray = viewer.view.raycastFromPoint(event.getPosition());
    let planeIntersection = new Communicator.Point3();
    cameraplane.intersectsRay(ray, planeIntersection);

    let before;
    let after;
    for (let i = 0; i < this._startTargetMatrices.length; i++) {
      if (i == 0) {
        let p1 = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))
        ).transform(this._startPosition);
        let p2 = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))
        ).transform(planeIntersection);
        let delta2 = Communicator.Point3.subtract(p2, p1);
        let transmatrix = new Communicator.Matrix();

        if (this._group.getManager()._translateSnapping) {
          let snap = this._group.getManager()._translateSnapping;
          delta2.x = Math.round(delta2.x / snap) * snap;
          delta2.y = Math.round(delta2.y / snap) * snap;
          delta2.z = Math.round(delta2.z / snap) * snap;
        }

        transmatrix.setTranslationComponent(delta2.x, delta2.y, delta2.z);
        let netmatrix = Communicator.Matrix.multiply(
          this._startTargetMatrices[0],
          viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))
        );
        before = netmatrix.transform(new Communicator.Point3(0, 0, 0));
        await viewer.model.setNodeMatrix(this._group._targetNodes[i], Communicator.Matrix.multiply(this._startTargetMatrices[i], transmatrix));
        after = viewer.model.getNodeNetMatrix(this._group._targetNodes[i]).transform(new Communicator.Point3(0, 0, 0));
      } else {
        let invp = Communicator.Matrix.inverse(viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i])));
        let p1 = invp.transform(before);
        let p2 = invp.transform(after);
        let lfirst = Communicator.Point3.subtract(p2, p1);

        let transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(lfirst.x, lfirst.y, lfirst.z);

        let trans4 = Communicator.Matrix.multiply(this._startTargetMatrices[i], transmatrix);
        await viewer.model.setNodeMatrix(this._group._targetNodes[i], trans4);
      }
    }
    this._group._targetCenter = viewer.model.getNodeNetMatrix(this._group._targetNodes[0]).transform(this._group._targetCenterLocal);

    await this._group.updateHandle();
    await super.handleMouseMove(event);
  }
}
