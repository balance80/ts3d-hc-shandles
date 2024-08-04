import { StandardHandle, handleType } from './StandardHandle.js';
import * as utility from '../utility.js';

export class TranslateHandle extends StandardHandle {
  constructor(group, axis, angle, color) {
    super(group);
    this._type = handleType.translate;
    this._axis = axis;
    this._rotation = angle;
    this._color = color;
  }

  async generateBaseGeometry() {
    let outpoints = [];
    outpoints.push(new Communicator.Point3(0, 0, 0));
    outpoints.push(new Communicator.Point3(0, 0, 0.15));

    //        let meshData = utility.calculateTubeMesh(outpoints,0.0045,10);
    let meshData = Communicator.Util.generateConeCylinderMeshData(0.0045, 10, 0.15, 0.0195, 0.03, 0.0);
    this._group.getManager()._arrowMesh = await this._group.getViewer().model.createMesh(meshData);
    let meshData2 = Communicator.Util.generateConeCylinderMeshData(0.0, 10, 0.15, 0.0195, 0.03, 0.0);
    this._group.getManager()._arrowMesh2 = await this._group.getViewer().model.createMesh(meshData2);
  }

  async show() {
    let viewer = this._group.getViewer();

    let offaxismatrix = new Communicator.Matrix();
    let offaxismatrix2 = new Communicator.Matrix();
    if (this._axis) {
      Communicator.Util.computeOffaxisRotation(this._axis, this._rotation, offaxismatrix);
      Communicator.Util.computeOffaxisRotation(this._axis, 180, offaxismatrix2);
    }

    if (!this._axis) {
      Communicator.Util.computeOffaxisRotation(new Communicator.Point3(0, 0, 1), -180, offaxismatrix2);
    }

    this._nodeid = viewer.model.createNode(this._group._topNode, 'translateHandle');

    if (!this._group.getManager()._arrowMesh) {
      await this.generateBaseGeometry();
    }

    let myMeshInstanceData = new Communicator.MeshInstanceData(this._group.getManager()._arrowMesh);
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);
    if (this._axis) {
      await viewer.model.setNodeMatrix(this._nodeid, offaxismatrix);
    }

    let myMeshInstanceData2 = new Communicator.MeshInstanceData(this._group.getManager()._arrowMesh2);
    let nodeid2 = await viewer.model.createMeshInstance(myMeshInstanceData2, this._nodeid);
    await viewer.model.setNodeMatrix(nodeid2, offaxismatrix2);

    viewer.model.setNodesFaceColor([this._nodeid], this._color);

    await super.show();
  }

  async handleMouseMove(event) {
    let viewer = this._group.getViewer();
    let newpos = new Communicator.Point3(0, 0, 0);
    let newnormal = new Communicator.Point3(0, 1, 0);
    utility.rotatePointAndNormal(this._startmatrix, newpos, newnormal);

    let rplane = Communicator.Plane.createFromPointAndNormal(newpos, newnormal);

    let ray = viewer.view.raycastFromPoint(event.getPosition());

    let newpos2 = new Communicator.Point3(0, 0, 0);
    let newnormal2 = new Communicator.Point3(0, 1, 0);
    utility.rotatePointAndNormal(this._startmatrix, newpos2, newnormal2);
    let spos = utility.nearestPointOnLine(newpos2, newnormal2, this._startPosition);

    let pointonline = utility.getClosestPoint(viewer, newpos2, newnormal2, event.getPosition());

    if (!pointonline) {
      return;
    }
    let before;
    let after;
    for (let i = 0; i < this._startTargetMatrices.length; i++) {
      if (i == 0) {
        let p1 = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))
        ).transform(spos);
        let p2 = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))
        ).transform(pointonline);
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
    super.handleMouseMove(event);
  }
}
