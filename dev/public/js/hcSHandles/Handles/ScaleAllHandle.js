import { StandardHandle, handleType } from './StandardHandle.js';
import * as utility from '../utility.js';

export class ScaleAllHandle extends StandardHandle {
  constructor(group, color) {
    super(group);
    this._type = handleType.scaleAll;
    this._color = color;
  }

  async show() {
    let viewer = this._group.getViewer();
    this._nodeid = viewer.model.createNode(this._group._topNode, 'scaleAllHandle');

    if (!this._group.getManager()._sphereMesh) {
      this._group.getManager()._sphereMesh = await utility.createSphereMesh(viewer);
    }

    let myMeshInstanceData = new Communicator.MeshInstanceData(this._group.getManager()._sphereMesh);
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);

    let scalematrix = new Communicator.Matrix();
    scalematrix.setScaleComponent(0.02, 0.02, 0.02);
    await viewer.model.setNodeMatrix(this._nodeid, scalematrix);
    viewer.model.setNodesFaceColor([this._nodeid], this._color);
    await super.show();
  }

  async handleMouseMove(event) {
    let viewer = this._group.getViewer();

    const el = viewer.getViewElement();
    let width = el.getBoundingClientRect().width;
    let d = event.getPosition().x - this._startPosition2D.x;

    d /= width / 3;

    if (1 + d < 0.2) {
      return;
    }

    for (let i = 0; i < this._startTargetMatrices.length; i++) {
      let smat = new Communicator.Matrix();

      smat.setScaleComponent(1 + d, 1 + d, 1 + d);

      let center = Communicator.Matrix.inverse(viewer.model.getNodeNetMatrix(this._group._targetNodes[i])).transform(
        this._group._targetCenter
      );

      let tmatrix = utility.createTranslationMatrix(center);
      let resmatrix1 = Communicator.Matrix.multiply(Communicator.Matrix.inverse(tmatrix), smat);
      let resmatrix2 = Communicator.Matrix.multiply(resmatrix1, tmatrix);
      let resmatrix3 = Communicator.Matrix.multiply(resmatrix2, this._startTargetMatrices[i]);

      await viewer.model.setNodeMatrix(this._group._targetNodes[i], resmatrix3);
    }
    await super.handleMouseMove(event);
  }
}
