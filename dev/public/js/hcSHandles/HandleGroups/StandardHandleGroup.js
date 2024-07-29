export class StandardHandleGroup {
  constructor(manager) {
    this._manager = manager;
    this._viewer = manager._viewer;
    this._axisHandles = [];
    this._handles = [];
    this._targetNodes = null;
    this._relative = true;
  }

  getManager() {
    return this._manager;
  }

  getViewer() {
    return this._viewer;
  }

  remove() {
    this._viewer.model.deleteNode(this._handlenode);
  }

  setRelative(relative) {
    this._relative = relative;
    if (this._topNode) {
      this.updateHandle();
    }
  }

  getRelative() {
    return this._relative;
  }

  setAxisHandles(axisHandles) {
    this._axisHandles = axisHandles;
  }

  getAxisHandles() {
    return this._axisHandles;
  }

  cameraUpdate(camera) {
    for (let i = 0; i < this._handles.length; i++) {
      this._handles[i].cameraUpdate(camera);
    }
  }

  getHandle(nodeid) {
    for (let i = 0; i < this._handles.length; i++) {
      if (this._handles[i]._nodeid == nodeid) {
        return this._handles[i];
      }
    }
  }

  updateHandle() {
    let scaleMatrix = new Communicator.Matrix();
    scaleMatrix.setScaleComponent(this._manager._handleScale, this._manager._handleScale, this._manager._handleScale);

    let startRot = this._calculateStartMatrix();
    let center2 = this._targetCenter;
    let tmatrix2 = new Communicator.Matrix();
    tmatrix2.setTranslationComponent(center2.x, center2.y, center2.z);
    tmatrix2 = Communicator.Matrix.multiply(scaleMatrix, tmatrix2);

    let b = Communicator.Matrix.multiply(startRot, tmatrix2);
    this._viewer.model.setNodeMatrix(this._topNode, b);
    this._viewer.model.setNodeMatrix(this._topNode2, tmatrix2);
    for (let i = 0; i < this._handles.length; i++) {
      this._handles[i].update(this._viewer.view.getCamera());
    }
  }

  async show(nodeids, center = null, rotation = null) {
    this._targetNodes = nodeids;
    let scaleMatrix = new Communicator.Matrix();
    scaleMatrix.setScaleComponent(this._manager._handleScale, this._manager._handleScale, this._manager._handleScale);
    if (!center) {
      let bounds = await this._viewer.model.getNodesBounding(nodeids);
      this._targetCenter = bounds.center();
    } else {
      this._targetCenter = center.copy();
    }

    this._targetCenterLocal = Communicator.Matrix.inverse(this._viewer.model.getNodeNetMatrix(this._targetNodes[0])).transform(
      this._targetCenter
    );

    this._extraRotation = rotation;

    this._topNode = this._viewer.model.createNode(this._manager._handlenode, 'topNode');
    this._topNode2 = this._viewer.model.createNode(this._manager._handlenode, 'topNode2');
    let startRot = this._calculateStartMatrix();

    let tmatrix2 = new Communicator.Matrix();
    tmatrix2.setTranslationComponent(this._targetCenter.x, this._targetCenter.y, this._targetCenter.z);
    tmatrix2 = Communicator.Matrix.multiply(scaleMatrix, tmatrix2);

    let b = Communicator.Matrix.multiply(startRot, tmatrix2);

    this._viewer.model.setNodeMatrix(this._topNode, b);
    this._viewer.model.setNodeMatrix(this._topNode2, tmatrix2);
  }

  _calculateStartMatrix() {
    let normalizedMatrix = new Communicator.Matrix();
    if (this._relative) {
      let matrix = this._viewer.model.getNodeNetMatrix(this._targetNodes[0]).copy();
      let row1 = new Communicator.Point3(matrix.m[0], matrix.m[1], matrix.m[2]).normalize();
      let row2 = new Communicator.Point3(matrix.m[4], matrix.m[5], matrix.m[6]).normalize();
      let row3 = new Communicator.Point3(matrix.m[8], matrix.m[9], matrix.m[10]).normalize();

      normalizedMatrix.m[0] = row1.x;
      normalizedMatrix.m[1] = row1.y;
      normalizedMatrix.m[2] = row1.z;

      normalizedMatrix.m[4] = row2.x;
      normalizedMatrix.m[5] = row2.y;
      normalizedMatrix.m[6] = row2.z;

      normalizedMatrix.m[8] = row3.x;
      normalizedMatrix.m[9] = row3.y;
      normalizedMatrix.m[10] = row3.z;
    }

    if (this._extraRotation) {
      normalizedMatrix = Communicator.Matrix.multiply(this._extraRotation, normalizedMatrix);
    }

    return normalizedMatrix;
  }
}
