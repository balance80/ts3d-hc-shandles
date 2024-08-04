import { SHandleManager } from '../SHandleManager.js';

export const handleType = {
  axis: 0,
  axisViewplane: 1,
  axisTrackball: 2,
  translate: 3,
  translatePlane: 4,
  translateViewplane: 5,
  scale: 6,
  scaleAll: 7,
};

export class StandardHandle {
  constructor(group) {
    this._group = group;
    this._axis = [];
    this._nodeid = null;
  }

  getType() {
    return this._type;
  }

  show() {
    let viewer = this._group.getViewer();

    if (this._nodeid) {
      viewer.overlayManager.addNodes(SHandleManager.overlayIndex, [this._nodeid]);
      viewer.model.setInstanceModifier(Communicator.InstanceModifier.SuppressCameraScale, [this._nodeid], true);
      viewer.model.setInstanceModifier(Communicator.InstanceModifier.DoNotLight, [this._nodeid], true);
      viewer.model.setInstanceModifier(Communicator.InstanceModifier.ExcludeBounding, [this._nodeid], true);
      viewer.model.setInstanceModifier(Communicator.InstanceModifier.IgnoreCutting, [this._nodeid], true);
    }
  }

  update() {}

  cameraUpdate(camera) {}

  handleMouseDown(event, selection) {
    let viewer = this._group.getViewer();
    this._startmatrix = viewer.model.getNodeNetMatrix(this._nodeid);
    this._startTargetMatrices = [];
    for (let j = 0; j < this._group._targetNodes.length; j++) {
      this._startTargetMatrices.push(viewer.model.getNodeMatrix(this._group._targetNodes[j]));
    }
    this._group.getManager().setUndoPoint(this._group._targetNodes);
    this._startPosition = selection.getPosition();
    this._startPosition2D = event.getPosition();
  }

  async handleMouseMove(event) {
    await this._group.getManager().transmitEvent(this._group._targetNodes);
  }
}
