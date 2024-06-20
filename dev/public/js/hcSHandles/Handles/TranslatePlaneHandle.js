import { StandardHandle, handleType } from "./StandardHandle.js";
import * as utility from "../utility.js";

export class TranslatePlaneHandle extends StandardHandle {
  constructor(group, axis, angle, color, axis2 = null, angle2 = null) {
    super(group);
    this._type = handleType.translatePlane;
    this._axis = axis;
    this._rotation = angle;
    this._axis2 = axis2;
    this._rotation2 = angle2;
    this._color = color;
  }

  async generateBaseGeometry() {
    let viewer = this._group.getViewer();

    this._group.getManager()._planeMesh = await utility.createPlaneMesh(
      viewer,
      0.05,
      -0.05,
      0.025
    );
  }

  async show() {
    let viewer = this._group.getViewer();

    let offaxismatrix1 = new Communicator.Matrix();
    let offaxismatrix2 = new Communicator.Matrix();
    if (this._axis) {
      Communicator.Util.computeOffaxisRotation(
        this._axis,
        this._rotation,
        offaxismatrix1
      );
    }
    if (this._axis2) {
      Communicator.Util.computeOffaxisRotation(
        this._axis2,
        this._rotation2,
        offaxismatrix2
      );
    }

    let offaxismatrix = Communicator.Matrix.multiply(
      offaxismatrix1,
      offaxismatrix2
    );

    this._nodeid = viewer.model.createNode(this._group._topNode, "");

    if (!this._group.getManager()._planeMesh) {
      await this.generateBaseGeometry();
    }

    let myMeshInstanceData = new Communicator.MeshInstanceData(
      this._group.getManager()._planeMesh
    );
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);
    if (this._axis) {
      viewer.model.setNodeMatrix(this._nodeid, offaxismatrix);
    }
    viewer.model.setNodesFaceColor([this._nodeid], this._color);

    await super.show();
  }

  async handleMouseMove(event) {
    let viewer = this._group.getViewer();
    let newpos = new Communicator.Point3(0, 0, 0);
    let newnormal = new Communicator.Point3(0, 0, 1);
    utility.rotatePointAndNormal(this._startmatrix, newpos, newnormal);

    let rplane = Communicator.Plane.createFromPointAndNormal(newpos, newnormal);

    let ray = viewer.view.raycastFromPoint(event.getPosition());
    let planeIntersection = new Communicator.Point3();
    rplane.intersectsRay(ray, planeIntersection);

    let before;
    let after;
    for (let i = 0; i < this._startTargetMatrices.length; i++) {
      if (i == 0) {
        let p1 = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(
            viewer.model.getNodeParent(this._group._targetNodes[i])
          )
        ).transform(this._startPosition);
        let p2 = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(
            viewer.model.getNodeParent(this._group._targetNodes[i])
          )
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
          viewer.model.getNodeNetMatrix(
            viewer.model.getNodeParent(this._group._targetNodes[i])
          )
        );
        before = netmatrix.transform(new Communicator.Point3(0, 0, 0));
        viewer.model.setNodeMatrix(
          this._group._targetNodes[i],
          Communicator.Matrix.multiply(
            this._startTargetMatrices[i],
            transmatrix
          )
        );
        after = viewer.model
          .getNodeNetMatrix(this._group._targetNodes[i])
          .transform(new Communicator.Point3(0, 0, 0));
      } else {
        let invp = Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(
            viewer.model.getNodeParent(this._group._targetNodes[i])
          )
        );
        let p1 = invp.transform(before);
        let p2 = invp.transform(after);
        let lfirst = Communicator.Point3.subtract(p2, p1);

        let transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(lfirst.x, lfirst.y, lfirst.z);

        let trans4 = Communicator.Matrix.multiply(
          this._startTargetMatrices[i],
          transmatrix
        );
        viewer.model.setNodeMatrix(this._group._targetNodes[i], trans4);
      }
    }
    this._group._targetCenter = viewer.model
      .getNodeNetMatrix(this._group._targetNodes[0])
      .transform(this._group._targetCenterLocal);

    this._group.updateHandle();
    super.handleMouseMove(event);
  }
}
