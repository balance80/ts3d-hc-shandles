import { StandardHandle, handleType } from './StandardHandle.js';
import Quaternion from '../quaternion.min.js';
import * as utility from '../utility.js';

export class RotateTrackballHandle extends StandardHandle {
  constructor(group, color, opacity) {
    super(group);
    this._type = handleType.axisTrackball;
    this._color = color;
    this._opacity = opacity;
  }

  async show() {
    let viewer = this._group.getViewer();
    this._nodeid = viewer.model.createNode(this._group._topNode, 'rotateTrackballHandle');

    if (!this._group.getManager()._sphereMesh) {
      this._group.getManager()._sphereMesh = await utility.createSphereMesh(viewer);
    }

    let myMeshInstanceData = new Communicator.MeshInstanceData(this._group.getManager()._sphereMesh);
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);

    let scalematrix = new Communicator.Matrix();
    scalematrix.setScaleComponent(0.14, 0.14, 0.14);
    viewer.model.setNodeMatrix(this._nodeid, scalematrix);
    viewer.model.setNodesFaceColor([this._nodeid], this._color);
    viewer.model.setNodesOpacity([this._nodeid], this._opacity);

    await super.show();
  }

  async handleMouseMove(event) {
    let viewer = this._group.getViewer();
    let config = new Communicator.PickConfig(Communicator.SelectionMask.Line);
    config.restrictToOverlays = true;
    const selection = await viewer.view.pickFromPoint(event.getPosition(), config);
    if (selection.getPosition()) {
      let pos = selection.getPosition();
      let d1 = Communicator.Point3.subtract(this._startPosition, this._group._targetCenter);
      d1.normalize();
      let d2 = Communicator.Point3.subtract(pos, this._group._targetCenter);
      d2.normalize();

      for (let i = 0; i < this._startTargetMatrices.length; i++) {
        let d1n = utility.rotateNormal(
          Communicator.Matrix.inverse(viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))),
          d1
        );
        let d2n = utility.rotateNormal(
          Communicator.Matrix.inverse(viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))),
          d2
        );

        let cq = Quaternion.fromBetweenVectors([d1n.x, d1n.y, d1n.z], [d2n.x, d2n.y, d2n.z]);
        let cquat = new Communicator.Quaternion(cq.x, cq.y, cq.z, cq.w);
        let qmat2 = Communicator.Quaternion.toMatrix(cquat);

        let center = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(viewer.model.getNodeParent(this._group._targetNodes[i]))
        ).transform(this._group._targetCenter);

        viewer.model.setNodeMatrix(
          this._group._targetNodes[i],
          utility.performSubnodeRotation(center, this._startTargetMatrices[i], qmat2)
        );
      }

      this._group.updateHandle();
      super.handleMouseMove(event);
    }
  }
}
