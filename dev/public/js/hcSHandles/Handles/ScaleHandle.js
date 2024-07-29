import { StandardHandle, handleType } from './StandardHandle.js';
import * as utility from '../utility.js';

export class ScaleHandle extends StandardHandle {
  constructor(group, axis, rot, color) {
    super(group);
    this._type = handleType.scale;
    this._axis = axis;
    this._rotation = rot;
    this._color = color;
  }

  async generateBaseGeometry() {
    let viewer = this._group.getViewer();
    this._group.getManager()._cubeMesh = await utility.createCubeMesh(viewer, new Communicator.Point3(0, 0, 0.15), 0.025);

    let outpoints = [];
    outpoints.push(new Communicator.Point3(0, 0, 0));
    outpoints.push(new Communicator.Point3(0, 0, 0.15));

    let meshData = utility.calculateTubeMesh(outpoints, 0.0045, 10);
    this._group.getManager()._cubeMesh2 = await this._group.getViewer().model.createMesh(meshData);
  }

  async show() {
    let viewer = this._group.getViewer();

    let offaxismatrix = new Communicator.Matrix();
    if (this._axis) {
      Communicator.Util.computeOffaxisRotation(this._axis, this._rotation, offaxismatrix);
    }
    this._nodeid = viewer.model.createNode(this._group._topNode, 'scaleHandle');

    if (!this._group.getManager()._cubeMesh) {
      await this.generateBaseGeometry();
    }

    let myMeshInstanceData = new Communicator.MeshInstanceData(this._group.getManager()._cubeMesh);
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);

    myMeshInstanceData = new Communicator.MeshInstanceData(this._group.getManager()._cubeMesh2);
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);

    if (this._axis) {
      viewer.model.setNodeMatrix(this._nodeid, offaxismatrix);
    }
    viewer.model.setNodesFaceColor([this._nodeid], this._color);

    await super.show();
  }

  async handleMouseMove(event) {
    let viewer = this._group.getViewer();

    let newpos2 = new Communicator.Point3(0, 0, 0);
    let newnormal2 = new Communicator.Point3(0, 0, 1);
    utility.rotatePointAndNormal(this._startmatrix, newpos2, newnormal2);
    let spos = utility.nearestPointOnLine(newpos2, newnormal2, this._startPosition);

    let pointonline = utility.getClosestPoint(viewer, newpos2, newnormal2, event.getPosition());
    let delta1 = Communicator.Point3.subtract(spos, newpos2).length();
    let plane = Communicator.Plane.createFromPointAndNormal(spos, newnormal2);
    let delta = Communicator.Point3.subtract(pointonline, spos);
    let d;

    if (plane.determineSide(pointonline)) {
      d = delta.length() / delta1 / 2;
    } else {
      d = -delta.length() / delta1 / 2;
      if (d <= -0.9) {
        return;
      }
    }

    for (let i = 0; i < this._startTargetMatrices.length; i++) {
      let newnormal3;
      let resmatrix3;
      if (this._group._relative) {
        newnormal3 = utility.rotateNormal(viewer.model.getNodeMatrix(this._nodeid), new Communicator.Point3(0, 0, 1));
        let smat = new Communicator.Matrix();
        smat.setScaleComponent(1 + newnormal3.x * d, 1 + newnormal3.y * d, 1 + newnormal3.z * d);

        let center = Communicator.Matrix.inverse(viewer.model.getNodeNetMatrix(this._group._targetNodes[i])).transform(
          this._group._targetCenter
        );

        let tmatrix = utility.createTranslationMatrix(center);
        let resmatrix1 = Communicator.Matrix.multiply(Communicator.Matrix.inverse(tmatrix), smat);
        let resmatrix2 = Communicator.Matrix.multiply(resmatrix1, tmatrix);
        resmatrix3 = Communicator.Matrix.multiply(resmatrix2, this._startTargetMatrices[i]);
      } else {
        newnormal3 = utility.rotateNormal(viewer.model.getNodeNetMatrix(this._nodeid), new Communicator.Point3(0, 0, 1));
        let center = Communicator.Matrix.inverse(viewer.model.getNodeNetMatrix(this._group._targetNodes[i])).transform(
          this._group._targetCenter
        );

        let tmatrix = utility.createTranslationMatrix(center);
        let resmatrix1 = Communicator.Matrix.multiply(Communicator.Matrix.inverse(tmatrix), smat);
        let resmatrix2 = Communicator.Matrix.multiply(resmatrix1, tmatrix);
        resmatrix3 = Communicator.Matrix.multiply(this._startTargetMatrices[i], resmatrix2);
      }

      viewer.model.setNodeMatrix(this._group._targetNodes[i], resmatrix3);
    }
    super.handleMouseMove(event);
  }
}
